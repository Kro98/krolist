import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Megaphone, Save } from "lucide-react";

export function AdSettingsManager() {
  const [cooldownSeconds, setCooldownSeconds] = useState(30);
  const [adsDisabledForAdmins, setAdsDisabledForAdmins] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        data.forEach((setting) => {
          if (setting.setting_key === 'ad_cooldown_seconds') {
            setCooldownSeconds(parseInt(setting.setting_value, 10));
          } else if (setting.setting_key === 'ads_disabled_for_admins') {
            setAdsDisabledForAdmins(setting.setting_value === 'true');
          }
        });
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
      // Update cooldown
      const { error: cooldownError } = await supabase
        .from('ad_settings')
        .update({ setting_value: cooldownSeconds.toString() })
        .eq('setting_key', 'ad_cooldown_seconds');

      if (cooldownError) throw cooldownError;

      // Update admin ads setting
      const { error: adminError } = await supabase
        .from('ad_settings')
        .update({ setting_value: adsDisabledForAdmins.toString() })
        .eq('setting_key', 'ads_disabled_for_admins');

      if (adminError) throw adminError;

      toast.success('Ad settings saved successfully');
    } catch (error) {
      console.error('Error saving ad settings:', error);
      toast.error('Failed to save ad settings');
    } finally {
      setSaving(false);
    }
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
          Configure interstitial ad behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="cooldown">Ad Cooldown (seconds)</Label>
          <Input
            id="cooldown"
            type="number"
            min={5}
            max={300}
            value={cooldownSeconds}
            onChange={(e) => setCooldownSeconds(parseInt(e.target.value, 10) || 30)}
          />
          <p className="text-sm text-muted-foreground">
            Minimum time between ads (5-300 seconds)
          </p>
        </div>

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

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
