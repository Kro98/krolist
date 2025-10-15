import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface AdSpaceProps {
  className?: string;
  height?: string;
}

export function AdSpace({ className, height = "h-[250px]" }: AdSpaceProps) {
  const isMobile = useIsMobile();

  // Only show ad spaces on desktop (not mobile or tablet)
  if (isMobile || window.innerWidth < 1024) {
    return null;
  }

  return (
    <div 
      className={cn(
        "bg-muted/30 border border-border rounded-lg flex items-center justify-center",
        height,
        className
      )}
    >
      {/* Ad content will be injected here by Google AdSense */}
      <div className="ad-placeholder" />
    </div>
  );
}
