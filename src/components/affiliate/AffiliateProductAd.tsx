import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AffiliateProductAdProps {
  className?: string;
}

export function AffiliateProductAd({ className }: AffiliateProductAdProps) {
  const adRef = useRef<HTMLModElement>(null);
  const adLoaded = useRef(false);

  useEffect(() => {
    if (adRef.current && !adLoaded.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adLoaded.current = true;
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, []);

  return (
    <div className={cn(
      "relative rounded-lg overflow-hidden",
      "bg-gradient-to-br from-muted/50 to-muted/30",
      "border border-border/50",
      "flex items-center justify-center",
      "min-h-[150px]",
      className
    )}>
      {/* Ad label */}
      <div className="absolute top-2 left-2 z-10">
        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
          Ad
        </span>
      </div>
      
      {/* AdSense container */}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%', minHeight: '150px' }}
        data-ad-client="ca-pub-2793689855806571"
        data-ad-slot=""
        data-ad-format="fluid"
        data-full-width-responsive="true"
      />
    </div>
  );
}
