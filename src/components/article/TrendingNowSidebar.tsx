import { TrendingUp, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Article } from '@/types/article';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { useTrendingArticles } from '@/hooks/useArticle';

interface TrendingNowSidebarProps {
  currentArticleId?: string;
}

export const TrendingNowSidebar = ({ currentArticleId }: TrendingNowSidebarProps) => {
  const { language } = useLanguage();
  const { data: trending, isLoading } = useTrendingArticles();
  
  const filteredTrending = trending?.filter(a => a.id !== currentArticleId).slice(0, 5);
  
  if (isLoading || !filteredTrending?.length) return null;
  
  return (
    <div className="sticky top-24 bg-card border border-border/50 rounded-xl p-4 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-orange-500/10">
          <Flame className="w-4 h-4 text-orange-500" />
        </div>
        <h3 className="font-semibold text-foreground">
          {language === 'ar' ? 'الأكثر رواجاً' : 'Trending Now'}
        </h3>
      </div>
      
      <div className="space-y-3">
        {filteredTrending.map((article, index) => (
          <Link 
            key={article.id} 
            to={`/articles/${article.slug}`}
            className="block group"
          >
            <div className="flex gap-3">
              <span className="text-2xl font-bold text-muted-foreground/30 group-hover:text-primary/50 transition-colors">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {language === 'ar' && article.title_ar ? article.title_ar : article.title_en}
                </p>
                {article.category && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {article.category}
                  </Badge>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
