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
        <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm border border-border/40">
          <Heart className="w-3 h-3 text-destructive fill-destructive" />
          <span className="text-[11px] font-semibold tabular-nums text-foreground">
            {clickCount.toLocaleString()}
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
