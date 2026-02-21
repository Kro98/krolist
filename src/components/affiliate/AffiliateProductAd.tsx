import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAdSlots } from "@/hooks/useAdSlots";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AffiliateProductAdProps {
  className?: string;
}

export function AffiliateProductAd({ className }: AffiliateProductAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const adRef = useRef<HTMLModElement>(null);
  const adPushed = useRef(false);
  const { slots, loading } = useAdSlots();
  const [clickCount, setClickCount] = useState<number | null>(null);
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
    const fetchCount = async () => {
      const { data } = await supabase
        .from('global_counters')
        .select('counter_value')
        .eq('counter_key', 'support_ad_clicks')
        .single();
      if (data) setClickCount(data.counter_value);
    };
    fetchCount();

    const channel = supabase
      .channel('global_counters_realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'global_counters', filter: 'counter_key=eq.support_ad_clicks' },
        (payload) => { setClickCount(payload.new.counter_value); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAdClick = useCallback(async () => {
    if (clickCount === null) return;
    await supabase
      .from('global_counters')
      .update({ counter_value: clickCount + 1, updated_at: new Date().toISOString() })
      .eq('counter_key', 'support_ad_clicks');
  }, [clickCount]);

  useEffect(() => {
    if (loading || !isVisible || adPushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      adPushed.current = true;
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, [loading, isVisible]);

  if (!slots.clientId) return null;

  return (
    <div
      ref={containerRef}
      onClick={handleAdClick}
      className={cn(
        "relative w-full rounded-xl overflow-hidden",
        "bg-muted/20 border border-border/40",
        className
      )}
    >
      <div className="absolute top-1.5 left-2 z-10">
        <span className="text-[9px] font-medium text-muted-foreground/40 uppercase tracking-widest">
          Ad
        </span>
      </div>

      {clickCount !== null && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/85 backdrop-blur-sm shadow-sm">
          <Heart className="w-3 h-3 text-destructive-foreground fill-destructive-foreground animate-[pulse_2s_ease-in-out_infinite]" />
          <span className="text-[10px] font-semibold tabular-nums text-destructive-foreground">
            {clickCount.toLocaleString()}
          </span>
          <span className="text-[8px] font-medium text-destructive-foreground/70 uppercase tracking-wider hidden sm:inline">
            supporters
          </span>
        </div>
      )}

      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minHeight: 'clamp(90px, 20vw, 250px)' }}
        data-ad-client={slots.clientId}
        data-ad-slot={slots.productBannerSlot || undefined}
        data-ad-format="fluid"
        data-ad-layout-key="-fb+5w+4e-db+86"
        data-full-width-responsive="true"
      />
    </div>
  );
}
