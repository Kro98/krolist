import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Article } from '@/types/article';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PeopleAlsoCheckedProps {
  articleId: string;
  category?: string;
}

export const PeopleAlsoChecked = ({ articleId, category }: PeopleAlsoCheckedProps) => {
  const { language } = useLanguage();
  
  // Get articles that users who viewed this article also viewed
  const { data: articles } = useQuery({
    queryKey: ['people-also-checked', articleId, category],
    queryFn: async () => {
      // Get session IDs that viewed current article
      const { data: sessions } = await supabase
        .from('article_analytics')
        .select('session_id')
        .eq('article_id', articleId)
        .eq('event_type', 'view')
        .not('session_id', 'is', null)
        .limit(100);
      
      if (!sessions?.length) {
        // Fallback to category-based recommendations
        if (category) {
          const { data } = await supabase
            .from('articles')
            .select('*')
            .eq('category', category)
            .eq('is_published', true)
            .neq('id', articleId)
            .limit(4);
          return data as Article[];
        }
        return [];
      }
      
      const sessionIds = sessions.map(s => s.session_id).filter(Boolean);
      
      // Get other articles these sessions viewed
      const { data: otherViews } = await supabase
        .from('article_analytics')
        .select('article_id')
        .in('session_id', sessionIds)
        .eq('event_type', 'view')
        .neq('article_id', articleId);
      
      if (!otherViews?.length) return [];
      
      // Count occurrences
      const counts: Record<string, number> = {};
      otherViews.forEach(v => {
        counts[v.article_id] = (counts[v.article_id] || 0) + 1;
      });
      
      // Get top 4 articles
      const topIds = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([id]) => id);
      
      if (!topIds.length) return [];
      
      const { data } = await supabase
        .from('articles')
        .select('*')
        .in('id', topIds)
        .eq('is_published', true);
      
      return data as Article[];
    },
    enabled: !!articleId,
  });
  
  if (!articles?.length) return null;
  
  return (
    <section className="py-6 px-4 bg-muted/30 rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">
          {language === 'ar' ? 'شاهد الآخرون أيضاً' : 'People Also Checked'}
        </h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {articles.map(article => (
          <Link key={article.id} to={`/articles/${article.slug}`}>
            <Card className="group h-full hover:border-primary/30 transition-all">
              <CardContent className="p-3">
                <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {language === 'ar' && article.title_ar ? article.title_ar : article.title_en}
                </p>
                {article.category && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    {article.category}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};
