import { useState, useEffect } from 'react';
import { Paintbrush, Sun, Moon, Monitor, Image, Layers, LayoutGrid, LayoutList, Heart, Type } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Preview thumbnail components
const ClassicCardPreview = ({ selected }: { selected: boolean }) => (
  <div className={`w-full h-16 rounded-lg border-2 p-2 flex gap-2 transition-all ${selected ? 'border-primary bg-primary/10' : 'border-muted hover:border-muted-foreground/50'}`}>
    <div className="w-12 h-full bg-muted rounded" />
    <div className="flex-1 flex flex-col justify-center gap-1">
      <div className="h-2 w-3/4 bg-muted-foreground/30 rounded" />
      <div className="h-1.5 w-1/2 bg-muted-foreground/20 rounded" />
      <div className="h-1.5 w-1/3 bg-primary/50 rounded" />
    </div>
  </div>
);

const CompactCardPreview = ({ selected }: { selected: boolean }) => (
  <div className={`w-full h-16 rounded-lg border-2 p-2 transition-all ${selected ? 'border-primary bg-primary/10' : 'border-muted hover:border-muted-foreground/50'}`}>
    <div className="w-full h-8 bg-muted rounded mb-1" />
    <div className="flex flex-col gap-0.5">
      <div className="h-1.5 w-2/3 bg-muted-foreground/30 rounded" />
      <div className="h-1.5 w-1/3 bg-primary/50 rounded" />
    </div>
  </div>
);

const FadeImagePreview = ({ selected }: { selected: boolean }) => (
  <div className={`w-full h-16 rounded-lg border-2 overflow-hidden transition-all ${selected ? 'border-primary' : 'border-muted hover:border-muted-foreground/50'}`}>
    <div className="w-full h-full bg-muted relative">
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-0.5">
        <div className="h-1.5 w-2/3 bg-foreground/70 rounded" />
        <div className="h-1.5 w-1/3 bg-primary rounded" />
      </div>
    </div>
  </div>
);

const FullImagePreview = ({ selected }: { selected: boolean }) => (
  <div className={`w-full h-16 rounded-lg border-2 overflow-hidden transition-all ${selected ? 'border-primary' : 'border-muted hover:border-muted-foreground/50'}`}>
    <div className="w-full h-10 bg-muted" />
    <div className="p-1.5 bg-card flex flex-col gap-0.5">
      <div className="h-1.5 w-2/3 bg-muted-foreground/30 rounded" />
      <div className="h-1.5 w-1/3 bg-primary/50 rounded" />
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
  { id: 'orange', name: 'Orange', nameAr: 'برتقالي', color: 'hsl(31, 98%, 51%)' },
  { id: 'blue', name: 'Blue', nameAr: 'أزرق', color: 'hsl(217, 91%, 59%)' },
  { id: 'green', name: 'Green', nameAr: 'أخضر', color: 'hsl(142, 71%, 45%)' },
  { id: 'purple', name: 'Purple', nameAr: 'بنفسجي', color: 'hsl(271, 81%, 56%)' },
  { id: 'red', name: 'Red', nameAr: 'أحمر', color: 'hsl(0, 84%, 60%)' },
];

interface PersonalizeDialogProps {
  collapsed?: boolean;
  iconOnly?: boolean;
}

