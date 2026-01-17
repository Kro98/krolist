import { useAdBlock } from '@/contexts/AdBlockContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Heart, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AdSupportBannerProps {
  position?: 'top' | 'bottom';
}

export function AdSupportBanner({ position = 'bottom' }: AdSupportBannerProps) {
  const { hasUserDeclined, handleUserDecision, bannerEnabled, bannerMessageEn, bannerMessageAr } = useAdBlock();
  const { language } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  // Show banner after a delay to not be intrusive
  useEffect(() => {
    if (hasUserDeclined && bannerEnabled && !isDismissed) {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [hasUserDeclined, bannerEnabled, isDismissed]);

  if (!hasUserDeclined || !bannerEnabled || isDismissed || !showBanner) {
    return null;
  }

  const content = {
    en: {
      message: bannerMessageEn || "Enjoying Krolist? Ads help us stay free!",
      supportBtn: "Support Us",
      dismissBtn: "Maybe Later",
    },
    ar: {
      message: bannerMessageAr || "هل تستمتع بكروليست؟ الإعلانات تساعدنا على البقاء مجانيين!",
      supportBtn: "ادعمنا",
      dismissBtn: "ربما لاحقاً",
    }
  };

  const t = content[language] || content.en;

  const handleSupport = () => {
    handleUserDecision(true);
    setIsDismissed(true);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div 
      className={`fixed ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 z-50 bg-gradient-to-r from-primary/90 to-primary dark:from-primary/80 dark:to-primary/90 text-primary-foreground px-4 py-3 shadow-lg animate-in slide-in-from-bottom-5 duration-300`}
    >
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm font-medium text-center sm:text-left">
          {t.message}
        </p>
        
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="secondary"
            onClick={handleSupport}
            className="gap-1.5 bg-background/20 hover:bg-background/30 text-primary-foreground border-0"
          >
            <Heart className="h-3.5 w-3.5" />
            {t.supportBtn}
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost"
            onClick={handleDismiss}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-background/10"
          >
            <X className="h-4 w-4 mr-1" />
            {t.dismissBtn}
          </Button>
        </div>
      </div>
    </div>
  );
}
