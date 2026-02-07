import { Search, Heart, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface AffiliateDockProps {
  onSearchClick: () => void;
  onHeartClick: () => void;
  onAdsClick: () => void;
}

export function AffiliateDock({ onSearchClick, onHeartClick, onAdsClick }: AffiliateDockProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className={cn(
        "flex items-center gap-2 px-4 py-3 rounded-2xl",
        "bg-background/60 backdrop-blur-xl",
        "border border-border/50",
        "shadow-lg shadow-black/10"
      )}>
        {/* Search Button */}
        <button
          onClick={onSearchClick}
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl",
            "bg-primary/10 hover:bg-primary/20",
            "text-primary transition-all duration-200",
            "hover:scale-105 active:scale-95"
          )}
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Heart/Donate Button */}
        <button
          onClick={onHeartClick}
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl",
            "bg-destructive/10 hover:bg-destructive/20",
            "text-destructive transition-all duration-200",
            "hover:scale-105 active:scale-95"
          )}
          aria-label="Support"
        >
          <Heart className="w-5 h-5" />
        </button>

        {/* Ads Button */}
        <button
          onClick={onAdsClick}
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl",
            "bg-muted hover:bg-muted/80",
            "text-muted-foreground transition-all duration-200",
            "hover:scale-105 active:scale-95",
            "text-xs font-bold"
          )}
          aria-label="Watch Ad"
        >
          <Play className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
