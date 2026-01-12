import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Save, Globe, Bell, Palette, User, ZoomIn, Info, RefreshCw, 
  Download, Users, TrendingDown, Tag, Sparkles, Calendar, 
  Wand2, Moon, Sun, Languages, DollarSign, Mail, UserCircle,
  Gauge, Type, ChevronRight, CheckCircle2, Settings2, Zap
} from "lucide-react";
import { useLanguage, Language, Currency } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonner } from "sonner";
import { useImageZoom } from "@/hooks/useImageZoom";
import { APP_VERSION } from "@/config/version";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { cn } from "@/lib/utils";

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

// Setting Row Component
interface SettingRowProps {
  icon: React.ReactNode;
  iconColor?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

function SettingRow({ icon, iconColor = "text-primary", title, description, children, className }: SettingRowProps) {
  return (
    <div className={cn(
      "group flex items-center justify-between p-4 rounded-xl",
      "bg-gradient-to-r from-muted/30 to-muted/10",
      "border border-border/40 hover:border-primary/30",
      "transition-all duration-300 hover:shadow-md hover:shadow-primary/5",
      className
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-2.5 rounded-xl bg-gradient-to-br from-background to-muted",
          "shadow-sm border border-border/50",
          "group-hover:scale-110 transition-transform duration-300"
        )}>
          <div className={iconColor}>{icon}</div>
        </div>
        <div className="space-y-0.5">
          <p className="font-medium text-foreground">{title}</p>
          {description && (
            <p className="text-sm text-muted-foreground max-w-[280px]">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  );
}

// Section Header Component
interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accentColor?: string;
}

function SectionHeader({ icon, title, description, accentColor = "from-primary/20 to-primary/5" }: SectionHeaderProps) {
  return (
    <div className={cn(
      "flex items-center gap-4 p-5 rounded-2xl mb-4",
      "bg-gradient-to-r", accentColor,
      "border border-border/30"
    )}>
      <div className="p-3 rounded-xl bg-primary/10 text-primary animate-pulse">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// Notification Toggle Component
interface NotificationToggleProps {
  icon: React.ReactNode;
  iconColor: string;
  bgColor: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function NotificationToggle({ icon, iconColor, bgColor, title, description, checked, onCheckedChange }: NotificationToggleProps) {
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-xl p-4",
      "border border-border/40 hover:border-primary/30",
      "transition-all duration-300 hover:shadow-lg hover:shadow-primary/5",
      checked ? "bg-gradient-to-r from-primary/5 to-transparent" : "bg-muted/20"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg transition-all duration-300",
            bgColor,
            checked ? "scale-110" : "scale-100"
          )}>
            <div className={iconColor}>{icon}</div>
          </div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="data-[state=checked]:bg-primary"
        />
      </div>
      {checked && (
        <div className="absolute top-2 right-12 text-primary animate-pulse">
          <CheckCircle2 className="h-3 w-3" />
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const { language, currency, setLanguage, setCurrency, t } = useLanguage();
  const { theme, undertone, setUndertone, customHue, setCustomHue } = useTheme();
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
  const { toast } = useToast();

  const BASE_INSTALL_COUNT = 31;

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
    
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    
    if (data) {
      setUsername(data.username);
    }
  };

  const handleSave = () => {
    toast({
      title: t('settings.settingsSaved'),
      description: t('settings.settingsSavedDesc')
    });
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

  const undertoneColors = [
    { value: 'orange', color: 'hsl(25, 95%, 53%)', label: t('settings.undertone.orange') },
    { value: 'blue', color: 'hsl(217, 91%, 60%)', label: t('settings.undertone.blue') },
    { value: 'green', color: 'hsl(142, 71%, 45%)', label: t('settings.undertone.green') },
    { value: 'purple', color: 'hsl(262, 83%, 58%)', label: t('settings.undertone.purple') },
    { value: 'red', color: 'hsl(0, 84%, 60%)', label: t('settings.undertone.red') },
  ];

  return (
    <div className="min-h-screen pb-10">
      {/* Animated Header */}
      <div className="relative overflow-hidden mb-10">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 animate-pulse" />
        <div className="relative py-8 md:py-10">
          <div className="flex items-center justify-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl animate-pulse" />
              <div className="relative p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                <Settings2 className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {t('settings.title')}
              </h1>
              <p className="text-muted-foreground mt-2 text-base md:text-lg">{t('settings.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* ===== APPEARANCE SECTION ===== */}
        <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <SectionHeader
            icon={<Palette className="h-6 w-6" />}
            title={t('settings.appearance')}
            description={t('settings.appearanceDesc')}
            accentColor="from-violet-500/10 to-pink-500/5"
          />
          
          <Card className="border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-6 space-y-4">
              {/* Theme Toggle Row */}
              <SettingRow
                icon={theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                iconColor="text-amber-500"
                title={t('settings.theme') || 'Theme'}
                description={language === 'ar' ? 'تبديل بين الوضع الفاتح والداكن' : 'Switch between light and dark mode'}
              >
                <ThemeToggle />
              </SettingRow>


              {/* Image Zoom */}
              <SettingRow
                icon={<ZoomIn className="h-5 w-5" />}
                iconColor="text-blue-500"
                title={t('settings.imageZoom')}
                description={t('settings.imageZoomDesc')}
              >
                <Switch
                  checked={isZoomEnabled}
                  onCheckedChange={setIsZoomEnabled}
                  className="data-[state=checked]:bg-blue-500"
                />
              </SettingRow>

              {/* Undertone Color Picker */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                    <Palette className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{t('settings.undertoneColor')}</p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'ar' ? 'اختر اللون الأساسي للتطبيق' : 'Choose the app accent color'}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {undertoneColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setUndertone(color.value as any)}
                      className={cn(
                        "relative w-10 h-10 rounded-xl transition-all duration-300",
                        "hover:scale-110 hover:shadow-lg",
                        undertone === color.value && "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                      )}
                      style={{ backgroundColor: color.color }}
                      title={color.label}
                    >
                      {undertone === color.value && (
                        <CheckCircle2 className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => setUndertone('custom')}
                    className={cn(
                      "relative w-10 h-10 rounded-xl transition-all duration-300",
                      "hover:scale-110 hover:shadow-lg border-2 border-dashed border-muted-foreground/30",
                      "bg-gradient-to-br from-red-500 via-green-500 to-blue-500",
                      undertone === 'custom' && "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                    )}
                    title={t('settings.undertone.custom')}
                  >
                    {undertone === 'custom' && (
                      <CheckCircle2 className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />
                    )}
                  </button>
                </div>

                {/* Custom Hue Picker */}
                {undertone === 'custom' && (
                  <div className="pt-4 space-y-3 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('settings.customHue')}</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-background shadow-lg"
                          style={{ backgroundColor: `hsl(${customHue}, 85%, 55%)` }}
                        />
                        <span className="text-sm text-muted-foreground font-mono">{customHue}°</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={customHue}
                      onChange={(e) => setCustomHue(parseInt(e.target.value))}
                      className="w-full h-3 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, 
                          hsl(0, 85%, 55%), hsl(60, 85%, 55%), hsl(120, 85%, 55%), 
                          hsl(180, 85%, 55%), hsl(240, 85%, 55%), hsl(300, 85%, 55%), hsl(360, 85%, 55%)
                        )`
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Speed Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{t('settings.carouselSpeed')}</span>
                    </div>
                    <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {(carouselSpeed / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="8000"
                    step="500"
                    value={carouselSpeed}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setCarouselSpeed(value);
                      localStorage.setItem('carouselSpeed', value.toString());
                      window.dispatchEvent(new CustomEvent('carouselSpeedChanged', { detail: value }));
                    }}
                    className="w-full accent-primary h-2 rounded-full"
                  />
                </div>
                
                <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Type className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{t('settings.titleScrollSpeed')}</span>
                    </div>
                    <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {titleScrollSpeed}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="1"
                    value={titleScrollSpeed}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setTitleScrollSpeed(value);
                      localStorage.setItem('titleScrollSpeed', value.toString());
                      document.documentElement.style.setProperty('--marquee-speed', `${value}s`);
                    }}
                    className="w-full accent-primary h-2 rounded-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ===== LANGUAGE & CURRENCY SECTION ===== */}
        <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <SectionHeader
            icon={<Globe className="h-6 w-6" />}
            title={t('settings.languageCurrency')}
            description={t('settings.languageDesc')}
            accentColor="from-blue-500/10 to-cyan-500/5"
          />
          
          <Card className="border-0 shadow-xl shadow-blue-500/5 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <Languages className="h-4 w-4 text-blue-500" />
                    <Label className="font-medium">{t('settings.language')}</Label>
                  </div>
                  <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🇺🇸</span>
                          {t('language.en')}
                        </div>
                      </SelectItem>
                      <SelectItem value="ar">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🇸🇦</span>
                          {t('language.ar')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <Label className="font-medium">{t('settings.currency')}</Label>
                  </div>
                  <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">{t('currency.USD')}</SelectItem>
                      <SelectItem value="SAR">{t('currency.SAR')}</SelectItem>
                      <SelectItem value="EGP">{t('currency.EGP')}</SelectItem>
                      <SelectItem value="AED">{t('currency.AED')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ===== NOTIFICATIONS SECTION ===== */}
        <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <SectionHeader
            icon={<Bell className="h-6 w-6" />}
            title={t('settings.notifications')}
            description={t('settings.notificationsDesc')}
            accentColor="from-amber-500/10 to-orange-500/5"
          />
          
          <Card className="border-0 shadow-xl shadow-amber-500/5 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NotificationToggle
                  icon={<TrendingDown className="h-4 w-4" />}
                  iconColor="text-emerald-500"
                  bgColor="bg-emerald-500/10"
                  title={t('settings.priceDropAlerts')}
                  description={t('settings.priceDropAlertsDesc')}
                  checked={notifPrefs.priceUpdates}
                  onCheckedChange={(checked) => updateNotifPref('priceUpdates', checked)}
                />
                
                <NotificationToggle
                  icon={<Tag className="h-4 w-4" />}
                  iconColor="text-orange-500"
                  bgColor="bg-orange-500/10"
                  title={t('settings.promoAlerts') || 'Promo Code Alerts'}
                  description={t('settings.promoAlertsDesc') || 'New promo codes'}
                  checked={notifPrefs.promoAlerts}
                  onCheckedChange={(checked) => updateNotifPref('promoAlerts', checked)}
                />
                
                <NotificationToggle
                  icon={<Sparkles className="h-4 w-4" />}
                  iconColor="text-blue-500"
                  bgColor="bg-blue-500/10"
                  title={t('settings.appUpdateAlerts') || 'App Updates'}
                  description={t('settings.appUpdateAlertsDesc') || 'New features'}
                  checked={notifPrefs.appUpdates}
                  onCheckedChange={(checked) => updateNotifPref('appUpdates', checked)}
                />
                
                <NotificationToggle
                  icon={<Calendar className="h-4 w-4" />}
                  iconColor="text-purple-500"
                  bgColor="bg-purple-500/10"
                  title={t('settings.eventReminders') || 'Event Reminders'}
                  description={t('settings.eventRemindersDesc') || 'Shopping events'}
                  checked={notifPrefs.eventReminders}
                  onCheckedChange={(checked) => updateNotifPref('eventReminders', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ===== ACCOUNT SECTION ===== */}
        <section className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <SectionHeader
            icon={<User className="h-6 w-6" />}
            title={t('settings.account')}
            description={t('settings.accountDesc')}
            accentColor="from-rose-500/10 to-pink-500/5"
          />
          
          <Card className="border-0 shadow-xl shadow-rose-500/5 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-rose-500" />
                    <Label htmlFor="email" className="font-medium">{t('settings.email')}</Label>
                  </div>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your.email@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
                
                <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4 text-pink-500" />
                    <Label htmlFor="username" className="font-medium">{t('settings.username')}</Label>
                  </div>
                  <Input 
                    id="username" 
                    placeholder={t('settings.usernamePlaceholder')} 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleUpdateProfile} 
                disabled={loading}
                className="w-full md:w-auto bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/30"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? t('settings.updating') : t('settings.updateAccount')}
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* ===== APP INFO SECTION (PWA Only) ===== */}
        {isPWA && (
          <section className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <SectionHeader
              icon={<Info className="h-6 w-6" />}
              title={t('settings.appInfo')}
              description={t('settings.versionUpdates')}
              accentColor="from-indigo-500/10 to-violet-500/5"
            />
            
            <Card className="border-0 shadow-xl shadow-indigo-500/5 bg-gradient-to-br from-card to-card/80 overflow-hidden">
              <CardContent className="p-6 space-y-4">
                {/* Version Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 border border-primary/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('settings.currentVersion')}</p>
                      <p className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        v{APP_VERSION}
                      </p>
                    </div>
                    {hasUpdate ? (
                      <Button 
                        onClick={handleUpdate} 
                        className="bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30 hover:shadow-xl transition-all duration-300"
                      >
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {t('settings.installUpdate')}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-full">
                        <CheckCircle2 className="h-4 w-4" />
                        {t('settings.upToDate')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/40 text-center">
                    <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-primary tabular-nums">
                      {animatedCount ?? '...'}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('settings.totalInstalls')}</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/40 text-center">
                    <Bell className="h-6 w-6 mx-auto mb-2" style={{ color: notificationsEnabled ? 'hsl(var(--primary))' : undefined }} />
                    <p className={cn(
                      "text-2xl font-bold",
                      notificationsEnabled ? "text-emerald-500" : "text-muted-foreground"
                    )}>
                      {notificationsEnabled ? (language === 'ar' ? 'مفعّل' : 'ON') : (language === 'ar' ? 'متوقف' : 'OFF')}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('settings.updateNotifications')}</p>
                    {!notificationsEnabled && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleEnableNotifications}
                        className="mt-2 text-xs"
                      >
                        {t('settings.enable')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* ===== SAVE BUTTON ===== */}
        <div className="flex justify-center pt-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <Button 
            onClick={handleSave} 
            size="lg"
            className="px-12 bg-gradient-to-r from-primary via-primary to-primary/80 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105"
          >
            <Zap className="h-5 w-5 mr-2" />
            {t('settings.saveSettings')}
          </Button>
        </div>
      </div>
    </div>
  );
}
