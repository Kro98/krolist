import { useState, useEffect, useRef } from "react";
import { Download } from "lucide-react";
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

export function PWAInstallButton() {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installCount, setInstallCount] = useState<number | null>(null);
  const [isPWA, setIsPWA] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<{ device: DeviceType; browser: BrowserType } | null>(null);
  const animatedCount = useAnimatedCounter(installCount);

  const BASE_INSTALL_COUNT = 31;

  useEffect(() => {
    // Get device info
    const info = getDeviceInfo();
    setDeviceInfo({ device: info.device, browser: info.browser });
    setIsPWA(info.isStandalone);

    // Subscribe to native install prompt
    const unsubscribe = subscribeToPrompt((prompt) => {
      setDeferredPrompt(prompt);
    });

    // Fetch install count
    fetchInstallCount();

    return () => {
      unsubscribe();
    };
  }, []);

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

  const trackInstall = async (method: string) => {
    try {
      await supabase.from('app_installs').insert({
        user_agent: navigator.userAgent,
        platform: `header-button-${method}`
      });
      setInstallCount(prev => (prev ?? 0) + 1);
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
        setDeferredPrompt(null);
        return;
      }
    }
    
    // Show instructions sheet for manual install
    setShowInstructions(true);
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  if (isPWA) {
    return null;
  }

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
