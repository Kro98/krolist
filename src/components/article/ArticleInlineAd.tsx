import { useEffect, useRef, useState } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const adRef = useRef<HTMLModElement>(null);
  const adPushed = useRef(false);
  const { slots, loading } = useAdSlots();
  const [isVisible, setIsVisible] = useState(false);

  // Wait for container to be visible with real width
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

  // Push ad only when visible
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
    <div ref={containerRef} className={`my-6 w-full ${className}`}>
      <div className="rounded-xl overflow-hidden border border-border/30 bg-muted/10">
        <div className="text-[9px] text-muted-foreground/40 text-center py-1.5 uppercase tracking-widest">
          Advertisement
        </div>
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client={slots.clientId}
          data-ad-slot={slots.articleInlineSlot || undefined}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};
