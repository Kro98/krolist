import { useIsMobile } from "@/hooks/use-mobile";

interface AdSpaceProps {
  position: 'left' | 'right';
}

export function AdSpace({ position }: AdSpaceProps) {
  const isMobile = useIsMobile();
  
  // Only show on desktop (screens larger than 1400px typically)
  if (isMobile) return null;
  
  return (
    <div 
      className={`hidden 2xl:flex fixed top-20 ${position === 'left' ? 'left-4' : 'right-4'} w-[160px] h-[600px] z-10`}
    >
      <div className="w-full h-full bg-card/50 border border-border/50 rounded-lg flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
        <div className="text-xs text-muted-foreground/60 uppercase tracking-wider">Advertisement</div>
        <div className="w-[120px] h-[400px] bg-muted/30 rounded-md flex items-center justify-center border border-dashed border-border/50">
          <span className="text-muted-foreground/40 text-xs text-center px-2">
            Ad Space<br/>160×600
          </span>
        </div>
        <div className="text-[10px] text-muted-foreground/40">Sponsored</div>
      </div>
    </div>
  );
}
