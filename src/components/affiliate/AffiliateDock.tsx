import { Search, Heart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface AffiliateDockProps {
  onSearchClick: () => void;
  onHeartClick: () => void;
  onSettingsClick: () => void;
}

export function AffiliateDock({ 
  onSearchClick, 
  onHeartClick, 
  onSettingsClick,
}: AffiliateDockProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [isVisible, setIsVisible] = useState(false);
  const [activeAnim, setActiveAnim] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const triggerAnim = useCallback((key: string, callback: () => void) => {
    setActiveAnim(key);
    callback();
    setTimeout(() => setActiveAnim(null), 600);
  }, []);

  const dockItems = [
    {
      key: 'search',
      icon: Search,
      label: isArabic ? 'بحث' : 'Search',
      onClick: () => triggerAnim('search', onSearchClick),
      colorClass: 'text-primary',
      bgClass: 'bg-primary/10 hover:bg-primary/20',
      glowClass: 'group-hover:shadow-primary/30'
    },
    {
      key: 'heart',
      icon: Heart,
      label: isArabic ? 'دعم' : 'Support',
      onClick: () => triggerAnim('heart', onHeartClick),
      colorClass: 'text-pink-500',
      bgClass: 'bg-pink-500/10 hover:bg-pink-500/20',
      glowClass: 'group-hover:shadow-pink-500/30'
    },
    {
      key: 'settings',
      icon: Settings,
      label: isArabic ? 'إعدادات' : 'Settings',
      onClick: () => triggerAnim('settings', onSettingsClick),
      colorClass: 'text-muted-foreground',
      bgClass: 'bg-muted/50 hover:bg-muted/80',
      glowClass: 'group-hover:shadow-muted/30'
    }
  ];

  // Animation variants per icon
  const iconVariants: Record<string, any> = {
    search: {
      animate: {
        scale: [1, 1.3, 1],
        opacity: [1, 0.6, 1],
        filter: [
          "brightness(1) drop-shadow(0 0 0px transparent)",
          "brightness(1.8) drop-shadow(0 0 8px hsl(var(--primary) / 0.6))",
          "brightness(1) drop-shadow(0 0 0px transparent)"
        ],
        transition: { duration: 0.5, ease: "easeInOut" }
      }
    },
    heart: {
      animate: {
        scale: [1, 1.4, 0.9, 1.2, 1],
        rotate: [0, -10, 10, -5, 0],
        transition: { duration: 0.5, ease: "easeInOut" }
      }
    },
    settings: {
      animate: {
        rotate: [0, 90],
        scale: [1, 1.1, 1],
        transition: { duration: 0.5, ease: "easeOut" }
      }
    }
  };

  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[90vw] sm:max-w-none",
      "transition-all duration-500 ease-out",
      isVisible 
        ? "opacity-100 translate-y-0" 
        : "opacity-0 translate-y-8 scale-95"
    )}>
      <div className={cn(
        "flex items-center gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-2xl sm:rounded-3xl",
        "bg-background/40 backdrop-blur-2xl backdrop-saturate-150",
        "border border-white/20 dark:border-white/10",
        "shadow-xl shadow-black/20",
        "before:absolute before:inset-0 before:rounded-2xl sm:before:rounded-3xl before:bg-gradient-to-b before:from-white/10 before:to-transparent before:pointer-events-none",
        "relative overflow-hidden"
      )}>
        {dockItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeAnim === item.key;
          const variant = iconVariants[item.key];
          
          return (
            <button
              key={item.key}
              onClick={item.onClick}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-1 sm:gap-1.5",
                "px-3 sm:px-4 md:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl",
                item.bgClass,
                item.colorClass,
                "transition-all duration-300 ease-out",
                "hover:scale-110 active:scale-95",
                "hover:shadow-lg",
                item.glowClass
              )}
              aria-label={item.label}
            >
              <div className={cn(
                "absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100",
                "bg-gradient-to-t from-transparent via-white/10 to-white/20",
                "transition-opacity duration-300"
              )} />
              
              <motion.div
                className="relative z-10"
                animate={isActive ? variant.animate : {}}
                style={item.key === 'heart' && isActive ? { fill: 'currentColor' } : {}}
              >
                <Icon className={cn(
                  "w-5 h-5 sm:w-6 sm:h-6",
                  "transition-transform duration-300",
                  "group-hover:scale-110",
                  item.key === 'heart' && isActive && "fill-current"
                )} />
              </motion.div>
              
              <span className={cn(
                "text-[10px] sm:text-xs font-medium relative z-10",
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
