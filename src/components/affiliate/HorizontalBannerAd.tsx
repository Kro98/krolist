import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useAdSlots } from "@/hooks/useAdSlots";
import { AdSkeleton } from "@/components/ui/AdSkeleton";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface HorizontalBannerAdProps {
  className?: string;
}

export function HorizontalBannerAd({ className }: HorizontalBannerAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const adRef = useRef<HTMLModElement>(null);
  const adPushed = useRef(false);
  const { slots, loading } = useAdSlots();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.boundingClientRect.width > 0) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (loading || !isVisible || adPushed.current) return;
    const timer = setTimeout(() => {
      const el = containerRef.current;
      if (el && el.offsetWidth >= 250) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          adPushed.current = true;
        } catch (e) {
          console.error("Banner AdSense error:", e);
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [loading, isVisible]);

  if (!slots.clientId) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full rounded-2xl overflow-hidden",
        "bg-gradient-to-r from-muted/5 via-muted/10 to-muted/5 border border-border/50 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-[0.2em]">
          Sponsored
        </span>
      </div>
      {!isVisible && <AdSkeleton className="min-h-[90px]" />}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: isVisible ? "block" : "none",
          width: "100%",
          minHeight: "90px",
          maxHeight: "120px",
        }}
        data-ad-client={slots.clientId}
        data-ad-slot={slots.productBannerSlot || undefined}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
}
