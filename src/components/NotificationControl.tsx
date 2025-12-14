import { useState, useEffect } from "react";
import { Bell, BellOff, RefreshCw, Package, TrendingDown, Tag, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { APP_VERSION } from "@/config/version";

interface NotificationSettings {
  newProducts: boolean;
  priceUpdates: boolean;
  promoCodes: boolean;
  appUpdates: boolean;
}

const NOTIFICATION_SETTINGS_KEY = "krolist_notification_settings";

export function NotificationControl() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications();
  
  const [settings, setSettings] = useState<NotificationSettings>({
    newProducts: true,
    priceUpdates: true,
    promoCodes: true,
    appUpdates: true,
  });
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load saved settings
    const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (saved) {
      setSettings(JSON.parse(saved));
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
  }, []);

  const handleUpdate = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      } else {
        await registration?.update();
        window.location.reload();
      }
    }
  };

  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: language === "ar" ? "غير مدعوم" : "Not Supported",
        description: language === "ar" 
          ? "المتصفح لا يدعم الإشعارات" 
          : "Your browser doesn't support push notifications",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const result = await subscribe();
    setIsLoading(false);

    if (result.success) {
      toast({
        title: language === "ar" ? "تم التفعيل" : "Enabled",
        description: language === "ar" 
          ? "سيتم إعلامك بالتحديثات الجديدة" 
          : "You'll be notified about new updates",
      });
    } else {
      toast({
        title: language === "ar" ? "فشل التفعيل" : "Failed",
        description: result.error || (language === "ar" ? "فشل تفعيل الإشعارات" : "Failed to enable notifications"),
        variant: "destructive",
      });
    }
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const permissionGranted = permission === 'granted' && isSubscribed;
  const someEnabled = Object.values(settings).some(Boolean) && permissionGranted;

  // Count active notifications for badge
  const hasNotification = hasUpdate || (someEnabled && permissionGranted);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          {someEnabled ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
          {hasNotification && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-primary rounded-full animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-background border-border">
        {/* Header with version */}
        <div className="px-3 py-2 flex items-center justify-between">
          <DropdownMenuLabel className="p-0">
            {language === "ar" ? "مركز الإشعارات" : "Notification Center"}
          </DropdownMenuLabel>
          <span className="text-xs text-muted-foreground">v{APP_VERSION}</span>
        </div>
        <DropdownMenuSeparator />
        
        {/* Update Alert - Most prominent */}
        {hasUpdate && (
          <>
            <DropdownMenuItem 
              onClick={handleUpdate} 
              className="cursor-pointer text-primary bg-primary/10 hover:bg-primary/20 flex items-center gap-3 py-3"
            >
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <RefreshCw className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{language === "ar" ? "تحديث متاح" : "Update Available"}</p>
                <p className="text-xs text-muted-foreground">
                  {language === "ar" ? "اضغط للتثبيت" : "Tap to install"}
                </p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Enable notifications prompt */}
        {!permissionGranted && (
          <>
            <DropdownMenuItem 
              onClick={requestPermission} 
              className="cursor-pointer flex items-center gap-3 py-3"
              disabled={isLoading}
            >
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{language === "ar" ? "تفعيل الإشعارات" : "Enable Notifications"}</p>
                <p className="text-xs text-muted-foreground">
                  {language === "ar" ? "احصل على تنبيهات فورية" : "Get instant alerts"}
                </p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Notification Settings */}
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            {language === "ar" ? "إعدادات الإشعارات" : "NOTIFICATION SETTINGS"}
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {language === "ar" ? "منتجات جديدة" : "New Products"}
                </span>
              </div>
              <Switch
                checked={settings.newProducts}
                onCheckedChange={() => toggleSetting("newProducts")}
                disabled={!permissionGranted}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {language === "ar" ? "تحديثات الأسعار" : "Price Updates"}
                </span>
              </div>
              <Switch
                checked={settings.priceUpdates}
                onCheckedChange={() => toggleSetting("priceUpdates")}
                disabled={!permissionGranted}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {language === "ar" ? "أكواد خصم جديدة" : "New Promo Codes"}
                </span>
              </div>
              <Switch
                checked={settings.promoCodes}
                onCheckedChange={() => toggleSetting("promoCodes")}
                disabled={!permissionGranted}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {language === "ar" ? "تحديثات التطبيق" : "App Updates"}
                </span>
              </div>
              <Switch
                checked={settings.appUpdates}
                onCheckedChange={() => toggleSetting("appUpdates")}
                disabled={!permissionGranted}
              />
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
