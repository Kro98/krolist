import { useEffect, useRef, useState, useMemo } from 'react';
import { useAdSlots } from '@/hooks/useAdSlots';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface ArticleInlineAdProps {
  className?: string;
}

export const ArticleInlineAd = ({ className = '' }: ArticleInlineAdProps) => {
  const adRef = useRef<HTMLModElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const adKey = useMemo(() => Math.random().toString(36).substring(7), []);
  const { slots, loading } = useAdSlots();

  useEffect(() => {
    if (loading || !slots.articleInlineSlot) return;
    if (adRef.current && !adLoaded) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, [adLoaded, loading, slots.articleInlineSlot]);

  if (!slots.articleInlineSlot) return null;

  return (
    <div className={`my-8 w-full ${className}`}>
      <div className="bg-muted/30 border border-border/50 rounded-lg p-4 overflow-hidden">
        <div className="text-xs text-muted-foreground/60 text-center mb-2 uppercase tracking-wider">
          Advertisement
        </div>
        <ins
          ref={adRef}
          key={adKey}
          className="adsbygoogle"
          style={{ display: 'block', textAlign: 'center' }}
          data-ad-client={slots.clientId}
          data-ad-slot={slots.articleInlineSlot}
          data-ad-format="fluid"
          data-ad-layout-key="-fb+5w+4e-db+86"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};
