import { useState, useEffect } from "react";
import { X, Globe, Grid3X3, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMediaQuery } from "@/hooks/use-media-query";

interface AffiliateSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onGridChange: (columns: number) => void;
  currentGrid: number;
}

export function AffiliateSettings({ 
  isOpen, 
  onClose, 
  onGridChange,
  currentGrid 
}: AffiliateSettingsProps) {
  const { language, setLanguage } = useLanguage();
  const isArabic = language === 'ar';
  const [selectedGrid, setSelectedGrid] = useState(currentGrid);
  const isMobile = !useMediaQuery("(min-width: 640px)");

  useEffect(() => {
    setSelectedGrid(currentGrid);
  }, [currentGrid]);

  const handleGridSelect = (cols: number) => {
    setSelectedGrid(cols);
    onGridChange(cols);
    localStorage.setItem('affiliateGridColumns', cols.toString());
  };

  const handleLanguageChange = (lang: 'en' | 'ar') => {
    setLanguage(lang);
  };

  if (!isOpen) return null;

  const gridOptions = [
    { cols: 2, label: '2×2' },
    { cols: 3, label: '3×3' },
    { cols: 4, label: '4×4' },
    { cols: 5, label: '5×5' },
    { cols: 6, label: '6×6' },
  ];

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Settings Panel */}
      <div 
        className={cn(
          "relative w-full max-w-sm rounded-2xl overflow-hidden",
          "bg-background/80 backdrop-blur-2xl backdrop-saturate-150",
          "border border-white/20 dark:border-white/10",
          "shadow-2xl",
          "animate-in slide-in-from-bottom-4 duration-300"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h2 className="text-lg font-semibold">
            {isArabic ? 'الإعدادات' : 'Settings'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Language Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Globe className="w-4 h-4" />
              {isArabic ? 'اللغة' : 'Language'}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { code: 'en' as const, label: 'English', flag: '🇺🇸' },
                { code: 'ar' as const, label: 'العربية', flag: '🇸🇦' }
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={cn(
                    "relative flex items-center justify-center gap-2 p-3 rounded-xl",
                    "border transition-all duration-200",
                    language === lang.code
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.label}</span>
                  {language === lang.code && (
                    <Check className="w-4 h-4 absolute top-2 right-2" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Layout Selection - Hidden on mobile */}
          {!isMobile && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Grid3X3 className="w-4 h-4" />
                {isArabic ? 'تخطيط الشبكة' : 'Grid Layout'}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {gridOptions.map((option) => (
                  <button
                    key={option.cols}
                    onClick={() => handleGridSelect(option.cols)}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-3 rounded-xl",
                      "border transition-all duration-200",
                      selectedGrid === option.cols
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    {/* Mini grid preview */}
                    <div className={cn(
                      "grid gap-0.5 w-6 h-6 mb-1",
                      option.cols === 2 && "grid-cols-2",
                      option.cols === 3 && "grid-cols-3",
                      option.cols === 4 && "grid-cols-2",
                      option.cols === 5 && "grid-cols-3",
                      option.cols === 6 && "grid-cols-3"
                    )}>
                      {Array.from({ length: Math.min(option.cols, 6) }).map((_, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "rounded-[2px]",
                            selectedGrid === option.cols 
                              ? "bg-primary" 
                              : "bg-muted-foreground/30"
                          )} 
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium">{option.cols}</span>
                    {selectedGrid === option.cols && (
                      <Check className="w-3 h-3 absolute top-1 right-1" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {isArabic 
                  ? 'يتم ضبط التخطيط تلقائيًا حسب حجم الشاشة'
                  : 'Layout auto-adjusts based on screen size'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            {isArabic 
              ? 'يتم حفظ الإعدادات محليًا على جهازك'
              : 'Settings are saved locally on your device'}
          </p>
        </div>
      </div>
    </div>
  );
}
