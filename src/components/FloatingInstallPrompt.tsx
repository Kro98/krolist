import { useState, useEffect } from "react";
import { X, Download, Sparkles, Share, MoreVertical, Plus, Apple, Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type DeviceType = 'ios' | 'android' | 'desktop' | 'unknown';

function getDeviceType(): DeviceType {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/win|mac|linux/.test(ua) && !/android/.test(ua)) return 'desktop';
  return 'unknown';
}

export function FloatingInstallPrompt() {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPWA, setIsPWA] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>('unknown');
  const [showQuickTip, setShowQuickTip] = useState(false);

  useEffect(() => {
    setDeviceType(getDeviceType());
    
    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");
    setIsPWA(isStandalone);

    // Check if already dismissed today
    const dismissedDate = localStorage.getItem('installPromptDismissedDate');
    const today = new Date().toDateString();
    if (dismissedDate === today) {
      setIsDismissed(true);
      return;
    }

    // Check session dismissal
    const wasDismissed = sessionStorage.getItem('installPromptDismissed');
    if (wasDismissed) {
      setIsDismissed(true);
      return;
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Timer: show after 20 seconds (reduced from 30)
    const timer = setTimeout(() => {
      if (!isDismissed) {
        setIsVisible(true);
      }
    }, 20000);

    // Scroll handler: show after scrolling 400px (reduced from 500)
    let hasScrolledEnough = false;
    const handleScroll = () => {
      if (window.scrollY > 400 && !hasScrolledEnough && !isDismissed) {
        hasScrolledEnough = true;
        setIsVisible(true);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [isDismissed]);

  const handleDismiss = (rememberForDay: boolean = false) => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('installPromptDismissed', 'true');
    
    if (rememberForDay) {
      localStorage.setItem('installPromptDismissedDate', new Date().toDateString());
    }
  };

  const trackInstall = async () => {
    try {
      await supabase.from('app_installs').insert({
        user_agent: navigator.userAgent,
        platform: `floating-${deviceType}`
      });
    } catch (error) {
      console.error('Error tracking install:', error);
    }
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          await trackInstall();
          handleDismiss();
        }
      } catch (error) {
        console.error('Install failed:', error);
      }
    } else {
      // For iOS or when no native prompt, show quick tip
      setShowQuickTip(true);
      await trackInstall();
    }
  };

  // Get device-specific quick tip
  const getQuickTip = () => {
    if (deviceType === 'ios') {
      return {
        icon: <Share className="h-4 w-4" />,
        text: language === 'ar' 
          ? 'اضغط على زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"'
          : 'Tap Share button, then "Add to Home Screen"'
      };
    }
    if (deviceType === 'android') {
      return {
        icon: <MoreVertical className="h-4 w-4" />,
        text: language === 'ar'
          ? 'اضغط على القائمة (⋮) ثم "تثبيت التطبيق"'
          : 'Tap menu (⋮) then "Install app"'
      };
    }
    return {
      icon: <Plus className="h-4 w-4" />,
      text: language === 'ar'
        ? 'ابحث عن أيقونة التثبيت في شريط العنوان'
        : 'Look for install icon in address bar'
    };
  };

  const getDeviceIcon = () => {
    if (deviceType === 'ios') return <Apple className="h-5 w-5" />;
    if (deviceType === 'android') return <Smartphone className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  // Don't show if PWA or dismissed
  if (isPWA || isDismissed || !isVisible) {
    return null;
  }

  const quickTip = getQuickTip();

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-500 md:left-auto md:right-6 md:max-w-sm">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/95 to-primary border border-primary-foreground/10 shadow-2xl backdrop-blur-sm">
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-full h-[200%] w-[200%] animate-[spin_8s_linear_infinite] bg-gradient-conic from-transparent via-primary-foreground/10 to-transparent" />
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-2 left-4 w-1 h-1 bg-primary-foreground/30 rounded-full animate-pulse" />
          <div className="absolute top-6 right-8 w-1.5 h-1.5 bg-primary-foreground/20 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-4 left-12 w-1 h-1 bg-primary-foreground/25 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        {/* Close button */}
        <button
          onClick={() => handleDismiss(false)}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-primary-foreground/10 transition-colors text-primary-foreground/70 hover:text-primary-foreground z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative p-4">
          {!showQuickTip ? (
            <div className="flex items-start gap-3">
              {/* Icon with pulse */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-primary-foreground/20 rounded-xl animate-ping opacity-75" />
                <div className="relative p-2.5 rounded-xl bg-primary-foreground/15 backdrop-blur-sm">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="font-bold text-primary-foreground text-sm mb-1 flex items-center gap-2">
                  {language === 'ar' ? 'ثبّت Krolist!' : 'Install Krolist!'}
                  {getDeviceIcon()}
                </h3>
                <p className="text-primary-foreground/80 text-xs mb-3 leading-relaxed">
                  {language === 'ar' 
                    ? 'احصل على إشعارات فورية وتجربة أسرع. تثبيت مجاني!'
                    : 'Get instant notifications and faster experience. Free to install!'
                  }
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={handleInstall}
                    size="sm"
                    className="flex-1 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold gap-2 shadow-lg"
                  >
                    <Download className="h-4 w-4" />
                    {language === 'ar' ? 'تثبيت' : 'Install'}
                  </Button>
                  <Button
                    onClick={() => handleDismiss(true)}
                    size="sm"
                    variant="ghost"
                    className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 text-xs px-2"
                  >
                    {language === 'ar' ? 'لاحقاً' : 'Later'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-5 duration-300">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-primary-foreground/15">
                  {quickTip.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-primary-foreground text-sm mb-1">
                    {language === 'ar' ? 'كيفية التثبيت' : 'How to Install'}
                  </h4>
                  <p className="text-primary-foreground/80 text-xs leading-relaxed mb-3">
                    {quickTip.text}
                  </p>
                  <Button
                    onClick={() => handleDismiss(false)}
                    size="sm"
                    className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-medium"
                  >
                    {language === 'ar' ? 'فهمت!' : 'Got it!'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom progress indicator */}
        <div className="h-1 bg-primary-foreground/10">
          <div 
            className={cn(
              "h-full bg-primary-foreground/30 transition-all duration-[10000ms] ease-linear",
              isVisible ? "w-full" : "w-0"
            )}
          />
        </div>
      </div>
    </div>
  );
}