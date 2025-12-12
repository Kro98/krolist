import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Save, Globe, Bell, Palette, User, Shield, ZoomIn } from "lucide-react";
import { useLanguage, Language, Currency } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonner } from "sonner";
import { useImageZoom } from "@/hooks/useImageZoom";
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
    setCustomHue
  } = useTheme();
  const { user } = useAuth();
  const { isZoomEnabled, setIsZoomEnabled } = useImageZoom();
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
    return saved ? parseInt(saved) : 5;
  });
  const {
    toast
  } = useToast();

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
                Click for light or dark view
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <ThemeToggle />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="image-zoom">Image Zoom on Hover</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable zoom effect
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
                    <span>Carousel Auto-Scroll Speed</span>
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
                  <p className="text-xs text-muted-foreground">Lower = faster scrolling</p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="title-scroll-speed" className="flex items-center justify-between">
                    <span>Product Title Scroll Speed</span>
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
                  <p className="text-xs text-muted-foreground">Lower = faster scrolling</p>
                </div>
              </div>
              
              {/* Custom Hue Picker */}
              {undertone === 'custom' && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <Label htmlFor="hue-picker" className="flex items-center justify-between">
                    <span>Custom Hue ({customHue}°)</span>
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
    </div>
  );
}