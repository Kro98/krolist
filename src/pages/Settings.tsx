import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Save, Globe, Bell, Palette, User, Shield, ZoomIn, Info, RefreshCw, Download, Users, TrendingDown, Tag, Sparkles, Calendar, Package, Wand2 } from "lucide-react";
import { useLanguage, Language, Currency } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonner } from "sonner";
import { useImageZoom } from "@/hooks/useImageZoom";
import { APP_VERSION } from "@/config/version";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";

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
export default function Settings() {
  const {
    language,
    currency,
    setLanguage,
    setCurrency,
    t
  } = useLanguage();
  const {
    theme,
    setTheme,
    undertone,
    setUndertone,
    customHue,
    setCustomHue,
    isClassicMode,
    setIsClassicMode
  } = useTheme();
  const { user } = useAuth();
  const { isZoomEnabled, setIsZoomEnabled } = useImageZoom();
  const { preferences: notifPrefs, updatePreference: updateNotifPref } = useNotificationPreferences();
  const [notifications, setNotifications] = useState(true);
  const [priceDropAlerts, setPriceDropAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
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
  const {
    toast
  } = useToast();

  const BASE_INSTALL_COUNT = 31; // Starting count before tracking began

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
    // Check if running as installed PWA
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");
    setIsPWA(isStandalone);

    // Check notification permission
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }

    // Check for service worker updates
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

    // Fetch install count for PWA mode
    fetchInstallCount();
  }, []);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    // Check if user is in guest mode
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
      // Update username in profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ username })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update email if changed
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

    // If there's a waiting SW, activate it first then reload when controller changes.
    if (registration?.waiting) {
      const onControllerChange = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
        window.location.reload();
      };

      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Safety fallback.
      setTimeout(() => window.location.reload(), 2500);
      return;
    }

    await registration?.update();
    window.location.reload();
  };

  return (
    <div className="flex gap-6 items-start">
      <div className="flex-1 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
        </div>

        <div className="grid gap-6">
        {/* Appearance */}
        <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                {t('settings.appearance')}
              </CardTitle>
              <CardDescription>
                {t('settings.appearanceDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Classic Mode Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Wand2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="classic-mode" className="text-sm font-medium">
                      {language === 'ar' ? 'الوضع الكلاسيكي' : 'Classic Mode'}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {language === 'ar' ? 'استخدم التصميم الأصلي' : 'Use the original design style'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="classic-mode"
                  checked={isClassicMode}
                  onCheckedChange={setIsClassicMode}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center gap-4">
                <ThemeToggle />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="undertone">{t('settings.undertoneColor')}</Label>
                  <Select value={undertone} onValueChange={(value: any) => setUndertone(value)}>
                    <SelectTrigger id="undertone">
                      <SelectValue placeholder={t('settings.selectUndertone')} />
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
                </div>
                
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="image-zoom">{t('settings.imageZoom')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.imageZoomDesc')}
                    </p>
                  </div>
                  <Switch
                    id="image-zoom"
                    checked={isZoomEnabled}
                    onCheckedChange={setIsZoomEnabled}
                  />
                </div>
              </div>
              <Separator />
              
              {/* Speed Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="carousel-speed" className="flex items-center justify-between">
                    <span>{t('settings.carouselSpeed')}</span>
                    <span className="text-sm text-muted-foreground">{(carouselSpeed / 1000).toFixed(1)}s</span>
                  </Label>
                  <input
                    id="carousel-speed"
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
                    className="w-full accent-primary"
                  />
                  <p className="text-xs text-muted-foreground">{t('settings.carouselSpeedDesc')}</p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="title-scroll-speed" className="flex items-center justify-between">
                    <span>{t('settings.titleScrollSpeed')}</span>
                    <span className="text-sm text-muted-foreground">{titleScrollSpeed}s</span>
                  </Label>
                  <input
                    id="title-scroll-speed"
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
                    className="w-full accent-primary"
                  />
                  <p className="text-xs text-muted-foreground">{t('settings.carouselSpeedDesc')}</p>
                </div>
              </div>
              
              {/* Custom Hue Picker */}
              {undertone === 'custom' && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <Label htmlFor="hue-picker" className="flex items-center justify-between">
                    <span>{t('settings.customHue')} ({customHue}°)</span>
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                      style={{ backgroundColor: `hsl(${customHue}, 85%, 55%)` }}
                    />
                  </Label>
                  <div className="space-y-2">
                    <input
                      id="hue-picker"
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
                </div>
              )}
            </CardContent>
          </Card>

        {/* Language & Currency */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              {t('settings.languageCurrency')}
            </CardTitle>
            <CardDescription>
              {t('settings.languageDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">{t('settings.language')}</Label>
              <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('language.en')}</SelectItem>
                  <SelectItem value="ar">{t('language.ar')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{t('settings.currency')}</Label>
              <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
                <SelectTrigger>
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
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              {t('settings.notifications')}
            </CardTitle>
            <CardDescription>
              {t('settings.notificationsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="font-medium">{t('settings.priceDropAlerts')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.priceDropAlertsDesc')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.priceUpdates}
                  onCheckedChange={(checked) => updateNotifPref('priceUpdates', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="font-medium">{t('settings.promoAlerts') || 'Promo Code Alerts'}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.promoAlertsDesc') || 'Get notified about new promo codes and deals'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.promoAlerts}
                  onCheckedChange={(checked) => updateNotifPref('promoAlerts', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="font-medium">{t('settings.appUpdateAlerts') || 'App Update Alerts'}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.appUpdateAlertsDesc') || 'Get notified when new app features are available'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.appUpdates}
                  onCheckedChange={(checked) => updateNotifPref('appUpdates', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="font-medium">{t('settings.eventReminders') || 'Event Reminders'}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.eventRemindersDesc') || 'Get reminded about shopping events like Black Friday'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.eventReminders}
                  onCheckedChange={(checked) => updateNotifPref('eventReminders', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {t('settings.account')}
            </CardTitle>
            <CardDescription>
              {t('settings.accountDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('settings.email')}</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your.email@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">{t('settings.username')}</Label>
                <Input 
                  id="username" 
                  placeholder={t('settings.usernamePlaceholder')} 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={handleUpdateProfile} 
              disabled={loading}
              className="bg-gradient-primary hover:shadow-hover"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? t('settings.updating') : t('settings.updateAccount')}
            </Button>
          </CardContent>
        </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} className="bg-gradient-primary hover:shadow-hover transition-all duration-200">
              <Save className="h-4 w-4 mr-2" />
              {t('settings.saveSettings')}
            </Button>
          </div>

          {/* App Info & Version - Only shown in PWA */}
          {isPWA && (
            <Card className="shadow-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  {t('settings.appInfo')}
                </CardTitle>
                <CardDescription>
                  {t('settings.versionUpdates')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Version and Update */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{t('settings.currentVersion')}</p>
                    <p className="text-2xl font-bold text-primary">v{APP_VERSION}</p>
                  </div>
                  {hasUpdate ? (
                    <Button onClick={handleUpdate} className="bg-gradient-primary">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {t('settings.installUpdate')}
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t('settings.upToDate')}
                    </span>
                  )}
                </div>
                
                <Separator />

                {/* Install Count */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('settings.totalInstalls')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.usersInstalled')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-lg font-bold text-primary">
                    <Users className="h-5 w-5" />
                    <span className="tabular-nums">{animatedCount ?? '...'}</span>
                  </div>
                </div>
                
                <Separator />
                
                {/* Update Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('settings.updateNotifications')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.updateNotificationsDesc')}
                    </p>
                  </div>
                  {notificationsEnabled ? (
                    <div className="flex items-center gap-2 text-sm text-green-500">
                      <Bell className="h-4 w-4" />
                      {t('settings.enabled')}
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={handleEnableNotifications}>
                      <Bell className="h-4 w-4 mr-2" />
                      {t('settings.enable')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}