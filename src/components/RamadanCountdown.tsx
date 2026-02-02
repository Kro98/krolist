import { useState, useEffect } from 'react';
import { useSeasonalTheme } from '@/contexts/SeasonalThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, Moon, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface CountdownSettings {
  countdown_enabled: boolean;
  eid_date: string;
}

export function RamadanCountdown() {
  const { activeTheme } = useSeasonalTheme();
  const { language } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(false);
  const [settings, setSettings] = useState<CountdownSettings | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  const isArabic = language === 'ar';

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('ad_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['countdown_enabled', 'eid_date']);

      const settingsObj: CountdownSettings = {
        countdown_enabled: true,
        // Default to approximate Eid al-Fitr 2026 (March 20, 2026)
        eid_date: '2026-03-20'
      };

      if (data) {
        data.forEach(item => {
          if (item.setting_key === 'countdown_enabled') {
            settingsObj.countdown_enabled = item.setting_value === 'true';
          } else if (item.setting_key === 'eid_date') {
            settingsObj.eid_date = item.setting_value;
          }
        });
      }

      setSettings(settingsObj);
    };

    fetchSettings();
  }, []);

  // Calculate time left
  useEffect(() => {
    if (!settings?.eid_date) return;

    const calculateTimeLeft = () => {
      const eidDate = new Date(settings.eid_date);
      const now = new Date();
      const difference = eidDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [settings?.eid_date]);

  // Check if dismissed this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('ramadan_countdown_dismissed');
    setIsDismissed(dismissed === 'true');
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('ramadan_countdown_dismissed', 'true');
    setIsDismissed(true);
  };

  // Only show during Ramadan theme and when enabled
  if (activeTheme !== 'ramadan' || isDismissed || !settings?.countdown_enabled) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-20 md:bottom-6 right-4 z-40 animate-fade-in",
        "bg-gradient-to-br from-amber-900/95 via-purple-900/90 to-indigo-900/95",
        "backdrop-blur-sm rounded-2xl shadow-2xl border border-amber-500/30",
        "p-4 min-w-[200px]"
      )}
    >
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute -top-2 -right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors shadow-lg"
        aria-label="Dismiss countdown"
      >
        <X className="h-3.5 w-3.5 text-foreground" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3" dir={isArabic ? 'rtl' : 'ltr'}>
        <Moon className="h-5 w-5 text-amber-400" />
        <span className="text-white font-semibold text-sm">
          {isArabic ? 'العد التنازلي للعيد' : 'Countdown to Eid'}
        </span>
      </div>

      {/* Countdown display */}
      <div className="grid grid-cols-3 gap-2 text-center" dir="ltr">
        <div className="bg-white/10 rounded-lg py-2 px-1">
          <div className="text-2xl font-bold text-amber-400">{timeLeft.days}</div>
          <div className="text-[10px] text-white/70 uppercase tracking-wider">
            {isArabic ? 'يوم' : 'Days'}
          </div>
        </div>
        <div className="bg-white/10 rounded-lg py-2 px-1">
          <div className="text-2xl font-bold text-amber-400">{timeLeft.hours}</div>
          <div className="text-[10px] text-white/70 uppercase tracking-wider">
            {isArabic ? 'ساعة' : 'Hours'}
          </div>
        </div>
        <div className="bg-white/10 rounded-lg py-2 px-1">
          <div className="text-2xl font-bold text-amber-400">{timeLeft.minutes}</div>
          <div className="text-[10px] text-white/70 uppercase tracking-wider">
            {isArabic ? 'دقيقة' : 'Mins'}
          </div>
        </div>
      </div>

      {/* Decorative crescent */}
      <div className="absolute -bottom-1 -left-1 opacity-20">
        <Moon className="h-12 w-12 text-amber-400" />
      </div>
    </div>
  );
}
