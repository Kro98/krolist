import { useAdBlock } from '@/contexts/AdBlockContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, ShieldOff, X } from 'lucide-react';

export function AdBlockPrompt() {
  const { 
    showAdBlockPrompt, 
    setShowAdBlockPrompt, 
    handleUserDecision,
    promptTitleEn,
    promptTitleAr,
    promptDescriptionEn,
    promptDescriptionAr,
  } = useAdBlock();
  const { language } = useLanguage();

  const content = {
    en: {
      title: promptTitleEn,
      description: promptDescriptionEn,
      whitelistTitle: "Would you consider whitelisting Krolist?",
      whitelistBtn: "I'll whitelist Krolist",
      declineBtn: "No thanks",
      promise: "We promise to keep ads non-intrusive and relevant.",
    },
    ar: {
      title: promptTitleAr,
      description: promptDescriptionAr,
      whitelistTitle: "هل يمكنك إضافة كروليست للقائمة البيضاء؟",
      whitelistBtn: "سأضيف كروليست للقائمة البيضاء",
      declineBtn: "لا شكراً",
      promise: "نعدك بإبقاء الإعلانات غير مزعجة وذات صلة.",
    }
  };

  const t = content[language] || content.en;

  return (
    <Dialog open={showAdBlockPrompt} onOpenChange={(open) => !open && setShowAdBlockPrompt(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldOff className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            {t.title}
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <p className="text-center font-medium text-foreground">
            {t.whitelistTitle}
          </p>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => handleUserDecision(true)}
              className="w-full gap-2"
              size="lg"
            >
              <Heart className="h-4 w-4" />
              {t.whitelistBtn}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => handleUserDecision(false)}
              className="w-full text-muted-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              {t.declineBtn}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-2">
            {t.promise}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
