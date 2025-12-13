import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
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
  const [settings, setSettings] = useState<NotificationSettings>({
    newProducts: true,
    priceUpdates: true,
    promoCodes: true,
    appUpdates: true,
  });
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    // Load saved settings
    const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (saved) {
      setSettings(JSON.parse(saved));
    }

    // Check notification permission
    if ("Notification" in window) {
      setPermissionGranted(Notification.permission === "granted");
    }
  }, []);

  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        title: language === "ar" ? "غير مدعوم" : "Not Supported",
        description: language === "ar" 
          ? "المتصفح لا يدعم الإشعارات" 
          : "Your browser doesn't support notifications",
        variant: "destructive",
      });
      return;
    }

    const permission = await Notification.requestPermission();
    setPermissionGranted(permission === "granted");

    if (permission === "granted") {
      toast({
        title: language === "ar" ? "تم التفعيل" : "Enabled",
        description: language === "ar" 
          ? "سيتم إعلامك بالتحديثات الجديدة" 
          : "You'll be notified about new updates",
      });
    }
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const allEnabled = Object.values(settings).every(Boolean);
  const someEnabled = Object.values(settings).some(Boolean);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          {someEnabled && permissionGranted ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
          {someEnabled && permissionGranted && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-primary rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-background border-border">
        <DropdownMenuLabel>
          {language === "ar" ? "إعدادات الإشعارات" : "Notification Settings"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
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
