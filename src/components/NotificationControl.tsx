import { useState, useEffect } from "react";
import { Bell, BellOff, RefreshCw } from "lucide-react";
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

  const allEnabled = Object.values(settings).every(Boolean);
  const someEnabled = Object.values(settings).some(Boolean) && permissionGranted;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          {someEnabled && permissionGranted ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
          {(someEnabled && permissionGranted || hasUpdate) && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-primary rounded-full animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-background border-border">
        <DropdownMenuLabel>
          {language === "ar" ? "إعدادات الإشعارات" : "Notification Settings"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {hasUpdate && (
          <>
            <DropdownMenuItem 
              onClick={handleUpdate} 
              className="cursor-pointer text-primary bg-primary/10 hover:bg-primary/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {language === "ar" ? "تحديث متاح - اضغط للتثبيت" : "Update available - tap to install"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {!permissionGranted && (
          <>
            <DropdownMenuItem onClick={requestPermission} className="cursor-pointer">
              <Bell className="h-4 w-4 mr-2" />
              {language === "ar" ? "تفعيل الإشعارات" : "Enable Notifications"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <div className="p-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {language === "ar" ? "منتجات جديدة" : "New Products"}
            </span>
            <Switch
              checked={settings.newProducts}
              onCheckedChange={() => toggleSetting("newProducts")}
              disabled={!permissionGranted}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {language === "ar" ? "تحديثات الأسعار" : "Price Updates"}
            </span>
            <Switch
              checked={settings.priceUpdates}
              onCheckedChange={() => toggleSetting("priceUpdates")}
              disabled={!permissionGranted}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {language === "ar" ? "أكواد خصم جديدة" : "New Promo Codes"}
            </span>
            <Switch
              checked={settings.promoCodes}
              onCheckedChange={() => toggleSetting("promoCodes")}
              disabled={!permissionGranted}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {language === "ar" ? "تحديثات التطبيق" : "App Updates"}
            </span>
            <Switch
              checked={settings.appUpdates}
              onCheckedChange={() => toggleSetting("appUpdates")}
              disabled={!permissionGranted}
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
