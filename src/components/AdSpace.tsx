import { useSidebar } from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";

interface AdSpaceProps {
  position: 'left' | 'right';
  width?: string;
  height?: string;
  topOffset?: string;
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
  
  // Calculate left position based on sidebar state
  // Sidebar width: ~256px when open, ~48px when collapsed (icon mode)
  const sidebarOpenWidth = 260;
  const sidebarCollapsedWidth = 52;
  const gap = 8; // Gap between sidebar and ad
  
  const getLeftPosition = () => {
    if (position === 'right') return undefined;
    
    // Adjust for RTL
    if (isRTL) return undefined;
    
    const sidebarWidth = open ? sidebarOpenWidth : sidebarCollapsedWidth;
    return `${sidebarWidth + gap}px`;
  };
  
  const getRightPosition = () => {
    if (position === 'left') return undefined;
    
    // Adjust for RTL - right ad becomes left positioned in RTL
    if (isRTL) {
      const sidebarWidth = open ? sidebarOpenWidth : sidebarCollapsedWidth;
      return `${sidebarWidth + gap}px`;
    }
    
    return `${gap}px`;
  };
  
  // For RTL, left ad goes to the right side
  const getLeftAdRightPosition = () => {
    if (position === 'right') return undefined;
    if (!isRTL) return undefined;
    return `${gap}px`;
  };

  return (
    <div 
      className="hidden 2xl:flex fixed z-10 transition-all duration-300 ease-in-out"
      style={{
        top: topOffset,
        left: isRTL ? getLeftAdRightPosition() : getLeftPosition(),
        right: isRTL ? getRightPosition() : (position === 'right' ? getRightPosition() : undefined),
        width: width,
        height: height,
      }}
    >
      <div className="w-full h-full bg-card/50 border border-border/50 rounded-lg flex flex-col items-center justify-center gap-3 backdrop-blur-sm overflow-hidden">
        <div className="text-xs text-muted-foreground/60 uppercase tracking-wider">Advertisement</div>
        <div 
          className="flex-1 w-[90%] bg-muted/30 rounded-md flex items-center justify-center border border-dashed border-border/50 m-2"
        >
          <span className="text-muted-foreground/40 text-xs text-center px-2">
            Ad Space<br/>{width}×{height}
          </span>
        </div>
        <div className="text-[10px] text-muted-foreground/40 pb-2">Sponsored</div>
      </div>
    </div>
  );
}
