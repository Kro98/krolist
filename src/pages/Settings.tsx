import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Save, Globe, Bell, Palette, User } from "lucide-react";
import { useLanguage, Language, Currency } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function Settings() {
  const { language, currency, setLanguage, setCurrency, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [priceDropAlerts, setPriceDropAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: t('settings.settingsSaved'),
      description: t('settings.settingsSavedDesc'),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Language & Region */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              {t('settings.languageRegion')}
            </CardTitle>
            <CardDescription>
              {t('settings.languageDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <SelectItem value="EUR">{t('currency.EUR')}</SelectItem>
                    <SelectItem value="GBP">{t('currency.GBP')}</SelectItem>
                    <SelectItem value="CAD">{t('currency.CAD')}</SelectItem>
                    <SelectItem value="JPY">{t('currency.JPY')}</SelectItem>
                    <SelectItem value="AUD">{t('currency.AUD')}</SelectItem>
                    <SelectItem value="SAR">{t('currency.SAR')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
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
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications" className="text-base">{t('settings.enableNotifications')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.enableNotificationsDesc')}
                </p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="price-drops" className="text-base">{t('settings.priceDropAlerts')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.priceDropAlertsDesc')}
                  </p>
                </div>
                <Switch
                  id="price-drops"
                  checked={priceDropAlerts}
                  onCheckedChange={setPriceDropAlerts}
                  disabled={!notifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekly-reports" className="text-base">{t('settings.weeklyReports')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.weeklyReportsDesc')}
                  </p>
                </div>
                <Switch
                  id="weekly-reports"
                  checked={weeklyReports}
                  onCheckedChange={setWeeklyReports}
                  disabled={!notifications}
                />
              </div>
            </div>
          </CardContent>
        </Card>

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
            <div className="space-y-2">
              <Label htmlFor="theme">{t('settings.theme')}</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t('theme.light')}</SelectItem>
                  <SelectItem value="dark">{t('theme.dark')}</SelectItem>
                  <SelectItem value="system">{t('theme.system')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              {t('ui.display')}
            </CardTitle>
            <CardDescription>
              {t('ui.displayDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fontSize">{t('ui.fontSize')}</Label>
                <Select 
                  value={localStorage.getItem('fontSize') || 'medium'} 
                  onValueChange={(value) => {
                    localStorage.setItem('fontSize', value);
                    window.dispatchEvent(new Event('storage'));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">{t('ui.small')}</SelectItem>
                    <SelectItem value="medium">{t('ui.medium')}</SelectItem>
                    <SelectItem value="large">{t('ui.large')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="iconSize">{t('ui.iconSize')}</Label>
                <Select 
                  value={localStorage.getItem('iconSize') || 'medium'} 
                  onValueChange={(value) => {
                    localStorage.setItem('iconSize', value);
                    window.dispatchEvent(new Event('storage'));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">{t('ui.small')}</SelectItem>
                    <SelectItem value="medium">{t('ui.medium')}</SelectItem>
                    <SelectItem value="large">{t('ui.large')}</SelectItem>
                  </SelectContent>
                </Select>
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
                  defaultValue="user@example.com"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">{t('settings.displayName')}</Label>
                <Input
                  id="name"
                  placeholder="Your Name"
                  defaultValue="John Doe"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-gradient-primary hover:shadow-hover transition-all duration-200">
            <Save className="h-4 w-4 mr-2" />
            {t('settings.saveSettings')}
          </Button>
        </div>
      </div>
    </div>
  );
}