import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface AdSpaceProps {
  className?: string;
  height?: string;
}

export function AdSpace({ className, height = "h-[250px]" }: AdSpaceProps) {
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

  // Only show ad spaces on desktop (not mobile or tablet)
  if (isMobile || window.innerWidth < 1024) {
    return null;
  }

  return (
    <div 
      className={cn(
        "bg-muted/30 border border-border rounded-lg flex items-center justify-center overflow-hidden",
        height,
        className
      )}
    >
      <ins 
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "inline-block", width: "165px", height: "180px" }}
        data-ad-client="ca-pub-2793689855806571"
        data-ad-slot="8036385266"
      />
    </div>
  );
}
