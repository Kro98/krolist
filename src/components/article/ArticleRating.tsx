import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubmitRating } from '@/hooks/useArticle';

interface ArticleRatingProps {
  articleId: string;
}

export const ArticleRating = ({ articleId }: ArticleRatingProps) => {
  const { language } = useLanguage();
  const [hasRated, setHasRated] = useState(false);
  const [selectedRating, setSelectedRating] = useState<boolean | null>(null);
  const submitRating = useSubmitRating();
  
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('article_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('article_session_id', sessionId);
    }
    return sessionId;
  };
  
  const handleRate = async (isHelpful: boolean) => {
    if (hasRated) return;
    
    setSelectedRating(isHelpful);
    setHasRated(true);
    
    await submitRating.mutateAsync({
      article_id: articleId,
      is_helpful: isHelpful,
      session_id: getSessionId(),
    });
  };
  
  if (hasRated) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
        <Check className="w-5 h-5 text-emerald-500" />
        <span>
          {language === 'ar' 
            ? 'شكراً لتقييمك!' 
            : 'Thanks for your feedback!'}
        </span>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 border-t border-b border-border/50">
      <p className="text-lg font-medium text-foreground">
        {language === 'ar' ? 'هل كانت هذه المقالة مفيدة؟' : 'Was this article helpful?'}
      </p>
      
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="lg"
          className="gap-2 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30"
          onClick={() => handleRate(true)}
        >
          <ThumbsUp className="w-5 h-5" />
          {language === 'ar' ? 'نعم' : 'Yes'}
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="gap-2 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30"
          onClick={() => handleRate(false)}
        >
          <ThumbsDown className="w-5 h-5" />
          {language === 'ar' ? 'لا' : 'No'}
        </Button>
      </div>
    </div>
  );
};
