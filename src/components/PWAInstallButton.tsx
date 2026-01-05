import { useState, useEffect, useRef } from "react";
import { Download, Users, Share, Plus, MoreVertical, Monitor, Smartphone, Tablet, Apple, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type DeviceType = 'ios' | 'android' | 'windows' | 'mac' | 'tablet-ios' | 'tablet-android' | 'unknown';

// Detect device type
function getDeviceType(): DeviceType {
  const ua = navigator.userAgent.toLowerCase();
  const isTablet = /ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(navigator.userAgent);
  
  if (/ipad/.test(ua) || (isTablet && /safari/.test(ua) && !/chrome/.test(ua))) {
    return 'tablet-ios';
  }
  if (isTablet && /android/.test(ua)) {
    return 'tablet-android';
  }
  if (/iphone|ipod/.test(ua)) {
    return 'ios';
  }
  if (/android/.test(ua)) {
    return 'android';
  }
  if (/win/.test(ua)) {
    return 'windows';
  }
  if (/mac/.test(ua)) {
    return 'mac';
  }
  return 'unknown';
}

// Animated counter hook
function useAnimatedCounter(targetValue: number | null, duration: number = 800) {
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const previousValue = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (targetValue === null) return;

    if (previousValue.current === null) {
      setDisplayValue(targetValue);
      previousValue.current = targetValue;
      return;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startValue = previousValue.current;
    const startTime = performance.now();
    const difference = targetValue - startValue;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + difference * easeOut);
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = targetValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration]);

  return displayValue;
}

const installInstructions: Record<DeviceType, { en: string[]; ar: string[]; icon: React.ReactNode }> = {
  ios: {
    en: [
      "Tap the Share button at the bottom of Safari",
      "Scroll down and tap 'Add to Home Screen'",
      "Tap 'Add' in the top right corner"
    ],
    ar: [
      "اضغط على زر المشاركة في أسفل Safari",
      "مرر للأسفل واضغط على 'إضافة إلى الشاشة الرئيسية'",
      "اضغط على 'إضافة' في الزاوية العلوية اليمنى"
    ],
    icon: <Apple className="h-5 w-5" />
  },
  'tablet-ios': {
    en: [
      "Tap the Share button at the top of Safari",
      "Scroll and tap 'Add to Home Screen'",
      "Tap 'Add' to confirm"
    ],
    ar: [
      "اضغط على زر المشاركة في أعلى Safari",
      "مرر واضغط على 'إضافة إلى الشاشة الرئيسية'",
      "اضغط على 'إضافة' للتأكيد"
    ],
    icon: <Tablet className="h-5 w-5" />
  },
  android: {
    en: [
      "Tap the menu button (⋮) in your browser",
      "Tap 'Install app' or 'Add to Home screen'",
      "Confirm by tapping 'Install'"
    ],
    ar: [
      "اضغط على زر القائمة (⋮) في المتصفح",
      "اضغط على 'تثبيت التطبيق' أو 'إضافة إلى الشاشة الرئيسية'",
      "أكد بالضغط على 'تثبيت'"
    ],
    icon: <Smartphone className="h-5 w-5" />
  },
  'tablet-android': {
    en: [
      "Tap the menu button (⋮) in Chrome",
      "Tap 'Install app' or 'Add to Home screen'",
      "Confirm by tapping 'Install'"
    ],
    ar: [
      "اضغط على زر القائمة (⋮) في Chrome",
      "اضغط على 'تثبيت التطبيق' أو 'إضافة إلى الشاشة الرئيسية'",
      "أكد بالضغط على 'تثبيت'"
    ],
    icon: <Tablet className="h-5 w-5" />
  },
  windows: {
    en: [
      "Click the install icon in the address bar",
      "Or click menu (⋮) → 'Install Krolist'",
      "Click 'Install' to confirm"
    ],
    ar: [
      "اضغط على أيقونة التثبيت في شريط العنوان",
      "أو اضغط على القائمة (⋮) ← 'تثبيت Krolist'",
      "اضغط على 'تثبيت' للتأكيد"
    ],
    icon: <Monitor className="h-5 w-5" />
  },
  mac: {
    en: [
      "Click the install icon in the address bar",
      "Or click menu (⋮) → 'Install Krolist'",
      "Click 'Install' to confirm"
    ],
    ar: [
      "اضغط على أيقونة التثبيت في شريط العنوان",
      "أو اضغط على القائمة (⋮) ← 'تثبيت Krolist'",
      "اضغط على 'تثبيت' للتأكيد"
    ],
    icon: <Monitor className="h-5 w-5" />
  },
  unknown: {
    en: [
      "Look for an install option in your browser menu",
      "Or 'Add to Home Screen' in share options",
      "Follow the prompts to install"
    ],
    ar: [
      "ابحث عن خيار التثبيت في قائمة المتصفح",
      "أو 'إضافة إلى الشاشة الرئيسية' في خيارات المشاركة",
      "اتبع التعليمات للتثبيت"
    ],
    icon: <Chrome className="h-5 w-5" />
  }
};

