import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface AdSpaceProps {
  className?: string;
  height?: string;
  adSlot?: string;
}

export function AdSpace({ className, height = "h-[250px]", adSlot = "8036385266" }: AdSpaceProps) {
  const isMobile = useIsMobile();
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (adRef.current && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error("AdSense error:", err);
      }
    }
  }, []);

  // Check user's ad preference
  const adPreference = localStorage.getItem("adblock-preference");
  
  // If user chose to block ads, don't show them
  if (adPreference === "block-ads") {
    return null;
  }
  
  // If user chose to allow ads or hasn't decided, show ads on all devices

  return (
    <div 
      className={cn(
        "bg-gradient-to-br from-muted/20 to-muted/40 border border-border/50 rounded-xl flex items-center justify-center overflow-hidden backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-300",
        height,
        className
      )}
    >
      <ins 
        ref={adRef}
        className="adsbygoogle w-full h-full"
        style={{ display: "block" }}
        data-ad-client="ca-pub-2793689855806571"
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
