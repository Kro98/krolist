import { useState, useEffect, useRef } from "react";
import { Download, Users, Share, Plus, MoreVertical, Monitor, Smartphone, Tablet, Apple, Chrome, Globe, CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type DeviceType = 'ios' | 'android' | 'windows' | 'mac' | 'tablet-ios' | 'tablet-android' | 'linux' | 'unknown';
type BrowserType = 'safari' | 'chrome' | 'firefox' | 'edge' | 'samsung' | 'opera' | 'brave' | 'unknown';

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
  if (/linux/.test(ua)) {
    return 'linux';
  }
  return 'unknown';
}

// Detect browser type
function getBrowserType(): BrowserType {
  const ua = navigator.userAgent.toLowerCase();
  
  if (/samsungbrowser/.test(ua)) return 'samsung';
  if (/opr|opera/.test(ua)) return 'opera';
  if (/brave/.test(ua)) return 'brave';
  if (/edg/.test(ua)) return 'edge';
  if (/firefox|fxios/.test(ua)) return 'firefox';
  if (/chrome|crios/.test(ua) && !/edg/.test(ua)) return 'chrome';
  if (/safari/.test(ua) && !/chrome|crios/.test(ua)) return 'safari';
  
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

interface InstallStep {
  icon: React.ReactNode;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
}

// Get install instructions based on device and browser
function getInstallInstructions(device: DeviceType, browser: BrowserType): InstallStep[] {
  // iOS Safari
  if ((device === 'ios' || device === 'tablet-ios') && browser === 'safari') {
    return [
      {
        icon: <Share className="h-5 w-5" />,
        title: { en: 'Tap Share', ar: 'اضغط على مشاركة' },
        description: { 
          en: device === 'ios' ? 'Tap the Share button at the bottom of Safari' : 'Tap the Share button at the top of Safari',
          ar: device === 'ios' ? 'اضغط على زر المشاركة في أسفل Safari' : 'اضغط على زر المشاركة في أعلى Safari'
        }
      },
      {
        icon: <Plus className="h-5 w-5" />,
        title: { en: 'Add to Home Screen', ar: 'أضف إلى الشاشة الرئيسية' },
        description: { 
          en: 'Scroll down and tap "Add to Home Screen"',
          ar: 'مرر للأسفل واضغط على "إضافة إلى الشاشة الرئيسية"'
        }
      },
      {
        icon: <CheckCircle2 className="h-5 w-5" />,
        title: { en: 'Confirm', ar: 'تأكيد' },
        description: { 
          en: 'Tap "Add" in the top right corner',
          ar: 'اضغط على "إضافة" في الزاوية العلوية'
        }
      }
    ];
  }

  // iOS Chrome/Firefox
  if ((device === 'ios' || device === 'tablet-ios') && (browser === 'chrome' || browser === 'firefox')) {
    return [
      {
        icon: <ExternalLink className="h-5 w-5" />,
        title: { en: 'Open in Safari', ar: 'افتح في Safari' },
        description: { 
          en: 'For the best experience, open this page in Safari',
          ar: 'للحصول على أفضل تجربة، افتح هذه الصفحة في Safari'
        }
      },
      {
        icon: <Share className="h-5 w-5" />,
        title: { en: 'Tap Share', ar: 'اضغط على مشاركة' },
        description: { 
          en: 'Tap the Share button in Safari',
          ar: 'اضغط على زر المشاركة في Safari'
        }
      },
      {
        icon: <Plus className="h-5 w-5" />,
        title: { en: 'Add to Home Screen', ar: 'أضف إلى الشاشة الرئيسية' },
        description: { 
          en: 'Tap "Add to Home Screen"',
          ar: 'اضغط على "إضافة إلى الشاشة الرئيسية"'
        }
      }
    ];
  }

  // Android Chrome
  if ((device === 'android' || device === 'tablet-android') && browser === 'chrome') {
    return [
      {
        icon: <MoreVertical className="h-5 w-5" />,
        title: { en: 'Open Menu', ar: 'افتح القائمة' },
        description: { 
          en: 'Tap the three dots (⋮) in the top right',
          ar: 'اضغط على النقاط الثلاث (⋮) في الأعلى'
        }
      },
      {
        icon: <Download className="h-5 w-5" />,
        title: { en: 'Install App', ar: 'تثبيت التطبيق' },
        description: { 
          en: 'Tap "Install app" or "Add to Home screen"',
          ar: 'اضغط على "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"'
        }
      },
      {
        icon: <CheckCircle2 className="h-5 w-5" />,
        title: { en: 'Confirm', ar: 'تأكيد' },
        description: { 
          en: 'Tap "Install" to confirm',
          ar: 'اضغط على "تثبيت" للتأكيد'
        }
      }
    ];
  }

  // Android Samsung Browser
  if ((device === 'android' || device === 'tablet-android') && browser === 'samsung') {
    return [
      {
        icon: <MoreVertical className="h-5 w-5" />,
        title: { en: 'Open Menu', ar: 'افتح القائمة' },
        description: { 
          en: 'Tap the menu icon (≡) at the bottom',
          ar: 'اضغط على أيقونة القائمة (≡) في الأسفل'
        }
      },
      {
        icon: <Plus className="h-5 w-5" />,
        title: { en: 'Add to Home', ar: 'أضف إلى الشاشة' },
        description: { 
          en: 'Tap "Add page to" then "Home screen"',
          ar: 'اضغط على "إضافة الصفحة إلى" ثم "الشاشة الرئيسية"'
        }
      },
      {
        icon: <CheckCircle2 className="h-5 w-5" />,
        title: { en: 'Confirm', ar: 'تأكيد' },
        description: { 
          en: 'Tap "Add" to confirm',
          ar: 'اضغط على "إضافة" للتأكيد'
        }
      }
    ];
  }

  // Android Firefox
  if ((device === 'android' || device === 'tablet-android') && browser === 'firefox') {
    return [
      {
        icon: <MoreVertical className="h-5 w-5" />,
        title: { en: 'Open Menu', ar: 'افتح القائمة' },
        description: { 
          en: 'Tap the three dots (⋮) in the toolbar',
          ar: 'اضغط على النقاط الثلاث (⋮) في شريط الأدوات'
        }
      },
      {
        icon: <Download className="h-5 w-5" />,
        title: { en: 'Install', ar: 'تثبيت' },
        description: { 
          en: 'Tap "Install" or "Add to Home screen"',
          ar: 'اضغط على "تثبيت" أو "إضافة إلى الشاشة الرئيسية"'
        }
      },
      {
        icon: <CheckCircle2 className="h-5 w-5" />,
        title: { en: 'Confirm', ar: 'تأكيد' },
        description: { 
          en: 'Follow the prompts to add',
          ar: 'اتبع التعليمات للإضافة'
        }
      }
    ];
  }

  // Desktop Chrome/Edge/Brave
  if ((device === 'windows' || device === 'mac' || device === 'linux') && 
      (browser === 'chrome' || browser === 'edge' || browser === 'brave')) {
    return [
      {
        icon: <Download className="h-5 w-5" />,
        title: { en: 'Look for Install Icon', ar: 'ابحث عن أيقونة التثبيت' },
        description: { 
          en: 'Click the install icon (⊕) in the address bar',
          ar: 'اضغط على أيقونة التثبيت (⊕) في شريط العنوان'
        }
      },
      {
        icon: <MoreVertical className="h-5 w-5" />,
        title: { en: 'Or Use Menu', ar: 'أو استخدم القائمة' },
        description: { 
          en: 'Click menu (⋮) → "Install Krolist..."',
          ar: 'اضغط على القائمة (⋮) ← "تثبيت Krolist..."'
        }
      },
      {
        icon: <CheckCircle2 className="h-5 w-5" />,
        title: { en: 'Install', ar: 'تثبيت' },
        description: { 
          en: 'Click "Install" to confirm',
          ar: 'اضغط على "تثبيت" للتأكيد'
        }
      }
    ];
  }

  // Desktop Firefox
  if ((device === 'windows' || device === 'mac' || device === 'linux') && browser === 'firefox') {
    return [
      {
        icon: <Globe className="h-5 w-5" />,
        title: { en: 'Firefox Limitation', ar: 'قيود Firefox' },
        description: { 
          en: 'Firefox desktop doesn\'t support app installation yet',
          ar: 'Firefox لا يدعم تثبيت التطبيقات بعد'
        }
      },
      {
        icon: <Chrome className="h-5 w-5" />,
        title: { en: 'Use Chrome or Edge', ar: 'استخدم Chrome أو Edge' },
        description: { 
          en: 'Open this page in Chrome or Edge to install',
          ar: 'افتح هذه الصفحة في Chrome أو Edge للتثبيت'
        }
      }
    ];
  }

  // Desktop Safari
  if (device === 'mac' && browser === 'safari') {
    return [
      {
        icon: <Share className="h-5 w-5" />,
        title: { en: 'Click Share', ar: 'اضغط على مشاركة' },
        description: { 
          en: 'Click the Share button in the toolbar',
          ar: 'اضغط على زر المشاركة في شريط الأدوات'
        }
      },
      {
        icon: <Plus className="h-5 w-5" />,
        title: { en: 'Add to Dock', ar: 'أضف إلى Dock' },
        description: { 
          en: 'Click "Add to Dock" (macOS Sonoma+)',
          ar: 'اضغط على "إضافة إلى Dock" (macOS Sonoma+)'
        }
      },
      {
        icon: <CheckCircle2 className="h-5 w-5" />,
        title: { en: 'Confirm', ar: 'تأكيد' },
        description: { 
          en: 'Click "Add" to confirm',
          ar: 'اضغط على "إضافة" للتأكيد'
        }
      }
    ];
  }

  // Default/Unknown
  return [
    {
      icon: <MoreVertical className="h-5 w-5" />,
      title: { en: 'Open Browser Menu', ar: 'افتح قائمة المتصفح' },
      description: { 
        en: 'Look for the menu or share button',
        ar: 'ابحث عن زر القائمة أو المشاركة'
      }
    },
    {
      icon: <Plus className="h-5 w-5" />,
      title: { en: 'Add to Home/Install', ar: 'أضف / ثبّت' },
      description: { 
        en: 'Find "Add to Home Screen" or "Install"',
        ar: 'ابحث عن "إضافة إلى الشاشة الرئيسية" أو "تثبيت"'
      }
    },
    {
      icon: <CheckCircle2 className="h-5 w-5" />,
      title: { en: 'Confirm', ar: 'تأكيد' },
      description: { 
        en: 'Follow the prompts to complete installation',
        ar: 'اتبع التعليمات لإكمال التثبيت'
      }
    }
  ];
}

// Get device icon
function getDeviceIcon(device: DeviceType): React.ReactNode {
  switch (device) {
    case 'ios':
    case 'tablet-ios':
      return <Apple className="h-5 w-5" />;
    case 'android':
    case 'tablet-android':
      return <Smartphone className="h-5 w-5" />;
    case 'windows':
    case 'mac':
    case 'linux':
      return <Monitor className="h-5 w-5" />;
    default:
      return <Globe className="h-5 w-5" />;
  }
}

// Get browser icon/name
function getBrowserInfo(browser: BrowserType): { icon: React.ReactNode; name: { en: string; ar: string } } {
  const info: Record<BrowserType, { icon: React.ReactNode; name: { en: string; ar: string } }> = {
    safari: { icon: <Globe className="h-4 w-4" />, name: { en: 'Safari', ar: 'Safari' } },
    chrome: { icon: <Chrome className="h-4 w-4" />, name: { en: 'Chrome', ar: 'Chrome' } },
    firefox: { icon: <Globe className="h-4 w-4" />, name: { en: 'Firefox', ar: 'Firefox' } },
    edge: { icon: <Globe className="h-4 w-4" />, name: { en: 'Edge', ar: 'Edge' } },
    samsung: { icon: <Smartphone className="h-4 w-4" />, name: { en: 'Samsung Internet', ar: 'Samsung Internet' } },
    opera: { icon: <Globe className="h-4 w-4" />, name: { en: 'Opera', ar: 'Opera' } },
    brave: { icon: <Globe className="h-4 w-4" />, name: { en: 'Brave', ar: 'Brave' } },
    unknown: { icon: <Globe className="h-4 w-4" />, name: { en: 'Browser', ar: 'المتصفح' } }
  };
  return info[browser];
}

export function PWAInstallButton() {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installCount, setInstallCount] = useState<number | null>(null);
  const [isPWA, setIsPWA] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>('unknown');
  const [browserType, setBrowserType] = useState<BrowserType>('unknown');
  const [currentStep, setCurrentStep] = useState(0);
  const animatedCount = useAnimatedCounter(installCount);

  useEffect(() => {
    setDeviceType(getDeviceType());
    setBrowserType(getBrowserType());
    
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
        platform: `${deviceType}-${browserType}-${method}`
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
    setCurrentStep(0);
    setShowInstructions(true);
    await trackInstall('manual');
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const instructions = getInstallInstructions(deviceType, browserType);
  const browserInfo = getBrowserInfo(browserType);

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
      linux: { en: 'Linux', ar: 'لينكس' },
      unknown: { en: 'Your Device', ar: 'جهازك' }
    };
    return language === 'ar' ? labels[deviceType].ar : labels[deviceType].en;
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="icon" 
        className="relative group" 
        onClick={handleInstall}
      >
        <Download className="h-5 w-5 transition-transform group-hover:scale-110" />
        {animatedCount !== null && animatedCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-4 text-[10px] font-medium bg-primary text-primary-foreground rounded-full px-1 animate-in zoom-in-50">
            {formatCount(animatedCount)}
          </span>
        )}
      </Button>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-md overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                {getDeviceIcon(deviceType)}
              </div>
              <div>
                <span className="block">
                  {language === 'ar' 
                    ? `تثبيت Krolist`
                    : `Install Krolist`
                  }
                </span>
                <span className="text-xs font-normal text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  {browserInfo.icon}
                  {language === 'ar' ? browserInfo.name.ar : browserInfo.name.en}
                  {' • '}
                  {getDeviceLabel()}
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* User count badge */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
              <Users className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm">
                {language === 'ar'
                  ? `انضم إلى ${animatedCount}+ مستخدم قاموا بتثبيت التطبيق`
                  : `Join ${animatedCount}+ users who installed the app`
                }
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {instructions.map((step, index) => (
                <div 
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    "flex gap-3 items-start p-3 rounded-xl border-2 cursor-pointer transition-all duration-300",
                    currentStep === index 
                      ? "border-primary bg-primary/5 scale-[1.02]" 
                      : "border-border/50 hover:border-primary/30 hover:bg-muted/50"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={cn(
                    "flex items-center justify-center h-10 w-10 rounded-xl shrink-0 transition-colors",
                    currentStep === index 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      "font-semibold text-sm mb-0.5 transition-colors",
                      currentStep === index ? "text-primary" : "text-foreground"
                    )}>
                      {language === 'ar' ? step.title.ar : step.title.en}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {language === 'ar' ? step.description.ar : step.description.en}
                    </p>
                  </div>
                  {currentStep === index && (
                    <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-3 animate-pulse" />
                  )}
                </div>
              ))}
            </div>

            {/* Navigation dots */}
            <div className="flex justify-center gap-2 pt-2">
              {instructions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    currentStep === index 
                      ? "bg-primary w-6" 
                      : "bg-muted hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowInstructions(false)} 
              className="flex-1"
            >
              {language === 'ar' ? 'لاحقاً' : 'Later'}
            </Button>
            <Button 
              onClick={() => {
                if (currentStep < instructions.length - 1) {
                  setCurrentStep(prev => prev + 1);
                } else {
                  setShowInstructions(false);
                }
              }} 
              className="flex-1 gap-2"
            >
              {currentStep < instructions.length - 1 ? (
                <>
                  {language === 'ar' ? 'التالي' : 'Next'}
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                language === 'ar' ? 'فهمت!' : 'Got it!'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}