export function PersonalizeDialog({ collapsed = false, iconOnly = false }: PersonalizeDialogProps) {
  const { t, language } = useLanguage();
  const { theme, setTheme, undertone, setUndertone, customHue, setCustomHue } = useTheme();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [settings, setSettings] = useState<DitherSettings>(DEFAULT_SETTINGS);
  const [open, setOpen] = useState(false);
  const [mobileCardStyle, setMobileCardStyle] = useState<'fade' | 'full'>('fade');
  const [cardLayoutStyle, setCardLayoutStyle] = useState<'classic' | 'compact'>('compact');
  const [favoritesCardStyle, setFavoritesCardStyle] = useState<'classic' | 'compact'>('classic');
  const [desktopItemsPerRow, setDesktopItemsPerRow] = useState<2 | 3>(3);
  const [mobileItemsPerSlide, setMobileItemsPerSlide] = useState<1 | 2 | 4>(1);
  const [titleScrollSpeed, setTitleScrollSpeed] = useState<number>(5);

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
    
    const savedFavoritesStyle = localStorage.getItem('favoritesCardStyle');
    if (savedFavoritesStyle === 'classic' || savedFavoritesStyle === 'compact') {
      setFavoritesCardStyle(savedFavoritesStyle);
    }
    
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

  const saveFavoritesCardStyle = (style: 'classic' | 'compact') => {
    setFavoritesCardStyle(style);
    localStorage.setItem('favoritesCardStyle', style);
    window.dispatchEvent(new CustomEvent('favoritesCardStyleChanged', { detail: style }));
  };

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
    saveFavoritesCardStyle('classic');
    saveDesktopItemsPerRow(3);
    saveMobileItemsPerSlide(1);
    saveTitleScrollSpeed(5);
  };

  const isArabic = language === 'ar';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button 
          className={`flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white backdrop-blur-sm border border-white/10 hover:border-white/25 transition-all duration-200 ${
            iconOnly 
              ? 'w-8 h-8 ml-1' 
              : collapsed 
                ? 'w-10 h-10 mx-auto' 
                : 'w-full gap-2 p-2 px-[15px]'
          }`}
          title={t('settings.personalize') || 'Personalize'}
        >
          <Paintbrush className={iconOnly ? "h-3.5 w-3.5" : collapsed ? "h-5 w-5" : "h-4 w-4 shrink-0"} />
          {!collapsed && !iconOnly && <span className="flex-1 text-left">{isArabic ? 'تخصيص' : 'Personalize'}</span>}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isArabic ? 'تخصيص المظهر' : 'Personalize Appearance'}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="theme" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="theme">{isArabic ? 'السمة' : 'Theme'}</TabsTrigger>
            <TabsTrigger value="visual">{isArabic ? 'مرئي' : 'Visual'}</TabsTrigger>
            <TabsTrigger value="dither">{isArabic ? 'الخلفية' : 'Background'}</TabsTrigger>
          </TabsList>

          {/* Theme Tab */}
          <TabsContent value="theme" className="space-y-6 py-4">
            {/* Theme Mode */}
            <div className="space-y-3">
              <Label>{isArabic ? 'وضع السمة' : 'Theme Mode'}</Label>
              <div className="flex gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="flex-1 gap-2"
                >
                  <Sun className="h-4 w-4" />
                  {isArabic ? 'فاتح' : 'Light'}
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="flex-1 gap-2"
                >
                  <Moon className="h-4 w-4" />
                  {isArabic ? 'داكن' : 'Dark'}
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                  className="flex-1 gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  {isArabic ? 'النظام' : 'System'}
                </Button>
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-3">
              <Label>{isArabic ? 'لون التمييز' : 'Accent Color'}</Label>
              <div className="flex flex-wrap gap-2">
                {THEME_UNDERTONES.map((ut) => (
                  <button
                    key={ut.id}
                    onClick={() => setUndertone(ut.id as any)}
                    className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                      undertone === ut.id
                        ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-offset-background'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: ut.color }}
                    title={isArabic ? ut.nameAr : ut.name}
                  />
                ))}
                <button
                  onClick={() => setUndertone('custom')}
                  className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                    undertone === 'custom'
                      ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-offset-background'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)` }}
                  title={isArabic ? 'مخصص' : 'Custom'}
                />
              </div>
            </div>

            {/* Custom Hue Slider */}
            {undertone === 'custom' && (
              <div className="space-y-3">
                <Label>{isArabic ? 'درجة اللون المخصص' : 'Custom Hue'}: {customHue}°</Label>
                <div 
                  className="h-3 rounded-full"
                  style={{ background: 'linear-gradient(to right, red, yellow, lime, aqua, blue, magenta, red)' }}
                />
                <Slider
                  value={[customHue]}
                  onValueChange={([value]) => setCustomHue(value)}
                  min={0}
                  max={360}
                  step={1}
                />
              </div>
            )}
          </TabsContent>

          {/* Visual Tab */}
          <TabsContent value="visual" className="space-y-6 py-4">
            {/* Card Layout Style */}
            <div className="space-y-3">
              <Label>{isArabic ? 'تخطيط البطاقة' : 'Card Layout'}</Label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => saveCardLayoutStyle('classic')} className="flex flex-col gap-2">
                  <ClassicCardPreview selected={cardLayoutStyle === 'classic'} />
                  <span className={`text-xs text-center ${cardLayoutStyle === 'classic' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {isArabic ? 'كلاسيكي' : 'Classic'}
                  </span>
                </button>
                <button onClick={() => saveCardLayoutStyle('compact')} className="flex flex-col gap-2">
                  <CompactCardPreview selected={cardLayoutStyle === 'compact'} />
                  <span className={`text-xs text-center ${cardLayoutStyle === 'compact' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {isArabic ? 'مدمج' : 'Compact'}
                  </span>
                </button>
              </div>
            </div>

            {/* Mobile Card Style - only show when compact is selected */}
            {cardLayoutStyle === 'compact' && (
              <div className="space-y-3">
                <Label>{isArabic ? 'نمط صورة البطاقة' : 'Card Image Style'}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => saveMobileCardStyle('fade')} className="flex flex-col gap-2">
                    <FadeImagePreview selected={mobileCardStyle === 'fade'} />
                    <span className={`text-xs text-center ${mobileCardStyle === 'fade' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      {isArabic ? 'تلاشي' : 'Fade'}
                    </span>
                  </button>
                  <button onClick={() => saveMobileCardStyle('full')} className="flex flex-col gap-2">
                    <FullImagePreview selected={mobileCardStyle === 'full'} />
                    <span className={`text-xs text-center ${mobileCardStyle === 'full' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      {isArabic ? 'كامل' : 'Full'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Items Per Slide - only show on mobile when compact is selected */}
            {!isDesktop && cardLayoutStyle === 'compact' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-primary" />
                  <Label>{isArabic ? 'عناصر لكل شريحة' : 'Items Per Slide'}</Label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => saveMobileItemsPerSlide(1)} 
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      mobileItemsPerSlide === 1 ? 'border-primary bg-primary/10' : 'border-muted hover:border-muted-foreground/50'
                    }`}
                  >
                    <div className="flex gap-1 w-full justify-center">
                      <div className="w-8 h-10 bg-muted rounded" />
                    </div>
                    <span className={`text-xs ${mobileItemsPerSlide === 1 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      1
                    </span>
                  </button>
                  <button 
                    onClick={() => saveMobileItemsPerSlide(2)} 
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      mobileItemsPerSlide === 2 ? 'border-primary bg-primary/10' : 'border-muted hover:border-muted-foreground/50'
                    }`}
                  >
                    <div className="flex gap-1 w-full justify-center">
                      <div className="w-5 h-10 bg-muted rounded" />
                      <div className="w-5 h-10 bg-muted rounded" />
                    </div>
                    <span className={`text-xs ${mobileItemsPerSlide === 2 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      2
                    </span>
                  </button>
                  <button 
                    onClick={() => saveMobileItemsPerSlide(4)} 
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      mobileItemsPerSlide === 4 ? 'border-primary bg-primary/10' : 'border-muted hover:border-muted-foreground/50'
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-0.5 w-full justify-center">
                      <div className="w-full h-5 bg-muted rounded" />
                      <div className="w-full h-5 bg-muted rounded" />
                      <div className="w-full h-5 bg-muted rounded" />
                      <div className="w-full h-5 bg-muted rounded" />
                    </div>
                    <span className={`text-xs ${mobileItemsPerSlide === 4 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      2×2
                    </span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isArabic 
                    ? 'عدد المنتجات في كل شريحة على الهاتف' 
                    : 'Number of products per slide on mobile'}
                </p>
              </div>
            )}

            {/* My Favorites Card Style */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                <Label>{isArabic ? 'تخطيط المفضلة' : 'My Favorites Layout'}</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => saveFavoritesCardStyle('classic')} className="flex flex-col gap-2">
                  <ClassicCardPreview selected={favoritesCardStyle === 'classic'} />
                  <span className={`text-xs text-center ${favoritesCardStyle === 'classic' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {isArabic ? 'كلاسيكي' : 'Classic'}
                  </span>
                </button>
                <button onClick={() => saveFavoritesCardStyle('compact')} className="flex flex-col gap-2">
                  <CompactCardPreview selected={favoritesCardStyle === 'compact'} />
                  <span className={`text-xs text-center ${favoritesCardStyle === 'compact' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {isArabic ? 'مدمج' : 'Compact'}
                  </span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {isArabic 
                  ? 'تخصيص مظهر بطاقات المفضلة بشكل منفصل' 
                  : 'Customize favorites cards independently'}
              </p>
            </div>

            {/* Desktop Items Per Row - Only show on desktop */}
            {isDesktop && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-primary" />
                  <Label>{isArabic ? 'عناصر لكل صف (سطح المكتب)' : 'Items Per Row (Desktop)'}</Label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => saveDesktopItemsPerRow(2)} 
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      desktopItemsPerRow === 2 ? 'border-primary bg-primary/10' : 'border-muted hover:border-muted-foreground/50'
                    }`}
                  >
                    <div className="flex gap-2 w-full">
                      <div className="flex-1 h-8 bg-muted rounded" />
                      <div className="flex-1 h-8 bg-muted rounded" />
                    </div>
                    <span className={`text-xs ${desktopItemsPerRow === 2 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      2 {isArabic ? 'عناصر' : 'Items'}
                    </span>
                  </button>
                  <button 
                    onClick={() => saveDesktopItemsPerRow(3)} 
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      desktopItemsPerRow === 3 ? 'border-primary bg-primary/10' : 'border-muted hover:border-muted-foreground/50'
                    }`}
                  >
                    <div className="flex gap-1.5 w-full">
                      <div className="flex-1 h-8 bg-muted rounded" />
                      <div className="flex-1 h-8 bg-muted rounded" />
                      <div className="flex-1 h-8 bg-muted rounded" />
                    </div>
                    <span className={`text-xs ${desktopItemsPerRow === 3 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      3 {isArabic ? 'عناصر' : 'Items'}
                    </span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isArabic 
                    ? 'عدد المنتجات في كل صف على سطح المكتب' 
                    : 'Number of products per row on desktop'}
                </p>
              </div>
            )}

            {/* Title Scroll Speed */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-primary" />
                <Label>{isArabic ? 'سرعة تمرير العنوان' : 'Title Scroll Speed'}</Label>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{isArabic ? 'بطيء' : 'Slow'}</span>
                  <span>{titleScrollSpeed} px/s</span>
                  <span>{isArabic ? 'سريع' : 'Fast'}</span>
                </div>
                <Slider
                  value={[titleScrollSpeed]}
                  onValueChange={([value]) => saveTitleScrollSpeed(value)}
                  min={20}
                  max={150}
                  step={10}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {isArabic 
                  ? 'سرعة تمرير عناوين المنتجات الطويلة' 
                  : 'Speed for scrolling long product titles'}
              </p>
            </div>
          </TabsContent>

          {/* Dither Background Tab */}
          <TabsContent value="dither" className="space-y-6 py-4">
            {/* Enable/Disable Dither */}
            <div className="flex items-center justify-between">
              <Label htmlFor="dither-enabled">{isArabic ? 'تفعيل تأثير الخلفية' : 'Enable Background Effect'}</Label>
              <Switch
                id="dither-enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => saveSettings({ ...settings, enabled: checked })}
              />
            </div>

            {settings.enabled && (
              <>
                {/* Color Presets */}
                <div className="space-y-3">
                  <Label>{isArabic ? 'لون الموجة' : 'Wave Color'}</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => saveSettings({ ...settings, waveColor: preset.color })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          JSON.stringify(settings.waveColor) === JSON.stringify(preset.color)
                            ? 'border-primary scale-110 ring-2 ring-offset-2 ring-offset-background'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{
                          backgroundColor: `rgb(${preset.color[0] * 255}, ${preset.color[1] * 255}, ${preset.color[2] * 255})`,
                        }}
                        title={isArabic ? preset.nameAr : preset.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Wave Amplitude */}
                <div className="space-y-2">
                  <Label>{isArabic ? 'شدة الموجة' : 'Wave Intensity'}: {Math.round(settings.waveAmplitude * 100)}%</Label>
                  <Slider
                    value={[settings.waveAmplitude * 100]}
                    onValueChange={([value]) => saveSettings({ ...settings, waveAmplitude: value / 100 })}
                    min={10}
                    max={100}
                    step={5}
                  />
                </div>

                {/* Wave Frequency */}
                <div className="space-y-2">
                  <Label>{isArabic ? 'تردد الموجة' : 'Wave Frequency'}: {settings.waveFrequency}</Label>
                  <Slider
                    value={[settings.waveFrequency]}
                    onValueChange={([value]) => saveSettings({ ...settings, waveFrequency: value })}
                    min={1}
                    max={10}
                    step={0.5}
                  />
                </div>

                {/* Wave Speed */}
                <div className="space-y-2">
                  <Label>{isArabic ? 'سرعة الحركة' : 'Animation Speed'}: {Math.round(settings.waveSpeed * 1000)}%</Label>
                  <Slider
                    value={[settings.waveSpeed * 1000]}
                    onValueChange={([value]) => saveSettings({ ...settings, waveSpeed: value / 1000 })}
                    min={0}
                    max={200}
                    step={10}
                  />
                </div>

                {/* Color Depth */}
                <div className="space-y-2">
                  <Label>{isArabic ? 'عمق الألوان' : 'Color Depth'}: {settings.colorNum}</Label>
                  <Slider
                    value={[settings.colorNum]}
                    onValueChange={([value]) => saveSettings({ ...settings, colorNum: value })}
                    min={2}
                    max={8}
                    step={1}
                  />
                </div>

                {/* Mouse Interaction */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="mouse-interaction">{isArabic ? 'تفاعل الماوس' : 'Mouse Interaction'}</Label>
                  <Switch
                    id="mouse-interaction"
                    checked={settings.enableMouseInteraction}
                    onCheckedChange={(checked) => saveSettings({ ...settings, enableMouseInteraction: checked })}
                  />
                </div>

                {settings.enableMouseInteraction && (
                  <div className="space-y-2">
                    <Label>{isArabic ? 'نطاق التفاعل' : 'Interaction Radius'}: {Math.round(settings.mouseRadius * 100)}%</Label>
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
          </TabsContent>
        </Tabs>

        {/* Reset Button */}
        <Button variant="outline" onClick={handleReset} className="w-full mt-4">
          {isArabic ? 'إعادة تعيين الإعدادات' : 'Reset to Defaults'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
