import { useSidebar } from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdSpaceProps {
  position: 'left' | 'right';
  width?: string;
  height?: string;
  topOffset?: string;
}

function AdSenseUnit({ slot, format = "auto" }: { slot?: string; format?: string }) {
  const adRef = useRef<HTMLModElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    if (adRef.current && !adLoaded) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, [adLoaded]);

  return (
    <div className="h-full w-full bg-card/50 border border-border/50 rounded-lg flex flex-col items-center justify-center backdrop-blur-sm overflow-hidden">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client="ca-pub-2793689855806571"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

export function AdSpace({ 
  position, 
  width = "160px", 
  height = "600px",
  topOffset = "80px"
}: AdSpaceProps) {
  const { open } = useSidebar();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [bannerCount, setBannerCount] = useState(1);
  
  const sidebarOpenWidth = 260;
  const sidebarCollapsedWidth = 52;
  const gap = 8;
  const bannerWidth = 160;
  const bannerGap = 8;
  const mainContentWidth = 1280;
  
  useEffect(() => {
    const calculateBanners = () => {
      const screenWidth = window.innerWidth;
      const sidebarWidth = open ? sidebarOpenWidth : sidebarCollapsedWidth;
      const availablePerSide = (screenWidth - sidebarWidth - mainContentWidth - (gap * 4)) / 2;
      const possibleBanners = Math.floor((availablePerSide + bannerGap) / (bannerWidth + bannerGap));
      setBannerCount(Math.max(1, Math.min(possibleBanners, 3)));
    };
    
    calculateBanners();
    window.addEventListener('resize', calculateBanners);
    return () => window.removeEventListener('resize', calculateBanners);
  }, [open]);
  
  const getLeftPosition = () => {
    if (position === 'right') return undefined;
    if (isRTL) return undefined;
    const sidebarWidth = open ? sidebarOpenWidth : sidebarCollapsedWidth;
    return `${sidebarWidth + gap}px`;
  };
  
  const getRightPosition = () => {
    if (position === 'left') return undefined;
    if (isRTL) {
      const sidebarWidth = open ? sidebarOpenWidth : sidebarCollapsedWidth;
      return `${sidebarWidth + gap}px`;
    }
    return `${gap}px`;
  };
  
  const getLeftAdRightPosition = () => {
    if (position === 'right') return undefined;
    if (!isRTL) return undefined;
    return `${gap}px`;
  };

  const totalWidth = (bannerWidth * bannerCount) + (bannerGap * (bannerCount - 1));

  return (
    <div 
      className="hidden 2xl:flex fixed z-10 transition-all duration-300 ease-in-out gap-2"
      style={{
        top: topOffset,
        left: isRTL ? getLeftAdRightPosition() : getLeftPosition(),
        right: isRTL ? getRightPosition() : (position === 'right' ? getRightPosition() : undefined),
        width: `${totalWidth}px`,
        height: height,
        flexDirection: position === 'right' ? 'row-reverse' : 'row',
      }}
    >
      {Array.from({ length: bannerCount }).map((_, index) => (
        <div key={`${position}-${index}`} style={{ width: `${bannerWidth}px`, height: '100%' }}>
          <AdSenseUnit format="vertical" />
        </div>
      ))}
    </div>
  );
}
