import { useState } from 'react';
import { useSeasonalTheme } from '@/contexts/SeasonalThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Moon, Sparkles, PartyPopper, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type ThemeOption = 'none' | 'ramadan' | 'eid';

interface ThemeCardProps {
  themeKey: ThemeOption;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  icon: React.ReactNode;
  gradient: string;
  isActive: boolean;
  onActivate: () => void;
  isLoading: boolean;
}

function ThemeCard({ 
  themeKey, 
  title, 
  titleAr, 
  description, 
  descriptionAr, 
  icon, 
  gradient, 
  isActive, 
  onActivate, 
  isLoading 
}: ThemeCardProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg",
        isActive && "ring-2 ring-primary shadow-lg",
        gradient
      )}
      onClick={onActivate}
    >
      {isActive && (
        <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
          <Check className="h-3 w-3 mr-1" />
          {isArabic ? 'مفعّل' : 'Active'}
        </Badge>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-xl",
            isActive ? "bg-primary/20" : "bg-muted/50"
          )}>
            {icon}
          </div>
          <div>
            <CardTitle className="text-lg">
              {isArabic ? titleAr : title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {isArabic ? descriptionAr : description}
        </p>
        <Button 
          variant={isActive ? "secondary" : "default"}
          size="sm"
          className="mt-4 w-full"
          disabled={isLoading}
          onClick={(e) => {
            e.stopPropagation();
            onActivate();
          }}
        >
          {isActive 
            ? (isArabic ? 'إلغاء التفعيل' : 'Deactivate') 
            : (isArabic ? 'تفعيل' : 'Activate')}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function SeasonalThemeManager() {
  const { activeTheme, setTheme, isLoading: contextLoading } = useSeasonalTheme();
  const { language } = useLanguage();
  const [isUpdating, setIsUpdating] = useState(false);
  const isArabic = language === 'ar';

  const handleSetTheme = async (theme: ThemeOption) => {
    setIsUpdating(true);
    try {
      // If clicking the active theme, deactivate it
      const newTheme = activeTheme === theme ? 'none' : theme;
      await setTheme(newTheme);
      toast({
        title: isArabic ? 'تم تحديث الثيم' : 'Theme Updated',
        description: newTheme === 'none' 
          ? (isArabic ? 'تم إلغاء تفعيل الثيم الموسمي' : 'Seasonal theme deactivated')
          : (isArabic ? `تم تفعيل ثيم ${newTheme === 'ramadan' ? 'رمضان' : 'العيد'}` : `${newTheme === 'ramadan' ? 'Ramadan' : 'Eid'} theme activated`),
      });
    } catch (error) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في تحديث الثيم' : 'Failed to update theme',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const themes: Array<{
    key: ThemeOption;
    title: string;
    titleAr: string;
    description: string;
    descriptionAr: string;
    icon: React.ReactNode;
    gradient: string;
  }> = [
    {
      key: 'none',
      title: 'Default Theme',
      titleAr: 'الثيم الافتراضي',
      description: 'Standard look without seasonal decorations',
      descriptionAr: 'المظهر العادي بدون زينة موسمية',
      icon: <X className="h-6 w-6 text-muted-foreground" />,
      gradient: 'bg-gradient-to-br from-muted/30 to-muted/10',
    },
    {
      key: 'ramadan',
      title: 'Ramadan Theme',
      titleAr: 'ثيم رمضان',
      description: 'Golden crescents, stars, and lanterns floating upward',
      descriptionAr: 'أهلّة ذهبية ونجوم وفوانيس تطفو للأعلى',
      icon: <Moon className="h-6 w-6 text-amber-500" />,
      gradient: 'bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-indigo-500/10',
    },
    {
      key: 'eid',
      title: 'Eid Theme',
      titleAr: 'ثيم العيد',
      description: 'Colorful confetti and sparkles celebrating Eid',
      descriptionAr: 'قصاصات ملونة وبريق احتفالاً بالعيد',
      icon: <PartyPopper className="h-6 w-6 text-pink-500" />,
      gradient: 'bg-gradient-to-br from-pink-500/10 via-yellow-500/5 to-cyan-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          {isArabic ? 'ثيمات المناسبات' : 'Seasonal Themes'}
        </h2>
        <p className="text-muted-foreground mt-1">
          {isArabic 
            ? 'فعّل ثيم موسمي ليظهر لجميع المستخدمين مع خلفية متحركة'
            : 'Activate a seasonal theme to display for all users with animated background'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {themes.map((theme) => (
          <ThemeCard
            key={theme.key}
            themeKey={theme.key}
            title={theme.title}
            titleAr={theme.titleAr}
            description={theme.description}
            descriptionAr={theme.descriptionAr}
            icon={theme.icon}
            gradient={theme.gradient}
            isActive={activeTheme === theme.key || (theme.key === 'none' && activeTheme === 'none')}
            onActivate={() => theme.key === 'none' ? handleSetTheme('none') : handleSetTheme(theme.key)}
            isLoading={isUpdating || contextLoading}
          />
        ))}
      </div>

      {activeTheme !== 'none' && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-center">
            {isArabic 
              ? `🌙 ثيم ${activeTheme === 'ramadan' ? 'رمضان' : 'العيد'} مفعّل حالياً ويظهر لجميع المستخدمين`
              : `🌙 ${activeTheme === 'ramadan' ? 'Ramadan' : 'Eid'} theme is currently active and visible to all users`}
          </p>
        </div>
      )}
    </div>
  );
}
