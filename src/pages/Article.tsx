import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ArticleHero } from '@/components/article/ArticleHero';
import { QuickInsightBar } from '@/components/article/QuickInsightBar';
import { ArticleContentBlocks } from '@/components/article/ArticleContentBlocks';
import { ArticleRating } from '@/components/article/ArticleRating';
import { ArticleComments } from '@/components/article/ArticleComments';
import { RelatedArticles } from '@/components/article/RelatedArticles';
import { TrendingNowSidebar } from '@/components/article/TrendingNowSidebar';
import { PeopleAlsoChecked } from '@/components/article/PeopleAlsoChecked';
import { EndOfArticleRecommendations } from '@/components/article/EndOfArticleRecommendations';
import { ArticleSEO } from '@/components/article/ArticleSEO';
import { 
  useArticle, 
  useArticleBlocks, 
  useArticleProducts, 
  useRelatedArticles,
  usePriceInsight,
  useTrackAnalytics,
  useTrendingArticles,
} from '@/hooks/useArticle';
import { useLanguage } from '@/contexts/LanguageContext';

const Article = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const contentRef = useRef<HTMLDivElement>(null);
  const [showStickyInsight, setShowStickyInsight] = useState(false);
  
  const { data: article, isLoading: articleLoading, error } = useArticle(slug || '');
  const { data: blocks = [] } = useArticleBlocks(article?.id || '');
  const { data: products = [] } = useArticleProducts(article?.id || '');
  const { data: relatedData = [] } = useRelatedArticles(article?.id || '');
  const { data: priceInsight } = usePriceInsight(article?.id || '');
  const { data: trending = [] } = useTrendingArticles();
  const trackAnalytics = useTrackAnalytics();
  
  const relatedArticles = relatedData.map(r => r.related_article).filter(Boolean);
  
  // Session ID for analytics
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('article_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('article_session_id', sessionId);
    }
    return sessionId;
  };
  
  // Track page view
  useEffect(() => {
    if (article?.id) {
      trackAnalytics.mutate({
        article_id: article.id,
        event_type: 'view',
        session_id: getSessionId(),
      });
    }
  }, [article?.id]);
  
  // Track scroll depth
  useEffect(() => {
    if (!article?.id) return;
    
    const trackedDepths = new Set<number>();
    
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (window.scrollY / scrollHeight) * 100;
      
      [25, 50, 75, 100].forEach(depth => {
        if (scrollPercent >= depth && !trackedDepths.has(depth)) {
          trackedDepths.add(depth);
          trackAnalytics.mutate({
            article_id: article.id,
            event_type: `scroll_${depth}` as any,
            session_id: getSessionId(),
          });
        }
      });
      
      // Sticky insight bar
      setShowStickyInsight(window.scrollY > 400);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [article?.id]);
  
  // Track product clicks
  const handleProductClick = (productId: string) => {
    if (article?.id) {
      trackAnalytics.mutate({
        article_id: article.id,
        event_type: 'product_click',
        session_id: getSessionId(),
        event_data: { product_id: productId },
      });
    }
  };
  
  if (error) {
    navigate('/404');
    return null;
  }
  
  if (articleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[40vh] bg-muted animate-pulse" />
        <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  if (!article) {
    navigate('/404');
    return null;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <ArticleSEO article={article} blocks={blocks} />
      
      {/* Hero */}
      <ArticleHero article={article} />
      
      {/* Quick Insight Bar */}
      {priceInsight && (
        <>
          <QuickInsightBar insight={priceInsight} />
          {showStickyInsight && (
            <div className="fixed top-0 left-0 right-0 z-50 animate-fade-in">
              <QuickInsightBar insight={priceInsight} isSticky />
            </div>
          )}
        </>
      )}
      
      {/* Main content with sidebar */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Article content */}
          <article className="flex-1 max-w-4xl" ref={contentRef}>
            <ArticleContentBlocks 
              blocks={blocks} 
              products={products}
              onProductClick={handleProductClick}
              onViewHistory={(productId) => {
                // Could open a modal with price history chart
                console.log('View history for', productId);
              }}
            />
            
            {/* People also checked (mobile inline) */}
            <div className="lg:hidden mt-8">
              <PeopleAlsoChecked articleId={article.id} category={article.category} />
            </div>
            
            {/* Rating */}
            <ArticleRating articleId={article.id} />
            
            {/* End of article recommendations */}
            <EndOfArticleRecommendations 
              articles={trending.filter(a => a.id !== article.id).slice(0, 2)}
              products={products.map(p => p.product).filter(Boolean).slice(0, 2) as any}
            />
            
            {/* Comments */}
            <ArticleComments articleId={article.id} />
            
            {/* Related articles */}
            {relatedArticles.length > 0 && (
              <RelatedArticles articles={relatedArticles as any} />
            )}
            
            {/* Trending articles */}
            {trending.length > 0 && (
              <RelatedArticles 
                articles={trending.filter(a => a.id !== article.id).slice(0, 6)} 
                title={language === 'ar' ? 'الأكثر رواجاً هذا الأسبوع' : 'Trending This Week'}
                showTrendingBadge
              />
            )}
          </article>
          
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="space-y-6">
              <TrendingNowSidebar currentArticleId={article.id} />
              <PeopleAlsoChecked articleId={article.id} category={article.category} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Article;
