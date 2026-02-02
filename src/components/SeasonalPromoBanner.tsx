import { useState, useEffect } from 'react';
import { useSeasonalTheme } from '@/contexts/SeasonalThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, Moon, PartyPopper, Gift, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface BannerSettings {
  ramadan_banner_enabled: boolean;
  eid_banner_enabled: boolean;
  ramadan_banner_text_en: string;
  ramadan_banner_text_ar: string;
  eid_banner_text_en: string;
  eid_banner_text_ar: string;
}

export function SeasonalPromoBanner() {
  const { activeTheme } = useSeasonalTheme();
  const { language } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(false);
  const [settings, setSettings] = useState<BannerSettings | null>(null);
  const isArabic = language === 'ar';

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('ad_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'ramadan_banner_enabled',
          'eid_banner_enabled',
          'ramadan_banner_text_en',
          'ramadan_banner_text_ar',
          'eid_banner_text_en',
          'eid_banner_text_ar'
        ]);

      if (data) {
        const settingsObj: BannerSettings = {
          ramadan_banner_enabled: true,
          eid_banner_enabled: true,
          ramadan_banner_text_en: '🌙 Ramadan Mubarak! Enjoy special discounts this blessed month',
          ramadan_banner_text_ar: '🌙 رمضان مبارك! استمتع بخصومات مميزة في هذا الشهر الفضيل',
          eid_banner_text_en: '🎉 Eid Mubarak! Celebrate with amazing deals and offers',
          eid_banner_text_ar: '🎉 عيد مبارك! احتفل معنا بعروض وخصومات رائعة'
        };

        data.forEach(item => {
          if (item.setting_key === 'ramadan_banner_enabled') {
            settingsObj.ramadan_banner_enabled = item.setting_value === 'true';
          } else if (item.setting_key === 'eid_banner_enabled') {
            settingsObj.eid_banner_enabled = item.setting_value === 'true';
          } else if (item.setting_key === 'ramadan_banner_text_en') {
            settingsObj.ramadan_banner_text_en = item.setting_value;
          } else if (item.setting_key === 'ramadan_banner_text_ar') {
            settingsObj.ramadan_banner_text_ar = item.setting_value;
          } else if (item.setting_key === 'eid_banner_text_en') {
            settingsObj.eid_banner_text_en = item.setting_value;
          } else if (item.setting_key === 'eid_banner_text_ar') {
            settingsObj.eid_banner_text_ar = item.setting_value;
          }
        });

        setSettings(settingsObj);
      }
    };

    fetchSettings();
  }, []);

  // Check if dismissed this session
  useEffect(() => {
    const dismissedKey = `seasonal_banner_dismissed_${activeTheme}`;
    const dismissed = sessionStorage.getItem(dismissedKey);
    setIsDismissed(dismissed === 'true');
  }, [activeTheme]);

  const handleDismiss = () => {
    const dismissedKey = `seasonal_banner_dismissed_${activeTheme}`;
    sessionStorage.setItem(dismissedKey, 'true');
    setIsDismissed(true);
  };

  // Don't show if no theme active, dismissed, or settings not loaded
  if (activeTheme === 'none' || isDismissed || !settings) return null;

  // Check if banner is enabled for current theme
  if (activeTheme === 'ramadan' && !settings.ramadan_banner_enabled) return null;
  if (activeTheme === 'eid' && !settings.eid_banner_enabled) return null;

  const isRamadan = activeTheme === 'ramadan';
  const bannerText = isRamadan 
    ? (isArabic ? settings.ramadan_banner_text_ar : settings.ramadan_banner_text_en)
    : (isArabic ? settings.eid_banner_text_ar : settings.eid_banner_text_en);

  return (
    <div 
      className={cn(
        "relative overflow-hidden py-3 px-4 text-center animate-fade-in",
        isRamadan 
          ? "bg-gradient-to-r from-amber-600/90 via-purple-600/80 to-amber-600/90" 
          : "bg-gradient-to-r from-pink-500/90 via-yellow-500/80 to-cyan-500/90"
      )}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {isRamadan ? (
          <>
            <Moon className="absolute top-1 left-4 h-5 w-5 text-white/30 animate-pulse" />
            <Sparkles className="absolute top-2 right-12 h-4 w-4 text-white/40" />
            <Moon className="absolute bottom-1 right-4 h-4 w-4 text-white/20" />
          </>
        ) : (
          <>
            <PartyPopper className="absolute top-1 left-4 h-5 w-5 text-white/30" />
            <Gift className="absolute top-2 right-12 h-4 w-4 text-white/40" />
            <Sparkles className="absolute bottom-1 right-4 h-4 w-4 text-white/20" />
          </>
        )}
      </div>

      <p className="text-white font-medium text-sm md:text-base pr-8" dir={isArabic ? 'rtl' : 'ltr'}>
        {bannerText}
      </p>

      <button
        onClick={handleDismiss}
        className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-white" />
      </button>
    </div>
  );
}
