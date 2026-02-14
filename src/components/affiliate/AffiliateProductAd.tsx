import { useEffect, useRef, useState } from "react";
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
  const adRef = useRef<HTMLModElement>(null);
  const adLoaded = useRef(false);
  const { slots, loading } = useAdSlots();
  const [clickCount, setClickCount] = useState<number | null>(null);

  // Fetch initial count + subscribe to real-time updates
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
        (payload) => {
          setClickCount(payload.new.counter_value);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Increment counter on ad click
  const handleAdClick = async () => {
    if (clickCount === null) return;
    await supabase
      .from('global_counters')
      .update({ counter_value: clickCount + 1, updated_at: new Date().toISOString() })
      .eq('counter_key', 'support_ad_clicks');
  };

  useEffect(() => {
    if (loading || !slots.productBannerSlot) return;
    if (adRef.current && !adLoaded.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adLoaded.current = true;
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, [loading, slots.productBannerSlot]);

  if (!slots.productBannerSlot) return null;

  return (
    <div
      onClick={handleAdClick}
      className={cn(
        "relative rounded-lg overflow-hidden",
        "bg-gradient-to-br from-muted/50 to-muted/30",
        "border border-border/50",
        "flex items-center justify-center",
        "min-h-[150px]",
        className
      )}
    >
      <div className="absolute top-2 left-2 z-10">
        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
          Ad
        </span>
      </div>

      {/* Live click counter */}
      {clickCount !== null && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-destructive/90 to-destructive/70 backdrop-blur-md shadow-lg shadow-destructive/20 border border-destructive/30 animate-fade-in">
          <Heart className="w-3.5 h-3.5 text-destructive-foreground fill-destructive-foreground animate-[pulse_1.5s_ease-in-out_infinite]" />
          <span className="text-xs font-bold tabular-nums text-destructive-foreground tracking-wide">
            {clickCount.toLocaleString()}
          </span>
          <span className="text-[9px] font-medium text-destructive-foreground/70 uppercase tracking-wider">
            supporters
          </span>
        </div>
      )}

      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%', minHeight: '150px' }}
        data-ad-client={slots.clientId}
        data-ad-slot={slots.productBannerSlot}
        data-ad-format="fluid"
        data-full-width-responsive="true"
      />
    </div>
  );
}
