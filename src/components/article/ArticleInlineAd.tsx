import { useEffect, useRef, useState } from 'react';
import { useAdSlots } from '@/hooks/useAdSlots';
import { AdSkeleton } from '@/components/ui/AdSkeleton';

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
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      adPushed.current = true;
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, [loading, isVisible]);

  if (!slots.clientId) return null;

  return (
    <div ref={containerRef} className={`my-4 sm:my-6 w-full ${className}`}>
      <div className="rounded-2xl overflow-hidden border border-border/50 bg-gradient-to-b from-muted/5 to-muted/15 shadow-sm">
        <div className="text-[9px] text-muted-foreground/50 text-center py-1.5 sm:py-2 uppercase tracking-[0.2em] font-medium border-b border-border/20">
          Advertisement
        </div>
        {!isVisible && <AdSkeleton className="min-h-[clamp(50px,15vw,200px)]" />}
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: isVisible ? 'block' : 'none', width: '100%', minHeight: 'clamp(50px, 15vw, 200px)' }}
          data-ad-client={slots.clientId}
          data-ad-slot={slots.articleInlineSlot || "4588888052"}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};
