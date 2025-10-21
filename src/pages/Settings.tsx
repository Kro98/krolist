import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Save, Globe, Bell, Palette, User, Shield } from "lucide-react";
import { useLanguage, Language, Currency } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ShopManager } from "@/components/ShopManager";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonner } from "sonner";
import { AdSpace } from "@/components/AdSpace";
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
    setUndertone
  } = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [priceDropAlerts, setPriceDropAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [adPreference, setAdPreference] = useState<string>("");
  const {
    toast
  } = useToast();

  useEffect(() => {
    const storedPreference = localStorage.getItem("adblock-preference") || "not-set";
    setAdPreference(storedPreference);
  }, []);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
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
        
        sonner.success("Profile updated! Please check your new email to confirm the change.");
      } else {
        sonner.success("Profile updated successfully!");
      }
    } catch (error: any) {
      sonner.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAdPreferenceChange = (value: string) => {
    localStorage.setItem("adblock-preference", value);
    setAdPreference(value);
    toast({
      title: "Ad Preference Updated",
      description: value === "allow-ads" 
        ? "Ads will be shown to support the project" 
        : value === "block-ads"
        ? "Ads are blocked for this website"
        : "Ad preference reset",
    });
  };

  return (
    <div className="flex gap-6 items-start">
      <div className="flex-1 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
        </div>

        <div className="grid gap-6">
        {/* Language & Currency + Appearance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Language & Currency */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Language & Currency
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

          {/* Appearance */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                {t('settings.appearance')}
              </CardTitle>
              <CardDescription>
                Click for light or dark view
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <ThemeToggle />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="undertone">Undertone Color</Label>
                <Select value={undertone} onValueChange={(value: any) => setUndertone(value)}>
                  <SelectTrigger id="undertone">
                    <SelectValue placeholder="Select undertone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orange">Orange</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shop Management */}
        <ShopManager />

        {/* Ad Preferences */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Ad Preferences
            </CardTitle>
            <CardDescription>
              Manage your ad blocker settings for this website
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ad-preference">Ad Block Preference</Label>
              <Select value={adPreference} onValueChange={handleAdPreferenceChange}>
                <SelectTrigger id="ad-preference">
                  <SelectValue placeholder="Select your preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allow-ads">Allow Ads (Support the project)</SelectItem>
                  <SelectItem value="block-ads">Block Ads</SelectItem>
                  <SelectItem value="not-set">Not Set (Will ask again)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                Allowing ads helps us keep the project running and add more features. Thank you for your support!
              </p>
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
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  placeholder="Your Username" 
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
              {loading ? "Updating..." : "Update Account"}
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
        </div>
      </div>
      
      {/* Right Ad Space */}
      <AdSpace className="w-[350px] sticky top-6 hidden lg:block" height="h-[600px]" />
    </div>
  );
}