export function PWAInstallButton() {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installCount, setInstallCount] = useState<number | null>(null);
  const [isPWA, setIsPWA] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>('unknown');
  const animatedCount = useAnimatedCounter(installCount);

  useEffect(() => {
    setDeviceType(getDeviceType());
    
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");
    setIsPWA(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    fetchInstallCount();

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const BASE_INSTALL_COUNT = 31;

  const fetchInstallCount = async () => {
    try {
      const { count, error } = await supabase
        .from('app_installs')
        .select('*', { count: 'exact', head: true });
      
      if (!error && count !== null) {
        setInstallCount(BASE_INSTALL_COUNT + count);
      } else {
        setInstallCount(BASE_INSTALL_COUNT);
      }
    } catch (error) {
      console.error('Error fetching install count:', error);
      setInstallCount(BASE_INSTALL_COUNT);
    }
  };

  const trackInstall = async (method: 'native' | 'manual') => {
    try {
      await supabase.from('app_installs').insert({
        user_agent: navigator.userAgent,
        platform: `${deviceType}-${method}`
      });
      setInstallCount(prev => (prev ?? 0) + 1);
    } catch (error) {
      console.error('Error tracking install:', error);
    }
  };

  const handleInstall = async () => {
    // If native prompt is available, use it
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === "accepted") {
          await trackInstall('native');
          setDeferredPrompt(null);
        }
        return;
      } catch (error) {
        console.error('Native install failed:', error);
      }
    }
    
    // Fallback: show manual instructions
    setShowInstructions(true);
    // Track that user attempted install (they saw instructions)
    await trackInstall('manual');
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const instructions = installInstructions[deviceType];
  const steps = language === 'ar' ? instructions.ar : instructions.en;

  if (isPWA) {
    return null;
  }

  const getDeviceLabel = () => {
    const labels: Record<DeviceType, { en: string; ar: string }> = {
      ios: { en: 'iPhone', ar: 'آيفون' },
      'tablet-ios': { en: 'iPad', ar: 'آيباد' },
      android: { en: 'Android', ar: 'أندرويد' },
      'tablet-android': { en: 'Android Tablet', ar: 'جهاز أندرويد لوحي' },
      windows: { en: 'Windows', ar: 'ويندوز' },
      mac: { en: 'Mac', ar: 'ماك' },
      unknown: { en: 'Your Device', ar: 'جهازك' }
    };
    return language === 'ar' ? labels[deviceType].ar : labels[deviceType].en;
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="icon" 
        className="relative" 
        onClick={handleInstall}
      >
        <Download className="h-5 w-5" />
        {animatedCount !== null && animatedCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-4 text-[10px] font-medium bg-primary text-primary-foreground rounded-full px-1">
            {formatCount(animatedCount)}
          </span>
        )}
      </Button>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {instructions.icon}
              <span>
                {language === 'ar' 
                  ? `تثبيت على ${getDeviceLabel()}`
                  : `Install on ${getDeviceLabel()}`
                }
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Users className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm">
                {language === 'ar'
                  ? `انضم إلى ${animatedCount} مستخدم قاموا بتثبيت التطبيق`
                  : `Join ${animatedCount} users who installed the app`
                }
              </p>
            </div>

            <ol className="space-y-3">
              {steps.map((step, index) => (
                <li key={index} className="flex gap-3 items-start">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-sm pt-0.5">{step}</span>
                </li>
              ))}
            </ol>

            {(deviceType === 'ios' || deviceType === 'tablet-ios') && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-muted-foreground text-sm">
                <Share className="h-4 w-4 shrink-0" />
                <span>
                  {language === 'ar'
                    ? 'ابحث عن أيقونة المشاركة هذه'
                    : 'Look for this share icon'
                  }
                </span>
              </div>
            )}

            {(deviceType === 'android' || deviceType === 'tablet-android') && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-muted-foreground text-sm">
                <MoreVertical className="h-4 w-4 shrink-0" />
                <span>
                  {language === 'ar'
                    ? 'ابحث عن أيقونة القائمة هذه'
                    : 'Look for this menu icon'
                  }
                </span>
              </div>
            )}
          </div>

          <Button onClick={() => setShowInstructions(false)} className="w-full">
            {language === 'ar' ? 'فهمت!' : 'Got it!'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
