import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Save, Moon, PartyPopper, Calendar, Megaphone } from 'lucide-react';

interface BannerSettings {
  ramadan_banner_enabled: boolean;
  eid_banner_enabled: boolean;
  ramadan_banner_text_en: string;
  ramadan_banner_text_ar: string;
  eid_banner_text_en: string;
  eid_banner_text_ar: string;
  countdown_enabled: boolean;
  eid_date: string;
}

export function SeasonalBannerSettings() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<BannerSettings>({
    ramadan_banner_enabled: true,
    eid_banner_enabled: true,
    ramadan_banner_text_en: '🌙 Ramadan Mubarak! Enjoy special discounts this blessed month',
    ramadan_banner_text_ar: '🌙 رمضان مبارك! استمتع بخصومات مميزة في هذا الشهر الفضيل',
    eid_banner_text_en: '🎉 Eid Mubarak! Celebrate with amazing deals and offers',
    eid_banner_text_ar: '🎉 عيد مبارك! احتفل معنا بعروض وخصومات رائعة',
    countdown_enabled: true,
    eid_date: '2026-03-20'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('ad_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        'ramadan_banner_enabled',
        'eid_banner_enabled',
        'ramadan_banner_text_en',
        'ramadan_banner_text_ar',
        'eid_banner_text_en',
        'eid_banner_text_ar',
        'countdown_enabled',
        'eid_date'
      ]);

    if (data && data.length > 0) {
      const newSettings = { ...settings };
      data.forEach(item => {
        const key = item.setting_key as keyof BannerSettings;
        if (key.includes('enabled')) {
          (newSettings as any)[key] = item.setting_value === 'true';
        } else {
          (newSettings as any)[key] = item.setting_value;
        }
      });
      setSettings(newSettings);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const settingsToSave = [
        { setting_key: 'ramadan_banner_enabled', setting_value: String(settings.ramadan_banner_enabled), description: 'Enable Ramadan promo banner' },
        { setting_key: 'eid_banner_enabled', setting_value: String(settings.eid_banner_enabled), description: 'Enable Eid promo banner' },
        { setting_key: 'ramadan_banner_text_en', setting_value: settings.ramadan_banner_text_en, description: 'Ramadan banner text (English)' },
        { setting_key: 'ramadan_banner_text_ar', setting_value: settings.ramadan_banner_text_ar, description: 'Ramadan banner text (Arabic)' },
        { setting_key: 'eid_banner_text_en', setting_value: settings.eid_banner_text_en, description: 'Eid banner text (English)' },
        { setting_key: 'eid_banner_text_ar', setting_value: settings.eid_banner_text_ar, description: 'Eid banner text (Arabic)' },
        { setting_key: 'countdown_enabled', setting_value: String(settings.countdown_enabled), description: 'Enable Ramadan countdown widget' },
        { setting_key: 'eid_date', setting_value: settings.eid_date, description: 'Target Eid date for countdown' }
      ];

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('ad_settings')
          .upsert(setting, { onConflict: 'setting_key' });
        
        if (error) throw error;
      }

      toast({
        title: isArabic ? 'تم الحفظ' : 'Settings Saved',
        description: isArabic ? 'تم حفظ إعدادات البانر بنجاح' : 'Banner settings saved successfully'
      });
    } catch (error: any) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          {isArabic ? 'إعدادات البانر والعد التنازلي' : 'Banner & Countdown Settings'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isArabic 
            ? 'تخصيص البانرات والعد التنازلي التي تظهر عند تفعيل الثيمات الموسمية'
            : 'Customize the banners and countdown that appear when seasonal themes are active'}
        </p>
      </div>

      {/* Ramadan Banner Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="h-4 w-4 text-amber-500" />
            {isArabic ? 'بانر رمضان' : 'Ramadan Banner'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{isArabic ? 'تفعيل البانر' : 'Enable Banner'}</Label>
            <Switch
              checked={settings.ramadan_banner_enabled}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, ramadan_banner_enabled: checked }))}
            />
          </div>
          <div>
            <Label>{isArabic ? 'النص (إنجليزي)' : 'Text (English)'}</Label>
            <Textarea
              value={settings.ramadan_banner_text_en}
              onChange={(e) => setSettings(s => ({ ...s, ramadan_banner_text_en: e.target.value }))}
              placeholder="Ramadan Mubarak! ..."
              rows={2}
            />
          </div>
          <div>
            <Label>{isArabic ? 'النص (عربي)' : 'Text (Arabic)'}</Label>
            <Textarea
              value={settings.ramadan_banner_text_ar}
              onChange={(e) => setSettings(s => ({ ...s, ramadan_banner_text_ar: e.target.value }))}
              placeholder="رمضان مبارك! ..."
              dir="rtl"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Eid Banner Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PartyPopper className="h-4 w-4 text-pink-500" />
            {isArabic ? 'بانر العيد' : 'Eid Banner'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{isArabic ? 'تفعيل البانر' : 'Enable Banner'}</Label>
            <Switch
              checked={settings.eid_banner_enabled}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, eid_banner_enabled: checked }))}
            />
          </div>
          <div>
            <Label>{isArabic ? 'النص (إنجليزي)' : 'Text (English)'}</Label>
            <Textarea
              value={settings.eid_banner_text_en}
              onChange={(e) => setSettings(s => ({ ...s, eid_banner_text_en: e.target.value }))}
              placeholder="Eid Mubarak! ..."
              rows={2}
            />
          </div>
          <div>
            <Label>{isArabic ? 'النص (عربي)' : 'Text (Arabic)'}</Label>
            <Textarea
              value={settings.eid_banner_text_ar}
              onChange={(e) => setSettings(s => ({ ...s, eid_banner_text_ar: e.target.value }))}
              placeholder="عيد مبارك! ..."
              dir="rtl"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Countdown Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-500" />
            {isArabic ? 'العد التنازلي للعيد' : 'Eid Countdown'}
          </CardTitle>
          <CardDescription>
            {isArabic 
              ? 'يظهر فقط عند تفعيل ثيم رمضان'
              : 'Only shows when Ramadan theme is active'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{isArabic ? 'تفعيل العد التنازلي' : 'Enable Countdown'}</Label>
            <Switch
              checked={settings.countdown_enabled}
              onCheckedChange={(checked) => setSettings(s => ({ ...s, countdown_enabled: checked }))}
            />
          </div>
          <div>
            <Label>{isArabic ? 'تاريخ العيد' : 'Eid Date'}</Label>
            <Input
              type="date"
              value={settings.eid_date}
              onChange={(e) => setSettings(s => ({ ...s, eid_date: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {isArabic 
                ? 'أدخل التاريخ المتوقع لعيد الفطر'
                : 'Enter the expected date for Eid al-Fitr'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isLoading} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        {isLoading 
          ? (isArabic ? 'جاري الحفظ...' : 'Saving...') 
          : (isArabic ? 'حفظ الإعدادات' : 'Save Settings')}
      </Button>
    </div>
  );
}
