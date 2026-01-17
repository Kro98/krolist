import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Megaphone, Save, ShieldOff } from "lucide-react";

const TRIGGER_SETTINGS = [
  { key: 'trigger_page_open_enabled', label: 'Page Open', description: 'Show ad when opening a page' },
  { key: 'trigger_auth_event_enabled', label: 'Login/Logout', description: 'Show ad on authentication events' },
  { key: 'trigger_favorite_add_enabled', label: 'Add Favorites', description: 'Show ad when adding to favorites' },
  { key: 'trigger_refresh_enabled', label: 'Page Refresh', description: 'Show ad on page refresh' },
  { key: 'trigger_promo_copy_enabled', label: 'Copy Promo Code', description: 'Show ad when copying promo codes' },
  { key: 'trigger_shop_open_enabled', label: 'Open Shop', description: 'Show ad when opening shops' },
  { key: 'trigger_click_enabled', label: 'Click Events', description: 'Show ad on specific clicks' },
  { key: 'trigger_load_screen_enabled', label: 'Load Screen', description: 'Show ad on loading screens' },
];

const VISIBILITY_OPTIONS = [
  { value: 'all', label: 'All Users', description: 'Show ads to everyone' },
  { value: 'guests_only', label: 'Guests Only', description: 'Only show ads to non-logged in users' },
  { value: 'users_only', label: 'Logged-in Users Only', description: 'Only show ads to authenticated users (non-admin)' },
  { value: 'disabled', label: 'Disabled', description: 'No ads for anyone' },
];

