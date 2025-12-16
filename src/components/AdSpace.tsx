import { useSidebar } from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";

interface AdSpaceProps {
  position: 'left' | 'right';
  width?: string;
  height?: string;
  topOffset?: string;
}

function AdBanner({ width, label }: { width: string; label: string }) {
  return (
    <div className="h-full bg-card/50 border border-border/50 rounded-lg flex flex-col items-center justify-center gap-3 backdrop-blur-sm overflow-hidden" style={{ width }}>
      <div className="text-xs text-muted-foreground/60 uppercase tracking-wider">Ad</div>
      <div className="flex-1 w-[90%] bg-muted/30 rounded-md flex items-center justify-center border border-dashed border-border/50 m-2">
        <span className="text-muted-foreground/40 text-xs text-center px-2">
          {label}
        </span>
      </div>
      <div className="text-[10px] text-muted-foreground/40 pb-2">Sponsored</div>
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
  const mainContentWidth = 1280; // max-w-7xl
  
  // Calculate how many banners can fit based on available space
  useEffect(() => {
    const calculateBanners = () => {
      const screenWidth = window.innerWidth;
      const sidebarWidth = open ? sidebarOpenWidth : sidebarCollapsedWidth;
      
      // Available space on each side
      // Total width - sidebar - main content - gaps
      const availablePerSide = (screenWidth - sidebarWidth - mainContentWidth - (gap * 4)) / 2;
      
      // How many banners can fit
      const possibleBanners = Math.floor((availablePerSide + bannerGap) / (bannerWidth + bannerGap));
      setBannerCount(Math.max(1, Math.min(possibleBanners, 3))); // Max 3 banners per side
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
        <AdBanner 
          key={index} 
          width={`${bannerWidth}px`} 
          label={`Ad ${index + 1}`}
        />
      ))}
    </div>
  );
}
