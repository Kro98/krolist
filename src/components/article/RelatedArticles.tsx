import { ArrowRight, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Article } from '@/types/article';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

interface RelatedArticlesProps {
  articles: Article[];
  title?: string;
  showTrendingBadge?: boolean;
}

export const RelatedArticles = ({ articles, title, showTrendingBadge = false }: RelatedArticlesProps) => {
  const { language } = useLanguage();
  
  if (!articles.length) return null;
  
  return (
    <section className="py-8">
      <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
        {showTrendingBadge && <TrendingUp className="w-5 h-5 text-primary" />}
        {title || (language === 'ar' ? 'مقالات ذات صلة' : 'Related Articles')}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article) => (
          <Link key={article.id} to={`/articles/${article.slug}`}>
            <Card className="group h-full hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-4">
                {article.category && (
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {article.category}
                  </Badge>
                )}
                
                <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                  {language === 'ar' && article.title_ar ? article.title_ar : article.title_en}
                </h3>
                
                {article.summary_en && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {language === 'ar' && article.summary_ar ? article.summary_ar : article.summary_en}
                  </p>
                )}
                
                <div className="flex items-center text-sm text-primary font-medium">
                  {language === 'ar' ? 'اقرأ المزيد' : 'Read more'}
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};
