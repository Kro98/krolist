import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdTrigger } from "@/contexts/AdTriggerContext";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function InterstitialAd() {
  const { isAdVisible, closeAd } = useAdTrigger();
  const adRef = useRef<HTMLModElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (isAdVisible) {
      setCountdown(5);
      setCanClose(false);
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

  // Countdown timer
  useEffect(() => {
    if (!isAdVisible) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanClose(true);
    }
  }, [countdown, isAdVisible]);

  if (!isAdVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      {/* Close button */}
      <div className="absolute top-4 right-4">
        {canClose ? (
          <Button
            variant="outline"
            size="icon"
            onClick={closeAd}
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        ) : (
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
            {countdown}
          </div>
        )}
      </div>

      {/* Ad container */}
      <div className="w-full max-w-[336px] h-[280px] bg-card border border-border rounded-lg flex items-center justify-center overflow-hidden">
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
      <p className="mt-4 text-sm text-muted-foreground">
        {canClose ? "You can close this ad now" : `Ad closes in ${countdown} seconds`}
      </p>
    </div>
  );
}
