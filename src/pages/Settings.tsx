import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Globe, Bell, Palette, User, Info, RefreshCw, Download, Users, TrendingDown, Tag, Sparkles, Calendar, Check, Loader2, Eye, Languages, CreditCard, Timer, Paintbrush, ChevronRight, Settings2, FileText } from "lucide-react";
import { useLanguage, Language, Currency } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonner } from "sonner";
import { useImageZoom } from "@/hooks/useImageZoom";
import { APP_VERSION } from "@/config/version";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Animated counter hook
function useAnimatedCounter(targetValue: number | null, duration: number = 800) {
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const previousValue = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (targetValue === null) return;

    if (previousValue.current === null) {
      setDisplayValue(targetValue);
      previousValue.current = targetValue;
      return;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startValue = previousValue.current;
    const startTime = performance.now();
    const difference = targetValue - startValue;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + difference * easeOut);
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = targetValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration]);

  return displayValue;
}

// Glass card section component
interface SettingsSectionProps {
  icon: React.ReactNode;
  iconGradient: string;
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
}

function SettingsSection({ icon, iconGradient, title, description, children, delay = 0 }: SettingsSectionProps) {
  return (
    <div 
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <div className="relative group">
        {/* Glow effect on hover */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-500" />
        
        <Card className="relative overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl shadow-lg">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
          
          <CardHeader className="relative pb-4">
            <div className="flex items-center gap-4">
              <div className={`relative p-3 rounded-xl ${iconGradient} shadow-lg`}>
                <div className="absolute inset-0 rounded-xl bg-white/10" />
                {icon}
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl font-semibold tracking-tight">{title}</CardTitle>
                <CardDescription className="text-sm mt-0.5">{description}</CardDescription>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            </div>
          </CardHeader>
          
          <CardContent className="relative space-y-2 pt-0">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Setting row component
interface SettingRowProps {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  description?: string;
  children: React.ReactNode;
  saving?: boolean;
}

function SettingRow({ icon, iconColor, label, description, children, saving }: SettingRowProps) {
  return (
    <div className="group/row flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 hover:bg-muted/60 border border-transparent hover:border-border/50 transition-all duration-200">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`p-2 rounded-lg ${iconColor} transition-transform duration-200 group-hover/row:scale-110`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{label}</span>
            {saving && (
              <div className="flex items-center gap-1 text-xs text-primary animate-in fade-in slide-in-from-left-2 duration-200">
                <Loader2 className="h-3 w-3 animate-spin" />
              </div>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">
        {children}
      </div>
    </div>
  );
}

// Slider control component
interface SliderControlProps {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: number;
  displayValue: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function SliderControl({ icon, iconColor, label, value, displayValue, min, max, step, onChange }: SliderControlProps) {
  return (
    <div className="p-4 rounded-xl bg-muted/40 border border-transparent hover:border-border/50 transition-colors space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconColor}`}>
            {icon}
          </div>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md">{displayValue}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
        />
      </div>
    </div>
  );
}

export default function Settings() {
  const { language, currency, setLanguage, setCurrency, t } = useLanguage();
  const { theme, setTheme, undertone, setUndertone, customHue, setCustomHue } = useTheme();
  const { user } = useAuth();
  const { isZoomEnabled, setIsZoomEnabled } = useImageZoom();
  const { preferences: notifPrefs, updatePreference: updateNotifPref } = useNotificationPreferences();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [carouselSpeed, setCarouselSpeed] = useState(() => {
    const saved = localStorage.getItem('carouselSpeed');
    return saved ? parseInt(saved) : 3000;
  });
  const [titleScrollSpeed, setTitleScrollSpeed] = useState(() => {
    const saved = localStorage.getItem('titleScrollSpeed');
    return saved !== null ? parseInt(saved) : 5;
  });
  const [hasUpdate, setHasUpdate] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [installCount, setInstallCount] = useState<number | null>(null);
  const animatedCount = useAnimatedCounter(installCount);
  const [savingState, setSavingState] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const BASE_INSTALL_COUNT = 31;

  const showSaving = useCallback((key: string) => {
    setSavingState(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setSavingState(prev => ({ ...prev, [key]: false }));
      sonner.success(t('settings.settingsSaved'), { duration: 1500 });
    }, 500);
  }, [t]);

  const handleLanguageChange = (value: Language) => {
    setLanguage(value);
    showSaving('language');
  };

  const handleCurrencyChange = (value: Currency) => {
    setCurrency(value);
    showSaving('currency');
  };

  const handleUndertoneChange = (value: any) => {
    setUndertone(value);
    showSaving('undertone');
  };

  const handleZoomChange = (checked: boolean) => {
    setIsZoomEnabled(checked);
    showSaving('zoom');
  };

  const handleCarouselSpeedChange = (value: number) => {
    setCarouselSpeed(value);
    localStorage.setItem('carouselSpeed', value.toString());
    window.dispatchEvent(new CustomEvent('carouselSpeedChanged', { detail: value }));
  };

  const handleTitleScrollSpeedChange = (value: number) => {
    setTitleScrollSpeed(value);
    localStorage.setItem('titleScrollSpeed', value.toString());
    document.documentElement.style.setProperty('--marquee-speed', `${value}s`);
  };

  const debouncedCarouselSpeed = useDebounce(carouselSpeed, 800);
  const debouncedTitleSpeed = useDebounce(titleScrollSpeed, 800);

  useEffect(() => {
    if (debouncedCarouselSpeed !== 3000) {
      showSaving('carouselSpeed');
    }
  }, [debouncedCarouselSpeed]);

  useEffect(() => {
    if (debouncedTitleSpeed !== 5) {
      showSaving('titleSpeed');
    }
  }, [debouncedTitleSpeed]);

  const fetchInstallCount = async () => {
    try {
      const { count, error } = await supabase
        .from('app_installs')
        .select('*', { count: 'exact', head: true });
      
      if (!error && count !== null) {
        setInstallCount(BASE_INSTALL_COUNT + count);
      } else {
        setInstallCount(BASE_INSTALL_COUNT);
      }
    } catch (error) {
      console.error('Error fetching install count:', error);
      setInstallCount(BASE_INSTALL_COUNT);
    }
  };

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");
    setIsPWA(isStandalone);

    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          setHasUpdate(true);
        });
      });

      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration?.waiting) {
          setHasUpdate(true);
        }
      });
    }

    fetchInstallCount();
  }, []);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const isGuest = localStorage.getItem('isGuest') === 'true';
    if (isGuest) {
      setUsername(t('user.guest'));
      return;
    }
    
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    
    if (data) {
      setUsername(data.username);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ username })
        .eq("id", user.id);

      if (profileError) throw profileError;

      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email
        });

        if (emailError) throw emailError;
        
        sonner.success(t('settings.profileUpdatedEmail'));
      } else {
        sonner.success(t('settings.profileUpdated'));
      }
    } catch (error: any) {
      sonner.error(error.message || t('settings.failedUpdate'));
    } finally {
      setLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) {
      toast({
        title: t('settings.notSupported'),
        description: t('settings.browserNoNotifications'),
        variant: "destructive",
      });
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");

    if (permission === "granted") {
      toast({
        title: t('settings.notificationsEnabled'),
        description: t('settings.notifiedAboutUpdates'),
      });
    }
  };

  const handleUpdate = async () => {
    if (!('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.getRegistration();

    if (registration?.waiting) {
      const onControllerChange = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
        window.location.reload();
      };

      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      setTimeout(() => window.location.reload(), 2500);
      return;
    }

    await registration?.update();
    window.location.reload();
  };

  const handleNotifPrefChange = (key: string, checked: boolean) => {
    updateNotifPref(key as any, checked);
    showSaving(key);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black,transparent)]" />
        
        <div className="relative py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl animate-pulse" />
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/25">
                  <Settings2 className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
                  {t('settings.title')}
                </h1>
                <p className="text-muted-foreground mt-1 text-lg">{t('settings.subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-6 -mt-2">
        {/* Appearance Section */}
        <SettingsSection
          icon={<Palette className="h-5 w-5 text-white" />}
          iconGradient="bg-gradient-to-br from-violet-500 to-purple-600"
          title={t('settings.appearance')}
          description={t('settings.appearanceDesc')}
          delay={0}
        >
          <SettingRow
            icon={<Paintbrush className="h-4 w-4 text-pink-500" />}
            iconColor="bg-pink-500/10"
            label={t('settings.theme')}
          >
            <ThemeToggle />
          </SettingRow>

          <SettingRow
            icon={<Sparkles className="h-4 w-4 text-amber-500" />}
            iconColor="bg-amber-500/10"
            label={t('settings.undertoneColor')}
            saving={savingState.undertone}
          >
            <Select value={undertone} onValueChange={handleUndertoneChange}>
              <SelectTrigger className="w-28 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orange">{t('settings.undertone.orange')}</SelectItem>
                <SelectItem value="blue">{t('settings.undertone.blue')}</SelectItem>
                <SelectItem value="green">{t('settings.undertone.green')}</SelectItem>
                <SelectItem value="purple">{t('settings.undertone.purple')}</SelectItem>
                <SelectItem value="red">{t('settings.undertone.red')}</SelectItem>
                <SelectItem value="custom">{t('settings.undertone.custom')}</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          {undertone === 'custom' && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-muted/60 to-muted/30 border border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">{t('settings.customHue')}</Label>
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{customHue}°</span>
                </div>
                <div 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-lg transition-all duration-300"
                  style={{ backgroundColor: `hsl(${customHue}, 85%, 55%)`, boxShadow: `0 4px 20px hsl(${customHue}, 85%, 55%, 0.4)` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={customHue}
                onChange={(e) => setCustomHue(parseInt(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-muted"
                style={{
                  background: `linear-gradient(to right, 
                    hsl(0, 85%, 55%), 
                    hsl(60, 85%, 55%), 
                    hsl(120, 85%, 55%), 
                    hsl(180, 85%, 55%), 
                    hsl(240, 85%, 55%), 
                    hsl(300, 85%, 55%), 
                    hsl(360, 85%, 55%)
                  )`
                }}
              />
            </div>
          )}

          <SettingRow
            icon={<Eye className="h-4 w-4 text-cyan-500" />}
            iconColor="bg-cyan-500/10"
            label={t('settings.imageZoom')}
            description={t('settings.imageZoomDesc')}
            saving={savingState.zoom}
          >
            <Switch checked={isZoomEnabled} onCheckedChange={handleZoomChange} />
          </SettingRow>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SliderControl
              icon={<Timer className="h-4 w-4 text-blue-500" />}
              iconColor="bg-blue-500/10"
              label={t('settings.carouselSpeed')}
              value={carouselSpeed}
              displayValue={`${(carouselSpeed / 1000).toFixed(1)}s`}
              min={1000}
              max={8000}
              step={500}
              onChange={handleCarouselSpeedChange}
            />

            <SliderControl
              icon={<Sparkles className="h-4 w-4 text-yellow-500" />}
              iconColor="bg-yellow-500/10"
              label={t('settings.titleScrollSpeed')}
              value={titleScrollSpeed}
              displayValue={`${titleScrollSpeed}s`}
              min={2}
              max={10}
              step={1}
              onChange={handleTitleScrollSpeedChange}
            />
          </div>
        </SettingsSection>

        {/* Language & Currency Section */}
        <SettingsSection
          icon={<Globe className="h-5 w-5 text-white" />}
          iconGradient="bg-gradient-to-br from-blue-500 to-cyan-500"
          title={t('settings.languageCurrency')}
          description={t('settings.languageDesc')}
          delay={100}
        >
          <SettingRow
            icon={<Languages className="h-4 w-4 text-blue-500" />}
            iconColor="bg-blue-500/10"
            label={t('settings.language')}
            saving={savingState.language}
          >
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-28 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('language.en')}</SelectItem>
                <SelectItem value="ar">{t('language.ar')}</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow
            icon={<CreditCard className="h-4 w-4 text-emerald-500" />}
            iconColor="bg-emerald-500/10"
            label={t('settings.currency')}
            saving={savingState.currency}
          >
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-28 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">{t('currency.USD')}</SelectItem>
                <SelectItem value="SAR">{t('currency.SAR')}</SelectItem>
                <SelectItem value="EGP">{t('currency.EGP')}</SelectItem>
                <SelectItem value="AED">{t('currency.AED')}</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </SettingsSection>

        {/* Notifications Section */}
        <SettingsSection
          icon={<Bell className="h-5 w-5 text-white" />}
          iconGradient="bg-gradient-to-br from-orange-500 to-red-500"
          title={t('settings.notifications')}
          description={t('settings.notificationsDesc')}
          delay={200}
        >
          <SettingRow
            icon={<TrendingDown className="h-4 w-4 text-green-500" />}
            iconColor="bg-green-500/10"
            label={t('settings.priceDropAlerts')}
            description={t('settings.priceDropAlertsDesc')}
            saving={savingState.priceUpdates}
          >
            <Switch 
              checked={notifPrefs.priceUpdates} 
              onCheckedChange={(checked) => handleNotifPrefChange('priceUpdates', checked)} 
            />
          </SettingRow>

          <SettingRow
            icon={<Tag className="h-4 w-4 text-orange-500" />}
            iconColor="bg-orange-500/10"
            label={t('settings.promoAlerts')}
            description={t('settings.promoAlertsDesc')}
            saving={savingState.promoAlerts}
          >
            <Switch 
              checked={notifPrefs.promoAlerts} 
              onCheckedChange={(checked) => handleNotifPrefChange('promoAlerts', checked)} 
            />
          </SettingRow>

          <SettingRow
            icon={<Sparkles className="h-4 w-4 text-blue-500" />}
            iconColor="bg-blue-500/10"
            label={t('settings.appUpdateAlerts')}
            description={t('settings.appUpdateAlertsDesc')}
            saving={savingState.appUpdates}
          >
            <Switch 
              checked={notifPrefs.appUpdates} 
              onCheckedChange={(checked) => handleNotifPrefChange('appUpdates', checked)} 
            />
          </SettingRow>

          <SettingRow
            icon={<Calendar className="h-4 w-4 text-purple-500" />}
            iconColor="bg-purple-500/10"
            label={t('settings.eventReminders')}
            description={t('settings.eventRemindersDesc')}
            saving={savingState.eventReminders}
          >
            <Switch 
              checked={notifPrefs.eventReminders} 
              onCheckedChange={(checked) => handleNotifPrefChange('eventReminders', checked)} 
            />
          </SettingRow>

          <SettingRow
            icon={<FileText className="h-4 w-4 text-cyan-500" />}
            iconColor="bg-cyan-500/10"
            label={t('settings.articleAlerts')}
            description={t('settings.articleAlertsDesc')}
            saving={savingState.articleAlerts}
          >
            <Switch 
              checked={notifPrefs.articleAlerts} 
              onCheckedChange={(checked) => handleNotifPrefChange('articleAlerts', checked)} 
            />
          </SettingRow>
        </SettingsSection>

        {/* Account Section */}
        <SettingsSection
          icon={<User className="h-5 w-5 text-white" />}
          iconGradient="bg-gradient-to-br from-emerald-500 to-teal-500"
          title={t('settings.account')}
          description={t('settings.accountDesc')}
          delay={300}
        >
          <div className="p-4 rounded-xl bg-muted/40 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  {t('settings.email')}
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your.email@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                  {t('settings.username')}
                </Label>
                <Input 
                  id="username" 
                  placeholder={t('settings.usernamePlaceholder')} 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>
            </div>
            <Button 
              onClick={handleUpdateProfile} 
              disabled={loading}
              className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-11"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {loading ? t('settings.updating') : t('settings.updateAccount')}
            </Button>
          </div>
        </SettingsSection>

        {/* App Info - Only shown in PWA */}
        {isPWA && (
          <SettingsSection
            icon={<Info className="h-5 w-5 text-white" />}
            iconGradient="bg-gradient-to-br from-primary to-primary/80"
            title={t('settings.appInfo')}
            description={t('settings.versionUpdates')}
            delay={400}
          >
            {/* Version Card */}
            <div className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('settings.currentVersion')}</p>
                  <p className="text-4xl font-bold text-primary mt-1">v{APP_VERSION}</p>
                </div>
                {hasUpdate ? (
                  <Button onClick={handleUpdate} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('settings.installUpdate')}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium">
                    <Check className="h-4 w-4" />
                    {t('settings.upToDate')}
                  </div>
                )}
              </div>
            </div>

            <SettingRow
              icon={<Download className="h-4 w-4 text-primary" />}
              iconColor="bg-primary/10"
              label={t('settings.totalInstalls')}
              description={t('settings.usersInstalled')}
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-bold">
                <Users className="h-4 w-4" />
                <span className="tabular-nums">{animatedCount ?? '...'}</span>
              </div>
            </SettingRow>

            <SettingRow
              icon={<Bell className="h-4 w-4 text-blue-500" />}
              iconColor="bg-blue-500/10"
              label={t('settings.updateNotifications')}
              description={t('settings.updateNotificationsDesc')}
            >
              {notificationsEnabled ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium">
                  <Check className="h-4 w-4" />
                  {t('settings.enabled')}
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={handleEnableNotifications} className="h-9">
                  <Bell className="h-4 w-4 mr-2" />
                  {t('settings.enable')}
                </Button>
              )}
            </SettingRow>
          </SettingsSection>
        )}
      </div>
    </div>
  );
}
