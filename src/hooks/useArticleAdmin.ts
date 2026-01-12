import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Article, ArticleBlock, ArticleProduct } from '@/types/article';

export const useAdminArticles = () => {
  return useQuery({
    queryKey: ['admin-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Article[];
    },
  });
};

export const useAdminArticle = (id: string) => {
  return useQuery({
    queryKey: ['admin-article', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Article;
    },
    enabled: !!id && id !== 'new',
  });
};

export const useAdminArticleBlocks = (articleId: string) => {
  return useQuery({
    queryKey: ['admin-article-blocks', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_blocks')
        .select('*')
        .eq('article_id', articleId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as ArticleBlock[];
    },
    enabled: !!articleId && articleId !== 'new',
  });
};

export const useAdminArticleProducts = (articleId: string) => {
  return useQuery({
    queryKey: ['admin-article-products', articleId],
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
    enabled: !!articleId && articleId !== 'new',
  });
};

export const useKrolistProducts = () => {
  return useQuery({
    queryKey: ['krolist-products-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('krolist_products')
        .select('*')
        .order('title', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useSaveArticle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (article: Partial<Article> & { id?: string }) => {
      if (article.id && article.id !== 'new') {
        const { data, error } = await supabase
          .from('articles')
          .update(article)
          .eq('id', article.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { id, ...insertData } = article;
        const { data, error } = await supabase
          .from('articles')
          .insert(insertData as any)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
    },
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
    },
  });
};

export const useSaveBlocks = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ articleId, blocks }: { articleId: string; blocks: Partial<ArticleBlock>[] }) => {
      // Delete existing blocks
      await supabase
        .from('article_blocks')
        .delete()
        .eq('article_id', articleId);
      
      // Insert new blocks
      if (blocks.length > 0) {
        const blocksToInsert = blocks.map((block, index) => ({
          article_id: articleId,
          block_type: block.block_type,
          content: block.content,
          display_order: index,
        }));
        
        const { error } = await supabase
          .from('article_blocks')
          .insert(blocksToInsert as any);
        
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-article-blocks', variables.articleId] });
    },
  });
};

export const useSaveArticleProducts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ articleId, productIds }: { articleId: string; productIds: string[] }) => {
      // Delete existing
      await supabase
        .from('article_products')
        .delete()
        .eq('article_id', articleId);
      
      // Insert new
      if (productIds.length > 0) {
        const toInsert = productIds.map((productId, index) => ({
          article_id: articleId,
          product_id: productId,
          display_order: index,
        }));
        
        const { error } = await supabase
          .from('article_products')
          .insert(toInsert);
        
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-article-products', variables.articleId] });
    },
  });
};

export const useRelatedArticlesAdmin = (articleId: string) => {
  return useQuery({
    queryKey: ['admin-related-articles', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('article_relations')
        .select(`
          *,
          related_article:articles!article_relations_related_article_id_fkey(id, title_en, slug)
        `)
        .eq('article_id', articleId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!articleId && articleId !== 'new',
  });
};

export const useSaveRelatedArticles = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ articleId, relatedIds }: { articleId: string; relatedIds: string[] }) => {
      await supabase
        .from('article_relations')
        .delete()
        .eq('article_id', articleId);
      
      if (relatedIds.length > 0) {
        const toInsert = relatedIds.map((relatedId, index) => ({
          article_id: articleId,
          related_article_id: relatedId,
          display_order: index,
        }));
        
        const { error } = await supabase
          .from('article_relations')
          .insert(toInsert);
        
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-related-articles', variables.articleId] });
    },
  });
};
