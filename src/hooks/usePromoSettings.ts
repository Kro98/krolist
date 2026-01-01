import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PromoSettings {
  confettiEnabled: boolean;
  shimmerEnabled: boolean;
  showDecorativeDots: boolean;
}

const defaultSettings: PromoSettings = {
  confettiEnabled: true,
  shimmerEnabled: true,
  showDecorativeDots: true,
};

export function usePromoSettings() {
  const [settings, setSettings] = useState<PromoSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('ad_settings')
          .select('setting_key, setting_value')
          .in('setting_key', [
            'promo_confetti_enabled',
            'promo_shimmer_enabled',
            'promo_show_dots'
          ]);

        if (error) throw error;

        if (data && data.length > 0) {
          const settingsMap: Record<string, string> = {};
          data.forEach(item => {
            settingsMap[item.setting_key] = item.setting_value;
          });

          setSettings({
            confettiEnabled: settingsMap['promo_confetti_enabled'] !== 'false',
            shimmerEnabled: settingsMap['promo_shimmer_enabled'] !== 'false',
            showDecorativeDots: settingsMap['promo_show_dots'] !== 'false',
          });
        }
      } catch (error) {
        console.error('Error fetching promo settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, isLoading };
}
