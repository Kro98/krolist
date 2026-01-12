import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Trash2, Eye, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ArticleMetaForm } from '@/components/admin/article/ArticleMetaForm';
import { BlockEditor } from '@/components/admin/article/BlockEditor';
import { SEOChecklist } from '@/components/admin/article/SEOChecklist';
import { ProductSelector } from '@/components/admin/article/ProductSelector';
import { RelatedArticlesSelector } from '@/components/admin/article/RelatedArticlesSelector';
import { ArticleLivePreview } from '@/components/admin/article/ArticleLivePreview';
import { 
  useAdminArticle, 
  useAdminArticleBlocks, 
  useAdminArticleProducts,
  useSaveArticle,
  useSaveBlocks,
  useSaveArticleProducts,
  useDeleteArticle,
  useRelatedArticlesAdmin,
  useSaveRelatedArticles,
  useKrolistProducts,
} from '@/hooks/useArticleAdmin';
import { Article, ArticleBlock } from '@/types/article';
import { useAdminRole } from '@/hooks/useAdminRole';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ArticleEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const isNew = id === 'new';
  
  const { data: existingArticle, isLoading: articleLoading } = useAdminArticle(id || '');
  const { data: existingBlocks = [] } = useAdminArticleBlocks(existingArticle?.id || '');
  const { data: existingProducts = [] } = useAdminArticleProducts(existingArticle?.id || '');
  const { data: existingRelated = [] } = useRelatedArticlesAdmin(existingArticle?.id || '');
  const { data: allProducts = [] } = useKrolistProducts();
  
  const saveArticle = useSaveArticle();
  const saveBlocks = useSaveBlocks();
  const saveProducts = useSaveArticleProducts();
  const saveRelated = useSaveRelatedArticles();
  const deleteArticle = useDeleteArticle();
  
  const [article, setArticle] = useState<Partial<Article>>({});
  const [blocks, setBlocks] = useState<Partial<ArticleBlock>[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [relatedArticleIds, setRelatedArticleIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Load existing data
  useEffect(() => {
    if (existingArticle) {
      setArticle(existingArticle);
    }
  }, [existingArticle]);
  
  useEffect(() => {
    if (existingBlocks.length > 0) {
      setBlocks(existingBlocks);
    }
  }, [existingBlocks]);
  
  useEffect(() => {
    if (existingProducts.length > 0) {
      setSelectedProductIds(existingProducts.map(p => p.product_id));
    }
  }, [existingProducts]);
  
  useEffect(() => {
    if (existingRelated.length > 0) {
      setRelatedArticleIds(existingRelated.map(r => r.related_article_id));
    }
  }, [existingRelated]);
  
  const handleSave = async () => {
    if (!article.title_en || !article.slug) {
      toast.error('Title and slug are required');
      return;
    }
    
    setIsSaving(true);
    try {
      // Save article
      const savedArticle = await saveArticle.mutateAsync({
        ...article,
        id: isNew ? undefined : id,
      });
      
      const articleId = savedArticle.id;
      
      // Save blocks
      await saveBlocks.mutateAsync({ articleId, blocks });
      
      // Save products
      await saveProducts.mutateAsync({ articleId, productIds: selectedProductIds });
      
      // Save related
      await saveRelated.mutateAsync({ articleId, relatedIds: relatedArticleIds });
      
      toast.success(isNew ? 'Article created!' : 'Article saved!');
      
      if (isNew) {
        navigate(`/admin/articles/${articleId}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save article');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!id || isNew) return;
    
    try {
      await deleteArticle.mutateAsync(id);
      toast.success('Article deleted');
      navigate('/admin/articles');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete article');
    }
  };
  
  const handleDuplicate = async () => {
    const duplicatedArticle = {
      ...article,
      id: undefined,
      title_en: `${article.title_en} (Copy)`,
      slug: `${article.slug}-copy`,
      is_published: false,
    };
    
    setArticle(duplicatedArticle);
    toast.info('Article duplicated - save to create new copy');
    navigate('/admin/articles/new');
  };
  
  // Get product details for preview
  const selectedProductDetails = selectedProductIds
    .map(id => allProducts.find(p => p.id === id))
    .filter(Boolean) as any[];
  
  if (adminLoading || (!isNew && articleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Admin access required</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/articles')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                {isNew ? 'New Article' : 'Edit Article'}
              </h1>
              {article.slug && (
                <p className="text-xs text-muted-foreground">/articles/{article.slug}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isNew && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/articles/${article.slug}`, '_blank')}
                  disabled={!article.is_published}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm" onClick={handleDuplicate}>
                  <Copy className="w-4 h-4 mr-1" />
                  Duplicate
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Article?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the article and all its content.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main editor */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-6 mt-6">
                <ArticleMetaForm 
                  article={article} 
                  onChange={(updates) => setArticle(prev => ({ ...prev, ...updates }))} 
                />
                <BlockEditor 
                  blocks={blocks} 
                  onChange={setBlocks}
                  availableProductIds={selectedProductIds}
                />
              </TabsContent>
              
              <TabsContent value="products" className="space-y-6 mt-6">
                <ProductSelector
                  selectedProductIds={selectedProductIds}
                  onChange={setSelectedProductIds}
                />
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-6 mt-6">
                <RelatedArticlesSelector
                  currentArticleId={id}
                  selectedArticleIds={relatedArticleIds}
                  onChange={setRelatedArticleIds}
                />
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <SEOChecklist 
              article={article} 
              blocks={blocks} 
              productCount={selectedProductIds.length} 
            />
            <ArticleLivePreview 
              article={article} 
              blocks={blocks}
              products={selectedProductDetails}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;
