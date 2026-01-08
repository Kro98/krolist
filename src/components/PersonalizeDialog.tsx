import { useState, useEffect } from 'react';
import { Sparkles, Sun, Moon, Monitor, LayoutGrid, Heart, Type, Waves, RotateCcw, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Preview Components
const ClassicCardPreview = () => (
  <div className="w-full h-14 bg-card/50 rounded-lg border border-border/30 p-1.5 flex gap-1.5">
    <div className="w-10 h-full bg-muted/60 rounded" />
    <div className="flex-1 flex flex-col justify-center gap-1">
      <div className="h-1.5 w-3/4 bg-muted-foreground/20 rounded-full" />
      <div className="h-1 w-1/2 bg-muted-foreground/10 rounded-full" />
      <div className="h-1 w-1/3 bg-primary/40 rounded-full" />
    </div>
  </div>
);

const CompactCardPreview = () => (
  <div className="w-full h-14 bg-card/50 rounded-lg border border-border/30 p-1.5">
    <div className="w-full h-7 bg-muted/60 rounded mb-1" />
    <div className="flex flex-col gap-0.5 px-0.5">
      <div className="h-1 w-2/3 bg-muted-foreground/20 rounded-full" />
      <div className="h-1 w-1/3 bg-primary/40 rounded-full" />
    </div>
  </div>
);

const FadeImagePreview = () => (
  <div className="w-full h-12 rounded-lg border border-border/30 overflow-hidden bg-muted/40 relative">
    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-col gap-0.5">
      <div className="h-1 w-2/3 bg-foreground/50 rounded-full" />
      <div className="h-1 w-1/3 bg-primary/50 rounded-full" />
    </div>
  </div>
);

const FullImagePreview = () => (
  <div className="w-full h-12 rounded-lg border border-border/30 overflow-hidden">
    <div className="w-full h-7 bg-muted/40" />
    <div className="p-1 bg-card/50 flex flex-col gap-0.5">
      <div className="h-1 w-2/3 bg-muted-foreground/20 rounded-full" />
    </div>
  </div>
);

interface DitherSettings {
  enabled: boolean;
  waveColor: [number, number, number];
  waveAmplitude: number;
  waveFrequency: number;
  waveSpeed: number;
  colorNum: number;
  enableMouseInteraction: boolean;
  mouseRadius: number;
}

const DEFAULT_SETTINGS: DitherSettings = {
  enabled: true,
  waveColor: [0.5, 0.5, 0.5],
  waveAmplitude: 0.3,
  waveFrequency: 3,
  waveSpeed: 0.05,
  colorNum: 4,
  enableMouseInteraction: false,
  mouseRadius: 0.3,
};

const COLOR_PRESETS = [
  { name: 'Gray', nameAr: 'رمادي', color: [0.5, 0.5, 0.5] as [number, number, number] },
  { name: 'Blue', nameAr: 'أزرق', color: [0.2, 0.4, 0.8] as [number, number, number] },
  { name: 'Purple', nameAr: 'بنفسجي', color: [0.6, 0.3, 0.8] as [number, number, number] },
  { name: 'Green', nameAr: 'أخضر', color: [0.3, 0.7, 0.4] as [number, number, number] },
  { name: 'Orange', nameAr: 'برتقالي', color: [0.9, 0.5, 0.2] as [number, number, number] },
  { name: 'Cyan', nameAr: 'سماوي', color: [0.2, 0.7, 0.8] as [number, number, number] },
  { name: 'Pink', nameAr: 'وردي', color: [0.9, 0.4, 0.6] as [number, number, number] },
  { name: 'Gold', nameAr: 'ذهبي', color: [0.85, 0.65, 0.2] as [number, number, number] },
];

const THEME_UNDERTONES = [
  { id: 'orange', name: 'Orange', nameAr: 'برتقالي', hsl: '31 98% 51%' },
  { id: 'blue', name: 'Blue', nameAr: 'أزرق', hsl: '217 91% 59%' },
  { id: 'green', name: 'Green', nameAr: 'أخضر', hsl: '142 71% 45%' },
  { id: 'purple', name: 'Purple', nameAr: 'بنفسجي', hsl: '271 81% 56%' },
  { id: 'red', name: 'Red', nameAr: 'أحمر', hsl: '0 84% 60%' },
];

interface PersonalizeDialogProps {
  collapsed?: boolean;
  iconOnly?: boolean;
}

type ActiveSection = 'theme' | 'layout' | 'effects';

export function PersonalizeDialog({ collapsed = false, iconOnly = false }: PersonalizeDialogProps) {
  const { t, language } = useLanguage();
  const { theme, setTheme, undertone, setUndertone, customHue, setCustomHue } = useTheme();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [settings, setSettings] = useState<DitherSettings>(DEFAULT_SETTINGS);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>('theme');
  const [mobileCardStyle, setMobileCardStyle] = useState<'fade' | 'full'>('fade');
  const [cardLayoutStyle, setCardLayoutStyle] = useState<'classic' | 'compact'>('compact');
  // Favorites always uses classic style - no toggle needed
  const [desktopItemsPerRow, setDesktopItemsPerRow] = useState<2 | 3>(3);
  const [mobileItemsPerSlide, setMobileItemsPerSlide] = useState<1 | 2 | 4>(2);
  const [titleScrollSpeed, setTitleScrollSpeed] = useState<number>(3);

  const isArabic = language === 'ar';

  useEffect(() => {
    const saved = localStorage.getItem('ditherSettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    }
    
    const savedCardStyle = localStorage.getItem('mobileCardStyle');
    if (savedCardStyle === 'fade' || savedCardStyle === 'full') {
      setMobileCardStyle(savedCardStyle);
    }
    
    const savedLayoutStyle = localStorage.getItem('cardLayoutStyle');
    if (savedLayoutStyle === 'classic' || savedLayoutStyle === 'compact') {
      setCardLayoutStyle(savedLayoutStyle);
    }
    
    // Favorites always uses classic - no need to load from storage
    
    const savedItemsPerRow = localStorage.getItem('desktopItemsPerRow');
    if (savedItemsPerRow === '2' || savedItemsPerRow === '3') {
      setDesktopItemsPerRow(parseInt(savedItemsPerRow) as 2 | 3);
    }
    
    const savedMobileItemsPerSlide = localStorage.getItem('mobileItemsPerSlide');
    if (savedMobileItemsPerSlide === '1' || savedMobileItemsPerSlide === '2' || savedMobileItemsPerSlide === '4') {
      setMobileItemsPerSlide(parseInt(savedMobileItemsPerSlide) as 1 | 2 | 4);
    }
    
    const savedTitleScrollSpeed = localStorage.getItem('titleScrollSpeed');
    if (savedTitleScrollSpeed) {
      setTitleScrollSpeed(parseInt(savedTitleScrollSpeed));
    }
  }, []);

  const saveSettings = (newSettings: DitherSettings) => {
    setSettings(newSettings);
    localStorage.setItem('ditherSettings', JSON.stringify(newSettings));
    window.dispatchEvent(new CustomEvent('ditherSettingsChanged', { detail: newSettings }));
  };

  const saveMobileCardStyle = (style: 'fade' | 'full') => {
    setMobileCardStyle(style);
    localStorage.setItem('mobileCardStyle', style);
    window.dispatchEvent(new CustomEvent('mobileCardStyleChanged', { detail: style }));
  };

  const saveCardLayoutStyle = (style: 'classic' | 'compact') => {
    setCardLayoutStyle(style);
    localStorage.setItem('cardLayoutStyle', style);
    window.dispatchEvent(new CustomEvent('cardLayoutStyleChanged', { detail: style }));
  };

  // Favorites always uses classic style - function removed

  const saveDesktopItemsPerRow = (count: 2 | 3) => {
    setDesktopItemsPerRow(count);
    localStorage.setItem('desktopItemsPerRow', count.toString());
    window.dispatchEvent(new CustomEvent('desktopItemsPerRowChanged', { detail: count }));
  };

  const saveTitleScrollSpeed = (speed: number) => {
    setTitleScrollSpeed(speed);
    localStorage.setItem('titleScrollSpeed', speed.toString());
    window.dispatchEvent(new CustomEvent('titleScrollSpeedChanged', { detail: speed }));
  };

  const saveMobileItemsPerSlide = (count: 1 | 2 | 4) => {
    setMobileItemsPerSlide(count);
    localStorage.setItem('mobileItemsPerSlide', count.toString());
    window.dispatchEvent(new CustomEvent('mobileItemsPerSlideChanged', { detail: count }));
  };

  const handleReset = () => {
    saveSettings(DEFAULT_SETTINGS);
    setTheme('dark');
    setUndertone('orange');
    setCustomHue(31);
    saveMobileCardStyle('fade');
    saveCardLayoutStyle('compact');
    // Favorites always uses classic - no need to reset
    saveDesktopItemsPerRow(3);
    saveMobileItemsPerSlide(2);
    saveTitleScrollSpeed(3);
  };

  const sections: { id: ActiveSection; icon: typeof Sparkles; label: string }[] = [
    { id: 'theme', icon: Sparkles, label: isArabic ? 'المظهر' : 'Theme' },
    { id: 'layout', icon: LayoutGrid, label: isArabic ? 'التخطيط' : 'Layout' },
    { id: 'effects', icon: Waves, label: isArabic ? 'التأثيرات' : 'Effects' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button 
          className={cn(
            "flex items-center justify-center rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20 text-foreground/80 hover:text-foreground border border-primary/20 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md",
            iconOnly 
              ? 'w-8 h-8 ml-1' 
              : collapsed 
                ? 'w-10 h-10 mx-auto' 
                : 'w-full gap-2.5 py-2.5 px-4'
          )}
          title={t('settings.personalize') || 'Personalize'}
        >
          <Sparkles className={cn(
            "text-primary",
            iconOnly ? "h-3.5 w-3.5" : collapsed ? "h-5 w-5" : "h-4 w-4 shrink-0"
          )} />
          {!collapsed && !iconOnly && (
            <span className="flex-1 text-left font-medium text-sm">{isArabic ? 'تخصيص' : 'Personalize'}</span>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden bg-background border-border/50 shadow-2xl">
        {/* Header */}
        <div className="relative px-5 py-4 border-b border-border/40 bg-gradient-to-br from-primary/8 via-transparent to-primary/5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="relative flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/15 ring-1 ring-primary/25 shadow-sm">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                {isArabic ? 'تخصيص المظهر' : 'Personalize'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isArabic ? 'اجعله يعكس أسلوبك' : 'Make it uniquely yours'}
              </p>
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="px-4 py-3 border-b border-border/30 bg-muted/20">
          <div className="flex gap-1 p-1 rounded-xl bg-background/60 ring-1 ring-border/40 shadow-inner">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="px-5 py-4 max-h-[55vh] overflow-y-auto space-y-5">
          
          {/* Theme Section */}
          {activeSection === 'theme' && (
            <>
              {/* Theme Mode */}
              <div className="space-y-2.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {isArabic ? 'الوضع' : 'Mode'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'light' as const, icon: Sun, label: isArabic ? 'فاتح' : 'Light' },
                    { value: 'dark' as const, icon: Moon, label: isArabic ? 'داكن' : 'Dark' },
                    { value: 'system' as const, icon: Monitor, label: isArabic ? 'تلقائي' : 'Auto' },
                  ].map((mode) => {
                    const Icon = mode.icon;
                    const isActive = theme === mode.value;
                    return (
                      <button
                        key={mode.value}
                        onClick={() => setTheme(mode.value)}
                        className={cn(
                          "relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
                          isActive
                            ? "border-primary bg-primary/8 shadow-sm"
                            : "border-border/40 hover:border-border hover:bg-muted/30"
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-lg transition-colors",
                          isActive ? "bg-primary/15" : "bg-muted/50"
                        )}>
                          <Icon className={cn(
                            "h-4 w-4 transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <span className={cn(
                          "text-[11px] font-medium transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}>
                          {mode.label}
                        </span>
                        {isActive && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color */}
              <div className="space-y-2.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {isArabic ? 'اللون الرئيسي' : 'Accent Color'}
                </label>
                <div className="flex flex-wrap gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/30">
                  {THEME_UNDERTONES.map((color) => {
                    const isActive = undertone === color.id;
                    return (
                      <button
                        key={color.id}
                        onClick={() => setUndertone(color.id as any)}
                        className={cn(
                          "w-9 h-9 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all duration-200",
                          isActive ? "ring-foreground scale-110 shadow-lg" : "ring-transparent hover:ring-border hover:scale-105"
                        )}
                        style={{ backgroundColor: `hsl(${color.hsl})` }}
                        title={isArabic ? color.nameAr : color.name}
                      >
                        {isActive && <Check className="h-4 w-4 text-white mx-auto drop-shadow-md" />}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setUndertone('custom')}
                    className={cn(
                      "w-9 h-9 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all duration-200",
                      undertone === 'custom' ? "ring-foreground scale-110 shadow-lg" : "ring-transparent hover:ring-border hover:scale-105"
                    )}
                    style={{ background: 'conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
                    title={isArabic ? 'مخصص' : 'Custom'}
                  >
                    {undertone === 'custom' && <Check className="h-4 w-4 text-white mx-auto drop-shadow-md" />}
                  </button>
                </div>

                {undertone === 'custom' && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{isArabic ? 'درجة اللون' : 'Hue'}</span>
                      <span className="text-xs font-medium text-primary">{customHue}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={customHue}
                      onChange={(e) => setCustomHue(parseInt(e.target.value))}
                      className="w-full h-2.5 rounded-full appearance-none cursor-pointer hue-slider"
                      style={{
                        background: 'linear-gradient(to right, hsl(0, 85%, 55%), hsl(60, 85%, 55%), hsl(120, 85%, 55%), hsl(180, 85%, 55%), hsl(240, 85%, 55%), hsl(300, 85%, 55%), hsl(360, 85%, 55%))'
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Layout Section */}
          {activeSection === 'layout' && (
            <>
              {/* Card Layout */}
              <div className="space-y-2.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {isArabic ? 'تخطيط البطاقات' : 'Card Style'}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { value: 'classic' as const, label: isArabic ? 'كلاسيكي' : 'Classic', preview: ClassicCardPreview },
                    { value: 'compact' as const, label: isArabic ? 'مدمج' : 'Compact', preview: CompactCardPreview },
                  ].map((layout) => {
                    const isActive = cardLayoutStyle === layout.value;
                    const Preview = layout.preview;
                    return (
                      <button
                        key={layout.value}
                        onClick={() => saveCardLayoutStyle(layout.value)}
                        className={cn(
                          "relative p-2.5 rounded-xl border-2 transition-all duration-200",
                          isActive
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border/40 hover:border-border hover:bg-muted/20"
                        )}
                      >
                        <Preview />
                        <div className="flex items-center justify-center mt-2">
                          <span className={cn(
                            "text-[11px] font-medium",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )}>
                            {layout.label}
                          </span>
                        </div>
                        {isActive && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Favorites always uses Classic style - no toggle needed */}

              {/* Compact Options */}
              {cardLayoutStyle === 'compact' && (
                <div className="space-y-2.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {isArabic ? 'نمط الصورة' : 'Image Style'}
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { value: 'fade' as const, label: isArabic ? 'تلاشي' : 'Fade', preview: FadeImagePreview },
                      { value: 'full' as const, label: isArabic ? 'كامل' : 'Full', preview: FullImagePreview },
                    ].map((style) => {
                      const isActive = mobileCardStyle === style.value;
                      const Preview = style.preview;
                      return (
                        <button
                          key={style.value}
                          onClick={() => saveMobileCardStyle(style.value)}
                          className={cn(
                            "relative p-2.5 rounded-xl border-2 transition-all duration-200",
                            isActive
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border/40 hover:border-border hover:bg-muted/20"
                          )}
                        >
                          <Preview />
                          <div className="flex items-center justify-center mt-2">
                            <span className={cn(
                              "text-[11px] font-medium",
                              isActive ? "text-primary" : "text-muted-foreground"
                            )}>
                              {style.label}
                            </span>
                          </div>
                          {isActive && (
                            <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-primary-foreground" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grid Density */}
              {isDesktop ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <LayoutGrid className="h-3 w-3 text-primary" />
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {isArabic ? 'كثافة الشبكة' : 'Grid Density'}
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {([2, 3] as const).map((count) => {
                      const isActive = desktopItemsPerRow === count;
                      return (
                        <button
                          key={count}
                          onClick={() => saveDesktopItemsPerRow(count)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
                            isActive
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border/40 hover:border-border hover:bg-muted/20"
                          )}
                        >
                          <div className="flex gap-1 w-full justify-center">
                            {Array.from({ length: count }).map((_, i) => (
                              <div key={i} className="flex-1 max-w-8 h-6 bg-muted/60 rounded" />
                            ))}
                          </div>
                          <span className={cn(
                            "text-[11px] font-medium",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )}>
                            {count} {isArabic ? 'عناصر' : 'items'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <LayoutGrid className="h-3 w-3 text-primary" />
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {isArabic ? 'عناصر لكل شريحة' : 'Items Per Slide'}
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {([1, 2, 4] as const).map((count) => {
                      const isActive = mobileItemsPerSlide === count;
                      const displayLabel = count === 4 ? '2×2' : count.toString();
                      return (
                        <button
                          key={count}
                          onClick={() => saveMobileItemsPerSlide(count)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all duration-200",
                            isActive
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border/40 hover:border-border hover:bg-muted/20"
                          )}
                        >
                          {count === 4 ? (
                            <div className="grid grid-cols-2 gap-0.5 w-full max-w-10">
                              {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-4 bg-muted/60 rounded" />
                              ))}
                            </div>
                          ) : (
                            <div className="flex gap-1 justify-center w-full">
                              {[...Array(count)].map((_, i) => (
                                <div key={i} className="w-5 h-8 bg-muted/60 rounded" />
                              ))}
                            </div>
                          )}
                          <span className={cn(
                            "text-[10px] font-medium",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )}>
                            {displayLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Title Scroll Speed */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Type className="h-3 w-3 text-primary" />
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {isArabic ? 'سرعة التمرير' : 'Scroll Speed'}
                    </label>
                  </div>
                  <span className="text-xs font-medium text-primary">{titleScrollSpeed} px/s</span>
                </div>
                <Slider
                  value={[titleScrollSpeed]}
                  onValueChange={([value]) => saveTitleScrollSpeed(value)}
                  min={20}
                  max={150}
                  step={10}
                  className="w-full"
                />
              </div>
            </>
          )}

          {/* Effects Section */}
          {activeSection === 'effects' && (
            <>
              {/* Background Effect Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-primary/15">
                    <Waves className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{isArabic ? 'تأثير الخلفية' : 'Background Effect'}</p>
                    <p className="text-[11px] text-muted-foreground">{isArabic ? 'أمواج متحركة' : 'Animated waves'}</p>
                  </div>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => saveSettings({ ...settings, enabled: checked })}
                />
              </div>

              {settings.enabled && (
                <>
                  {/* Wave Colors */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {isArabic ? 'لون الموجة' : 'Wave Color'}
                    </label>
                    <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-muted/20 border border-border/30">
                      {COLOR_PRESETS.map((preset) => {
                        const isActive = JSON.stringify(settings.waveColor) === JSON.stringify(preset.color);
                        return (
                          <button
                            key={preset.name}
                            onClick={() => saveSettings({ ...settings, waveColor: preset.color })}
                            className={cn(
                              "w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all duration-200",
                              isActive ? "ring-foreground scale-110 shadow-lg" : "ring-transparent hover:ring-border hover:scale-105"
                            )}
                            style={{
                              backgroundColor: `rgb(${preset.color[0] * 255}, ${preset.color[1] * 255}, ${preset.color[2] * 255})`,
                            }}
                            title={isArabic ? preset.nameAr : preset.name}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Wave Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{isArabic ? 'الشدة' : 'Intensity'}</span>
                        <span className="text-xs font-medium text-primary">{Math.round(settings.waveAmplitude * 100)}%</span>
                      </div>
                      <Slider
                        value={[settings.waveAmplitude * 100]}
                        onValueChange={([value]) => saveSettings({ ...settings, waveAmplitude: value / 100 })}
                        min={10}
                        max={100}
                        step={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{isArabic ? 'التردد' : 'Frequency'}</span>
                        <span className="text-xs font-medium text-primary">{settings.waveFrequency}</span>
                      </div>
                      <Slider
                        value={[settings.waveFrequency]}
                        onValueChange={([value]) => saveSettings({ ...settings, waveFrequency: value })}
                        min={1}
                        max={10}
                        step={0.5}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{isArabic ? 'السرعة' : 'Speed'}</span>
                        <span className="text-xs font-medium text-primary">{Math.round(settings.waveSpeed * 1000)}%</span>
                      </div>
                      <Slider
                        value={[settings.waveSpeed * 1000]}
                        onValueChange={([value]) => saveSettings({ ...settings, waveSpeed: value / 1000 })}
                        min={0}
                        max={200}
                        step={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{isArabic ? 'العمق' : 'Depth'}</span>
                        <span className="text-xs font-medium text-primary">{settings.colorNum}</span>
                      </div>
                      <Slider
                        value={[settings.colorNum]}
                        onValueChange={([value]) => saveSettings({ ...settings, colorNum: value })}
                        min={2}
                        max={8}
                        step={1}
                      />
                    </div>
                  </div>

                  {/* Mouse Interaction */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/30">
                    <span className="text-sm font-medium">{isArabic ? 'تفاعل الماوس' : 'Mouse Interaction'}</span>
                    <Switch
                      checked={settings.enableMouseInteraction}
                      onCheckedChange={(checked) => saveSettings({ ...settings, enableMouseInteraction: checked })}
                    />
                  </div>

                  {settings.enableMouseInteraction && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{isArabic ? 'نطاق التفاعل' : 'Interaction Radius'}</span>
                        <span className="text-xs font-medium text-primary">{Math.round(settings.mouseRadius * 100)}%</span>
                      </div>
                      <Slider
                        value={[settings.mouseRadius * 100]}
                        onValueChange={([value]) => saveSettings({ ...settings, mouseRadius: value / 100 })}
                        min={10}
                        max={80}
                        step={5}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/40 bg-muted/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="w-full gap-2 text-muted-foreground hover:text-foreground h-9"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="text-xs">{isArabic ? 'إعادة التعيين' : 'Reset to Defaults'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