export function AdSettingsManager() {
  const [visibilityMode, setVisibilityMode] = useState('all');
  const [cooldownSeconds, setCooldownSeconds] = useState(30);
  const [adsDisabledForAdmins, setAdsDisabledForAdmins] = useState(true);
  const [carouselAdsEnabled, setCarouselAdsEnabled] = useState(true);
  const [infeedAdFrequencyMobile, setInfeedAdFrequencyMobile] = useState(5);
  const [infeedAdFrequencyDesktop, setInfeedAdFrequencyDesktop] = useState(8);
  const [favoriteThreshold, setFavoriteThreshold] = useState(2);
  const [refreshThreshold, setRefreshThreshold] = useState(3);
  const [loadScreenThreshold, setLoadScreenThreshold] = useState(5);
  const [triggerStates, setTriggerStates] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Ad Block Detection Settings
  const [adBlockDetectionEnabled, setAdBlockDetectionEnabled] = useState(true);
  const [adBlockBannerEnabled, setAdBlockBannerEnabled] = useState(true);
  const [promptTitleEn, setPromptTitleEn] = useState("We noticed you're using an ad blocker");
  const [promptTitleAr, setPromptTitleAr] = useState("لاحظنا أنك تستخدم مانع إعلانات");
  const [promptDescriptionEn, setPromptDescriptionEn] = useState("Ads help keep Krolist free for everyone. They support our servers, development, and allow us to continue providing price tracking and deals for you.");
  const [promptDescriptionAr, setPromptDescriptionAr] = useState("الإعلانات تساعد في إبقاء كروليست مجاني للجميع. إنها تدعم خوادمنا وتطويرنا وتسمح لنا بالاستمرار في تقديم تتبع الأسعار والعروض لك.");
  const [bannerMessageEn, setBannerMessageEn] = useState("Enjoying Krolist? Ads help us stay free!");
  const [bannerMessageAr, setBannerMessageAr] = useState("هل تستمتع بكروليست؟ الإعلانات تساعدنا على البقاء مجانيين!");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      if (data) {
        const newTriggerStates: Record<string, boolean> = {};
        data.forEach((setting) => {
          if (setting.setting_key === 'ad_cooldown_seconds') {
            setCooldownSeconds(parseInt(setting.setting_value, 10));
          } else if (setting.setting_key === 'ads_disabled_for_admins') {
            setAdsDisabledForAdmins(setting.setting_value === 'true');
          } else if (setting.setting_key === 'carousel_ads_enabled') {
            setCarouselAdsEnabled(setting.setting_value === 'true');
          } else if (setting.setting_key === 'infeed_ad_frequency_mobile') {
            setInfeedAdFrequencyMobile(parseInt(setting.setting_value, 10));
          } else if (setting.setting_key === 'infeed_ad_frequency_desktop') {
            setInfeedAdFrequencyDesktop(parseInt(setting.setting_value, 10));
          } else if (setting.setting_key === 'favorite_count_threshold') {
            setFavoriteThreshold(parseInt(setting.setting_value, 10));
          } else if (setting.setting_key === 'refresh_count_threshold') {
            setRefreshThreshold(parseInt(setting.setting_value, 10));
          } else if (setting.setting_key === 'load_screen_count_threshold') {
            setLoadScreenThreshold(parseInt(setting.setting_value, 10));
          } else if (setting.setting_key === 'ad_visibility_mode') {
            setVisibilityMode(setting.setting_value);
          } else if (setting.setting_key.startsWith('trigger_')) {
            newTriggerStates[setting.setting_key] = setting.setting_value === 'true';
          } else if (setting.setting_key === 'adblock_detection_enabled') {
            setAdBlockDetectionEnabled(setting.setting_value === 'true');
          } else if (setting.setting_key === 'adblock_banner_enabled') {
            setAdBlockBannerEnabled(setting.setting_value === 'true');
          } else if (setting.setting_key === 'adblock_prompt_title_en') {
            setPromptTitleEn(setting.setting_value);
          } else if (setting.setting_key === 'adblock_prompt_title_ar') {
            setPromptTitleAr(setting.setting_value);
          } else if (setting.setting_key === 'adblock_prompt_description_en') {
            setPromptDescriptionEn(setting.setting_value);
          } else if (setting.setting_key === 'adblock_prompt_description_ar') {
            setPromptDescriptionAr(setting.setting_value);
          } else if (setting.setting_key === 'adblock_banner_message_en') {
            setBannerMessageEn(setting.setting_value);
          } else if (setting.setting_key === 'adblock_banner_message_ar') {
            setBannerMessageAr(setting.setting_value);
          }
        });
        setTriggerStates(newTriggerStates);
      }
    } catch (error) {
      console.error('Error fetching ad settings:', error);
      toast.error('Failed to load ad settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: 'ad_visibility_mode', value: visibilityMode },
        { key: 'ad_cooldown_seconds', value: cooldownSeconds.toString() },
        { key: 'ads_disabled_for_admins', value: adsDisabledForAdmins.toString() },
        { key: 'carousel_ads_enabled', value: carouselAdsEnabled.toString() },
        { key: 'infeed_ad_frequency_mobile', value: infeedAdFrequencyMobile.toString() },
        { key: 'infeed_ad_frequency_desktop', value: infeedAdFrequencyDesktop.toString() },
        { key: 'favorite_count_threshold', value: favoriteThreshold.toString() },
        { key: 'refresh_count_threshold', value: refreshThreshold.toString() },
        { key: 'load_screen_count_threshold', value: loadScreenThreshold.toString() },
        // Ad Block Detection Settings
        { key: 'adblock_detection_enabled', value: adBlockDetectionEnabled.toString() },
        { key: 'adblock_banner_enabled', value: adBlockBannerEnabled.toString() },
        { key: 'adblock_prompt_title_en', value: promptTitleEn },
        { key: 'adblock_prompt_title_ar', value: promptTitleAr },
        { key: 'adblock_prompt_description_en', value: promptDescriptionEn },
        { key: 'adblock_prompt_description_ar', value: promptDescriptionAr },
        { key: 'adblock_banner_message_en', value: bannerMessageEn },
        { key: 'adblock_banner_message_ar', value: bannerMessageAr },
        ...Object.entries(triggerStates).map(([key, value]) => ({ key, value: value.toString() })),
      ];

      // Use upsert to handle both insert and update cases
      for (const { key, value } of updates) {
        const { error } = await supabase
          .from('ad_settings')
          .upsert(
            { setting_key: key, setting_value: value, updated_at: new Date().toISOString() },
            { onConflict: 'setting_key' }
          );
        if (error) {
          console.error(`Error saving setting ${key}:`, error);
          throw error;
        }
      }

      toast.success('Ad settings saved successfully');
    } catch (error) {
      console.error('Error saving ad settings:', error);
      toast.error('Failed to save ad settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerToggle = (key: string, checked: boolean) => {
    setTriggerStates(prev => ({ ...prev, [key]: checked }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          Ad Settings
        </CardTitle>
        <CardDescription>
          Configure interstitial ad behavior, triggers, and thresholds
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-6">
        <div className="space-y-2">
          <Label>Ad Visibility</Label>
          <Select value={visibilityMode} onValueChange={setVisibilityMode}>
            <SelectTrigger>
              <SelectValue placeholder="Select who sees ads" />
            </SelectTrigger>
            <SelectContent>
              {VISIBILITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {VISIBILITY_OPTIONS.find(o => o.value === visibilityMode)?.description}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cooldown">Ad Cooldown (seconds)</Label>
          <Input
            id="cooldown"
            type="number"
            min={5}
            max={300}
            value={cooldownSeconds}
            onChange={(e) => setCooldownSeconds(parseInt(e.target.value, 10) || 30)}
            disabled={visibilityMode === 'disabled'}
          />
          <p className="text-sm text-muted-foreground">
            Minimum time between ads (5-300 seconds)
          </p>
        </div>

        {visibilityMode === 'all' && (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Disable Ads for Admins</Label>
              <p className="text-sm text-muted-foreground">
                Admin users won't see any ads
              </p>
            </div>
            <Switch
              checked={adsDisabledForAdmins}
              onCheckedChange={setAdsDisabledForAdmins}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Carousel Ads</Label>
            <p className="text-sm text-muted-foreground">
              Show ads between product slides in carousels
            </p>
          </div>
          <Switch
            checked={carouselAdsEnabled}
            onCheckedChange={setCarouselAdsEnabled}
            disabled={visibilityMode === 'disabled'}
          />
        </div>

        {carouselAdsEnabled && visibilityMode !== 'disabled' && (
          <div className="pl-4 border-l-2 border-primary/20 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="infeedMobile">Mobile: Products per Ad Slide</Label>
              <Input
                id="infeedMobile"
                type="number"
                min={2}
                max={20}
                value={infeedAdFrequencyMobile}
                onChange={(e) => setInfeedAdFrequencyMobile(parseInt(e.target.value, 10) || 5)}
              />
              <p className="text-sm text-muted-foreground">
                Show an ad slide after every X product slides on mobile
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="infeedDesktop">PC/Tablet: Products per Inline Ad</Label>
              <Input
                id="infeedDesktop"
                type="number"
                min={2}
                max={20}
                value={infeedAdFrequencyDesktop}
                onChange={(e) => setInfeedAdFrequencyDesktop(parseInt(e.target.value, 10) || 8)}
              />
              <p className="text-sm text-muted-foreground">
                Show an inline ad card after every X products on PC/tablet carousel
              </p>
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="font-medium mb-4">Ad Triggers</h4>
          <div className="grid grid-cols-2 gap-3">
            {TRIGGER_SETTINGS.map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">{label}</Label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Switch
                  checked={triggerStates[key] ?? true}
                  onCheckedChange={(checked) => handleTriggerToggle(key, checked)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-4">Trigger Thresholds</h4>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="favoriteThreshold">Favorites Before Ad</Label>
              <Input
                id="favoriteThreshold"
                type="number"
                min={1}
                max={20}
                value={favoriteThreshold}
                onChange={(e) => setFavoriteThreshold(parseInt(e.target.value, 10) || 2)}
                disabled={!triggerStates['trigger_favorite_add_enabled']}
              />
              <p className="text-sm text-muted-foreground">
                Show ad after this many products added to favorites
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refreshThreshold">Refreshes Before Ad</Label>
              <Input
                id="refreshThreshold"
                type="number"
                min={1}
                max={20}
                value={refreshThreshold}
                onChange={(e) => setRefreshThreshold(parseInt(e.target.value, 10) || 3)}
                disabled={!triggerStates['trigger_refresh_enabled']}
              />
              <p className="text-sm text-muted-foreground">
                Show ad after this many page refreshes
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loadScreenThreshold">Load Screens Before Ad</Label>
              <Input
                id="loadScreenThreshold"
                type="number"
                min={1}
                max={20}
                value={loadScreenThreshold}
                onChange={(e) => setLoadScreenThreshold(parseInt(e.target.value, 10) || 5)}
                disabled={!triggerStates['trigger_load_screen_enabled']}
              />
              <p className="text-sm text-muted-foreground">
                Show ad after this many loading screens
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Ad Blocker Detection Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldOff className="h-5 w-5 text-orange-500" />
            <h4 className="font-medium">Ad Blocker Detection</h4>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Ad Blocker Detection</Label>
              <p className="text-sm text-muted-foreground">
                Detect when users have an ad blocker enabled
              </p>
            </div>
            <Switch
              checked={adBlockDetectionEnabled}
              onCheckedChange={setAdBlockDetectionEnabled}
            />
          </div>

          {adBlockDetectionEnabled && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Re-engagement Banner</Label>
                  <p className="text-sm text-muted-foreground">
                    Show a banner to users who declined whitelisting
                  </p>
                </div>
                <Switch
                  checked={adBlockBannerEnabled}
                  onCheckedChange={setAdBlockBannerEnabled}
                />
              </div>

              <div className="pl-4 border-l-2 border-orange-500/20 space-y-4">
                <div className="space-y-2">
                  <Label>Prompt Title (English)</Label>
                  <Input
                    value={promptTitleEn}
                    onChange={(e) => setPromptTitleEn(e.target.value)}
                    placeholder="We noticed you're using an ad blocker"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prompt Title (Arabic)</Label>
                  <Input
                    value={promptTitleAr}
                    onChange={(e) => setPromptTitleAr(e.target.value)}
                    placeholder="لاحظنا أنك تستخدم مانع إعلانات"
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prompt Description (English)</Label>
                  <Textarea
                    value={promptDescriptionEn}
                    onChange={(e) => setPromptDescriptionEn(e.target.value)}
                    placeholder="Ads help keep Krolist free..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prompt Description (Arabic)</Label>
                  <Textarea
                    value={promptDescriptionAr}
                    onChange={(e) => setPromptDescriptionAr(e.target.value)}
                    placeholder="الإعلانات تساعد في إبقاء كروليست مجاني..."
                    dir="rtl"
                    rows={3}
                  />
                </div>

                {adBlockBannerEnabled && (
                  <>
                    <Separator className="my-2" />
                    <p className="text-sm font-medium text-muted-foreground">Re-engagement Banner Messages</p>
                    
                    <div className="space-y-2">
                      <Label>Banner Message (English)</Label>
                      <Input
                        value={bannerMessageEn}
                        onChange={(e) => setBannerMessageEn(e.target.value)}
                        placeholder="Enjoying Krolist? Ads help us stay free!"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Banner Message (Arabic)</Label>
                      <Input
                        value={bannerMessageAr}
                        onChange={(e) => setBannerMessageAr(e.target.value)}
                        placeholder="هل تستمتع بكروليست؟ الإعلانات تساعدنا على البقاء مجانيين!"
                        dir="rtl"
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
