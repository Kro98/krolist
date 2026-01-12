import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Globe, Bell, Palette, User, Info, RefreshCw, Download, Users, TrendingDown, Tag, Sparkles, Calendar, Wand2, Check, Loader2, Volume2, Zap, Eye, Languages, CreditCard, SlidersHorizontal, Timer, Paintbrush } from "lucide-react";
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

// Setting item component with icon and animation
interface SettingItemProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  description?: string;
  children: React.ReactNode;
  saving?: boolean;
}

function SettingItem({ icon, iconBg, label, description, children, saving }: SettingItemProps) {
  return (
    <div className="group flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">{label}</Label>
            {saving && (
              <div className="flex items-center gap-1 text-xs text-primary animate-in fade-in slide-in-from-left-2 duration-200">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  );
}

export default function Settings() {
  const { language, currency, setLanguage, setCurrency, t } = useLanguage();
  const { theme, setTheme, undertone, setUndertone, customHue, setCustomHue, isClassicMode, setIsClassicMode } = useTheme();
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

  // Show save indicator briefly
  const showSaving = useCallback((key: string) => {
    setSavingState(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setSavingState(prev => ({ ...prev, [key]: false }));
      sonner.success(t('settings.settingsSaved'), { duration: 1500 });
    }, 500);
  }, [t]);

  // Auto-save handlers
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

  const handleClassicModeChange = (checked: boolean) => {
    setIsClassicMode(checked);
    showSaving('classicMode');
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

  // Debounced speed values for auto-save feedback
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
    <div className="min-h-screen pb-20">
      {/* Header with gradient */}
      <div className="relative overflow-hidden mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl" />
        
        <div className="relative py-8 px-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
              <SlidersHorizontal className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {t('settings.title')}
              </h1>
              <p className="text-muted-foreground">{t('settings.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Appearance Section */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10">
                <Palette className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('settings.appearance')}</CardTitle>
                <CardDescription>{t('settings.appearanceDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <SettingItem
              icon={<Wand2 className="h-4 w-4 text-violet-500" />}
              iconBg="bg-violet-500/10"
              label={language === 'ar' ? 'الوضع الكلاسيكي' : 'Classic Mode'}
              description={language === 'ar' ? 'استخدم التصميم الأصلي' : 'Use the original design style'}
              saving={savingState.classicMode}
            >
              <Switch checked={isClassicMode} onCheckedChange={handleClassicModeChange} />
            </SettingItem>

            <SettingItem
              icon={<Paintbrush className="h-4 w-4 text-pink-500" />}
              iconBg="bg-pink-500/10"
              label={t('settings.theme')}
              description={t('settings.appearanceDesc')}
            >
              <ThemeToggle />
            </SettingItem>

            <SettingItem
              icon={<Sparkles className="h-4 w-4 text-amber-500" />}
              iconBg="bg-amber-500/10"
              label={t('settings.undertoneColor')}
              saving={savingState.undertone}
            >
              <Select value={undertone} onValueChange={handleUndertoneChange}>
                <SelectTrigger className="w-32">
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
            </SettingItem>

            {undertone === 'custom' && (
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm">{t('settings.customHue')} ({customHue}°)</Label>
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-background shadow-sm transition-colors duration-300"
                    style={{ backgroundColor: `hsl(${customHue}, 85%, 55%)` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={customHue}
                  onChange={(e) => setCustomHue(parseInt(e.target.value))}
                  className="w-full hue-slider"
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

            <SettingItem
              icon={<Eye className="h-4 w-4 text-cyan-500" />}
              iconBg="bg-cyan-500/10"
              label={t('settings.imageZoom')}
              description={t('settings.imageZoomDesc')}
              saving={savingState.zoom}
            >
              <Switch checked={isZoomEnabled} onCheckedChange={handleZoomChange} />
            </SettingItem>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-blue-500" />
                  <Label className="flex items-center justify-between w-full">
                    <span>{t('settings.carouselSpeed')}</span>
                    <span className="text-sm text-muted-foreground">{(carouselSpeed / 1000).toFixed(1)}s</span>
                  </Label>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="8000"
                  step="500"
                  value={carouselSpeed}
                  onChange={(e) => handleCarouselSpeedChange(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <Label className="flex items-center justify-between w-full">
                    <span>{t('settings.titleScrollSpeed')}</span>
                    <span className="text-sm text-muted-foreground">{titleScrollSpeed}s</span>
                  </Label>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="1"
                  value={titleScrollSpeed}
                  onChange={(e) => handleTitleScrollSpeedChange(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language & Currency Section */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10">
                <Globe className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('settings.languageCurrency')}</CardTitle>
                <CardDescription>{t('settings.languageDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <SettingItem
              icon={<Languages className="h-4 w-4 text-blue-500" />}
              iconBg="bg-blue-500/10"
              label={t('settings.language')}
              saving={savingState.language}
            >
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('language.en')}</SelectItem>
                  <SelectItem value="ar">{t('language.ar')}</SelectItem>
                </SelectContent>
              </Select>
            </SettingItem>

            <SettingItem
              icon={<CreditCard className="h-4 w-4 text-green-500" />}
              iconBg="bg-green-500/10"
              label={t('settings.currency')}
              saving={savingState.currency}
            >
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">{t('currency.USD')}</SelectItem>
                  <SelectItem value="SAR">{t('currency.SAR')}</SelectItem>
                  <SelectItem value="EGP">{t('currency.EGP')}</SelectItem>
                  <SelectItem value="AED">{t('currency.AED')}</SelectItem>
                </SelectContent>
              </Select>
            </SettingItem>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10">
                <Bell className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('settings.notifications')}</CardTitle>
                <CardDescription>{t('settings.notificationsDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <SettingItem
              icon={<TrendingDown className="h-4 w-4 text-green-500" />}
              iconBg="bg-green-500/10"
              label={t('settings.priceDropAlerts')}
              description={t('settings.priceDropAlertsDesc')}
              saving={savingState.priceUpdates}
            >
              <Switch 
                checked={notifPrefs.priceUpdates} 
                onCheckedChange={(checked) => handleNotifPrefChange('priceUpdates', checked)} 
              />
            </SettingItem>

            <SettingItem
              icon={<Tag className="h-4 w-4 text-orange-500" />}
              iconBg="bg-orange-500/10"
              label={t('settings.promoAlerts')}
              description={t('settings.promoAlertsDesc')}
              saving={savingState.promoAlerts}
            >
              <Switch 
                checked={notifPrefs.promoAlerts} 
                onCheckedChange={(checked) => handleNotifPrefChange('promoAlerts', checked)} 
              />
            </SettingItem>

            <SettingItem
              icon={<Sparkles className="h-4 w-4 text-blue-500" />}
              iconBg="bg-blue-500/10"
              label={t('settings.appUpdateAlerts')}
              description={t('settings.appUpdateAlertsDesc')}
              saving={savingState.appUpdates}
            >
              <Switch 
                checked={notifPrefs.appUpdates} 
                onCheckedChange={(checked) => handleNotifPrefChange('appUpdates', checked)} 
              />
            </SettingItem>

            <SettingItem
              icon={<Calendar className="h-4 w-4 text-purple-500" />}
              iconBg="bg-purple-500/10"
              label={t('settings.eventReminders')}
              description={t('settings.eventRemindersDesc')}
              saving={savingState.eventReminders}
            >
              <Switch 
                checked={notifPrefs.eventReminders} 
                onCheckedChange={(checked) => handleNotifPrefChange('eventReminders', checked)} 
              />
            </SettingItem>
          </CardContent>
        </Card>

        {/* Account Section */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10">
                <User className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('settings.account')}</CardTitle>
                <CardDescription>{t('settings.accountDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">{t('settings.email')}</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your.email@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">{t('settings.username')}</Label>
                <Input 
                  id="username" 
                  placeholder={t('settings.usernamePlaceholder')} 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-muted/50"
                />
              </div>
            </div>
            <Button 
              onClick={handleUpdateProfile} 
              disabled={loading}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {loading ? t('settings.updating') : t('settings.updateAccount')}
            </Button>
          </CardContent>
        </Card>

        {/* App Info - Only shown in PWA */}
        {isPWA && (
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/80 border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Info className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('settings.appInfo')}</CardTitle>
                  <CardDescription>{t('settings.versionUpdates')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <div>
                  <p className="font-medium text-sm">{t('settings.currentVersion')}</p>
                  <p className="text-3xl font-bold text-primary">v{APP_VERSION}</p>
                </div>
                {hasUpdate ? (
                  <Button onClick={handleUpdate} className="bg-primary hover:bg-primary/90">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('settings.installUpdate')}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500" />
                    {t('settings.upToDate')}
                  </div>
                )}
              </div>

              <SettingItem
                icon={<Download className="h-4 w-4 text-primary" />}
                iconBg="bg-primary/10"
                label={t('settings.totalInstalls')}
                description={t('settings.usersInstalled')}
              >
                <div className="flex items-center gap-2 text-lg font-bold text-primary">
                  <Users className="h-5 w-5" />
                  <span className="tabular-nums">{animatedCount ?? '...'}</span>
                </div>
              </SettingItem>

              <SettingItem
                icon={<Bell className="h-4 w-4 text-blue-500" />}
                iconBg="bg-blue-500/10"
                label={t('settings.updateNotifications')}
                description={t('settings.updateNotificationsDesc')}
              >
                {notificationsEnabled ? (
                  <div className="flex items-center gap-2 text-sm text-green-500">
                    <Check className="h-4 w-4" />
                    {t('settings.enabled')}
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleEnableNotifications}>
                    <Bell className="h-4 w-4 mr-2" />
                    {t('settings.enable')}
                  </Button>
                )}
              </SettingItem>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}