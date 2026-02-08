import { Search, Heart, Settings, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface AffiliateDockProps {
  onSearchClick: () => void;
  onHeartClick: () => void;
  onSettingsClick: () => void;
  onFilterClick: () => void;
}

export function AffiliateDock({ 
  onSearchClick, 
  onHeartClick, 
  onSettingsClick,
  onFilterClick 
}: AffiliateDockProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const dockItems = [
    {
      icon: Search,
      label: isArabic ? 'بحث' : 'Search',
      onClick: onSearchClick,
      colorClass: 'text-primary',
      bgClass: 'bg-primary/10 hover:bg-primary/20',
      glowClass: 'group-hover:shadow-primary/30'
    },
    {
      icon: Filter,
      label: isArabic ? 'تصفية' : 'Filter',
      onClick: onFilterClick,
      colorClass: 'text-blue-500',
      bgClass: 'bg-blue-500/10 hover:bg-blue-500/20',
      glowClass: 'group-hover:shadow-blue-500/30'
    },
    {
      icon: Heart,
      label: isArabic ? 'دعم' : 'Support',
      onClick: onHeartClick,
      colorClass: 'text-pink-500',
      bgClass: 'bg-pink-500/10 hover:bg-pink-500/20',
      glowClass: 'group-hover:shadow-pink-500/30'
    },
    {
      icon: Settings,
      label: isArabic ? 'إعدادات' : 'Settings',
      onClick: onSettingsClick,
      colorClass: 'text-muted-foreground',
      bgClass: 'bg-muted/50 hover:bg-muted/80',
      glowClass: 'group-hover:shadow-muted/30'
    }
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      {/* iOS-style glass dock with enhanced blur */}
      <div className={cn(
        "flex items-center gap-1.5 px-2 py-2 rounded-2xl",
        // Enhanced glass effect with stronger backdrop blur
        "bg-background/40 backdrop-blur-2xl backdrop-saturate-150",
        // Subtle border with gradient
        "border border-white/20 dark:border-white/10",
        // Deep shadow for depth
        "shadow-xl shadow-black/20",
        // Subtle inner highlight
        "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/10 before:to-transparent before:pointer-events-none",
        "relative overflow-hidden"
      )}>
        {dockItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={item.onClick}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl",
                // Bubble effect background
                item.bgClass,
                item.colorClass,
                // Smooth transitions
                "transition-all duration-300 ease-out",
                // Bubble scale on hover
                "hover:scale-110 active:scale-95",
                // Glow effect on hover
                "hover:shadow-lg",
                item.glowClass
              )}
              aria-label={item.label}
            >
              {/* Bubble highlight effect */}
              <div className={cn(
                "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100",
                "bg-gradient-to-t from-transparent via-white/10 to-white/20",
                "transition-opacity duration-300"
              )} />
              
              {/* Icon */}
              <Icon className={cn(
                "w-5 h-5 relative z-10",
                "transition-transform duration-300",
                "group-hover:scale-110"
              )} />
              
              {/* Label */}
              <span className={cn(
                "text-[10px] font-medium relative z-10",
                "opacity-70 group-hover:opacity-100",
                "transition-opacity duration-200"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
