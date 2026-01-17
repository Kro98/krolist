import { useEffect, useRef, useState } from "react";
import { useAdTrigger } from "@/contexts/AdTriggerContext";
import { useAdBlock } from "@/contexts/AdBlockContext";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function InterstitialAd() {
  const { isAdVisible, closeAd } = useAdTrigger();
  const { shouldShowAds } = useAdBlock();
  const adRef = useRef<HTMLModElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [canSkipEarly, setCanSkipEarly] = useState(false);

  // Don't show interstitial ads if user declined
  if (!shouldShowAds) {
    return null;
  }

  useEffect(() => {
    if (isAdVisible) {
      setCountdown(5);
      setCanSkipEarly(false);
      setAdLoaded(false);
      
      // Load ad
      if (adRef.current) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setAdLoaded(true);
        } catch (e) {
          console.error('AdSense error:', e);
        }
      }
    }
  }, [isAdVisible]);

  // Countdown timer - auto close when done
  useEffect(() => {
    if (!isAdVisible) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Auto close the ad when countdown reaches zero
      closeAd(true);
    }
  }, [countdown, isAdVisible, closeAd]);

  // Enable early skip after 2 seconds
  useEffect(() => {
    if (!isAdVisible) return;
    
    const timer = setTimeout(() => {
      setCanSkipEarly(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isAdVisible]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only allow skip if canSkipEarly is true and click is not on the ad
    if (canSkipEarly && e.target === e.currentTarget) {
      closeAd(true);
    }
  };

  if (!isAdVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 ${canSkipEarly ? 'cursor-pointer' : ''}`}
      onClick={handleBackdropClick}
    >
      {/* Countdown indicator */}
      <div className="absolute top-4 right-4">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
          {countdown}
        </div>
      </div>

      {/* Ad container */}
      <div 
        className="w-full max-w-[336px] h-[280px] bg-card border border-border rounded-lg flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '336px', height: '280px' }}
          data-ad-client="ca-pub-2793689855806571"
          data-ad-slot=""
          data-ad-format="rectangle"
        />
      </div>

      {/* Skip text */}
      <p className="mt-4 text-sm text-muted-foreground text-center">
        {canSkipEarly 
          ? "Tap anywhere to skip" 
          : `Skip available in ${Math.max(0, 2 - (5 - countdown))}s`
        }
      </p>
    </div>
  );
}
