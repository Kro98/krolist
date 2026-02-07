import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AffiliateInterstitialAdProps {
  isVisible: boolean;
  onClose: () => void;
}

export function AffiliateInterstitialAd({ isVisible, onClose }: AffiliateInterstitialAdProps) {
  const adRef = useRef<HTMLModElement>(null);
  const [countdown, setCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setCountdown(5);
      setCanSkip(false);
      
      // Load ad
      if (adRef.current) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          console.error('AdSense error:', e);
        }
      }
    }
  }, [isVisible]);

  // Countdown timer
  useEffect(() => {
    if (!isVisible) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onClose();
    }
  }, [countdown, isVisible, onClose]);

  // Enable skip after 2 seconds
  useEffect(() => {
    if (!isVisible) return;
    
    const timer = setTimeout(() => {
      setCanSkip(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isVisible]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (canSkip && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 ${canSkip ? 'cursor-pointer' : ''}`}
      onClick={handleBackdropClick}
    >
      {/* Countdown indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {canSkip && (
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
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
        {canSkip 
          ? "Tap anywhere to skip" 
          : `Skip available in ${Math.max(0, 2 - (5 - countdown))}s`
        }
      </p>
    </div>
  );
}
