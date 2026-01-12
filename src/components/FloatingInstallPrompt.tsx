import { useState, useEffect } from "react";
import { X, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { InstallInstructionsSheet } from "@/components/InstallInstructionsSheet";
import { 
  getDeviceInfo, 
  subscribeToPrompt, 
  triggerNativeInstall,
  type BeforeInstallPromptEvent,
  type DeviceType,
  type BrowserType
} from "@/lib/pwaInstall";

export function FloatingInstallPrompt() {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPWA, setIsPWA] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<{ device: DeviceType; browser: BrowserType } | null>(null);
  const [installCount, setInstallCount] = useState<number | null>(null);

  const BASE_INSTALL_COUNT = 31;

  useEffect(() => {
    // Get device info
    const info = getDeviceInfo();
    setDeviceInfo({ device: info.device, browser: info.browser });
    setIsPWA(info.isStandalone);

    // Check if already dismissed in this session
    const wasDismissed = sessionStorage.getItem('installPromptDismissed');
    if (wasDismissed) {
      setIsDismissed(true);
      return;
    }

    // Subscribe to native install prompt
    const unsubscribe = subscribeToPrompt((prompt) => {
      setDeferredPrompt(prompt);
    });

    // Fetch install count
    fetchInstallCount();

    // Timer: show after 30 seconds
    const timer = setTimeout(() => {
      if (!isDismissed) {
        setIsVisible(true);
      }
    }, 30000);

    // Scroll handler: show after scrolling 500px
    let hasScrolledEnough = false;
    const handleScroll = () => {
      if (window.scrollY > 500 && !hasScrolledEnough && !isDismissed) {
        hasScrolledEnough = true;
        setIsVisible(true);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, [isDismissed]);

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

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  const trackInstall = async (method: string) => {
    try {
      await supabase.from('app_installs').insert({
        user_agent: navigator.userAgent,
        platform: `floating-prompt-${method}`
      });
    } catch (error) {
      console.error('Error tracking install:', error);
    }
  };

  const handleInstall = async () => {
    // If native prompt is available, use it
    if (deferredPrompt) {
      const result = await triggerNativeInstall();
      if (result === 'accepted') {
        await trackInstall('native');
        handleDismiss();
        return;
      }
    }
    
    // Show instructions sheet for manual install
    setShowInstructions(true);
  };

  // Don't show if PWA or dismissed
  if (isPWA || isDismissed || !isVisible) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-500 md:left-auto md:right-6 md:max-w-sm">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/95 to-primary border border-primary-foreground/10 p-4 shadow-lg backdrop-blur-sm">
          {/* Shimmer effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -inset-full h-[200%] w-[200%] animate-[spin_8s_linear_infinite] bg-gradient-conic from-transparent via-primary-foreground/5 to-transparent" />
          </div>
          
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-primary-foreground/10 transition-colors text-primary-foreground/70 hover:text-primary-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 p-2 rounded-xl bg-primary-foreground/15 backdrop-blur-sm">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="font-semibold text-primary-foreground text-sm mb-1">
                {language === 'ar' ? 'ثبّت التطبيق!' : 'Install the App!'}
              </h3>
              <p className="text-primary-foreground/80 text-xs mb-3 leading-relaxed">
                {language === 'ar' 
                  ? 'احصل على وصول سريع وتجربة أفضل. اضغط لتثبيت Krolist على جهازك.'
                  : 'Get quick access and a better experience. Tap to install Krolist on your device.'
                }
              </p>

              <Button
                onClick={handleInstall}
                size="sm"
                className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-medium gap-2"
              >
                <Download className="h-4 w-4" />
                {language === 'ar' ? 'تثبيت الآن' : 'Install Now'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions sheet */}
      {deviceInfo && (
        <InstallInstructionsSheet
          open={showInstructions}
          onOpenChange={setShowInstructions}
          device={deviceInfo.device}
          browser={deviceInfo.browser}
          installCount={installCount}
        />
      )}
    </>
  );
}
