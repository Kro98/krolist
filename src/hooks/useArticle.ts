import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article, ArticleBlock, ArticleProduct, ArticleComment, ArticleRelation, PriceInsight } from '@/types/article';

export const useArticle = (slug: string) => {
  return useQuery({
    queryKey: ['article', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();
      
      if (error) throw error;
      return data as Article;
    },
    enabled: !!slug,
  });
};

export const useArticleBlocks = (articleId: string) => {
  return useQuery({
    queryKey: ['article-blocks', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_blocks')
        .select('*')
        .eq('article_id', articleId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as ArticleBlock[];
    },
    enabled: !!articleId,
  });
};

export const useArticleProducts = (articleId: string) => {
  return useQuery({
    queryKey: ['article-products', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_products')
        .select(`
          *,
          product:krolist_products(*)
        `)
        .eq('article_id', articleId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as ArticleProduct[];
    },
    enabled: !!articleId,
  });
};

export const useArticleComments = (articleId: string) => {
  return useQuery({
    queryKey: ['article-comments', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_comments')
        .select('*')
        .eq('article_id', articleId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Nest replies
      const comments = data as ArticleComment[];
      const topLevel = comments.filter(c => !c.parent_id);
      const replies = comments.filter(c => c.parent_id);
      
      return topLevel.map(comment => ({
        ...comment,
        replies: replies.filter(r => r.parent_id === comment.id)
      }));
    },
    enabled: !!articleId,
  });
};

export const useRelatedArticles = (articleId: string) => {
  return useQuery({
    queryKey: ['related-articles', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_relations')
        .select(`
          *,
          related_article:articles!article_relations_related_article_id_fkey(*)
        `)
        .eq('article_id', articleId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as ArticleRelation[];
    },
    enabled: !!articleId,
  });
};

export const useTrendingArticles = () => {
  return useQuery({
    queryKey: ['trending-articles'],
    queryFn: async () => {
      // Get articles with most views in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: analytics, error: analyticsError } = await supabase
        .from('article_analytics')
        .select('article_id')
        .eq('event_type', 'view')
        .gte('created_at', sevenDaysAgo.toISOString());
      
      if (analyticsError) throw analyticsError;
      
      // Count views per article
      const viewCounts: Record<string, number> = {};
      analytics?.forEach(a => {
        viewCounts[a.article_id] = (viewCounts[a.article_id] || 0) + 1;
      });
      
      // Get top 6 article IDs
      const topArticleIds = Object.entries(viewCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([id]) => id);
      
      if (topArticleIds.length === 0) {
        // Fallback to recent articles
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('is_published', true)
          .order('published_at', { ascending: false })
          .limit(6);
        
        if (error) throw error;
        return data as Article[];
      }
      
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .in('id', topArticleIds)
        .eq('is_published', true);
      
      if (error) throw error;
      return data as Article[];
    },
  });
};

export const usePriceInsight = (articleId: string) => {
  return useQuery({
    queryKey: ['price-insight', articleId],
    queryFn: async () => {
      // Get all products in this article
      const { data: products, error } = await supabase
        .from('article_products')
        .select(`
          product:krolist_products(current_price, original_price, currency)
        `)
        .eq('article_id', articleId);
      
      if (error) throw error;
      if (!products?.length) return null;
      
      const prices = products
        .map(p => (p.product as any)?.current_price)
        .filter(Boolean);
      const originalPrices = products
        .map(p => (p.product as any)?.original_price)
        .filter(Boolean);
      
      if (!prices.length) return null;
      
      const currentLowest = Math.min(...prices);
      const lowestRecorded = Math.min(...originalPrices, ...prices);
      const allPrices = [...prices, ...originalPrices];
      const avg = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
      const variance = allPrices.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / allPrices.length;
      const stdDev = Math.sqrt(variance);
      const volatilityScore = stdDev / avg;
      
      const insight: PriceInsight = {
        typical_low: Math.min(...allPrices),
        typical_high: Math.max(...allPrices),
        lowest_recorded: lowestRecorded,
        current_lowest: currentLowest,
        volatility: volatilityScore < 0.1 ? 'stable' : volatilityScore < 0.25 ? 'moderate' : 'volatile',
        currency: (products[0]?.product as any)?.currency || 'SAR'
      };
      
      return insight;
    },
    enabled: !!articleId,
  });
};

export const useSubmitComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (comment: { article_id: string; content: string; guest_name?: string; parent_id?: string }) => {
      const { data, error } = await supabase
        .from('article_comments')
        .insert(comment)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['article-comments', variables.article_id] });
    },
  });
};

export const useSubmitRating = () => {
  return useMutation({
    mutationFn: async (rating: { article_id: string; is_helpful: boolean; session_id: string }) => {
      const { data, error } = await supabase
        .from('article_ratings')
        .insert(rating)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
  });
};

export const useTrackAnalytics = () => {
  return useMutation({
    mutationFn: async (event: { article_id: string; event_type: string; session_id?: string; event_data?: Record<string, unknown> }) => {
      const { error } = await supabase
        .from('article_analytics')
        .insert([{
          article_id: event.article_id,
          event_type: event.event_type,
          session_id: event.session_id,
          event_data: event.event_data as any,
        }]);
      
      if (error) throw error;
    },
  });
};
