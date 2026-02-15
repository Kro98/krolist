import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, Clock, Search, Eye, Calendar, ArrowRight, 
  Sparkles, Star, BookOpen, ChevronRight, Filter, X
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Article } from '@/types/article';
import { SiteBackground } from '@/components/SiteBackground';

// Preference learning - stored locally
const PREF_KEY = 'article_preferences';
const VIEW_HISTORY_KEY = 'article_view_history';

interface ArticlePreferences {
  viewedCategories: Record<string, number>;
  viewedTags: Record<string, number>;
  totalViews: number;
  lastUpdated: string;
}

const getPreferences = (): ArticlePreferences => {
  try {
    const saved = localStorage.getItem(PREF_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { viewedCategories: {}, viewedTags: {}, totalViews: 0, lastUpdated: new Date().toISOString() };
};

const updatePreferences = (article: Article) => {
  const prefs = getPreferences();
  
  if (article.category) {
    prefs.viewedCategories[article.category] = (prefs.viewedCategories[article.category] || 0) + 1;
  }
  
  article.tags?.forEach(tag => {
    prefs.viewedTags[tag] = (prefs.viewedTags[tag] || 0) + 1;
  });
  
  prefs.totalViews += 1;
  prefs.lastUpdated = new Date().toISOString();
  
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  
  // Also store view history
  const history = JSON.parse(localStorage.getItem(VIEW_HISTORY_KEY) || '[]');
  history.unshift({ id: article.id, timestamp: Date.now() });
  localStorage.setItem(VIEW_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
};

const Articles = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isArabic = language === 'ar';
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [pageBgEnabled, setPageBgEnabled] = useState(false);

  useEffect(() => {
    fetchArticles();
    supabase.from('page_content').select('content_en').eq('page_key', 'bg_enabled_articles').maybeSingle()
      .then(({ data }) => { if (data?.content_en === 'true') setPageBgEnabled(true); });
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique categories and tags
  const { categories, tags } = useMemo(() => {
    const cats = new Set<string>();
    const tagsSet = new Set<string>();
    
    articles.forEach(article => {
      if (article.category) cats.add(article.category);
      article.tags?.forEach(tag => tagsSet.add(tag));
    });
    
    return { 
      categories: Array.from(cats), 
      tags: Array.from(tagsSet) 
    };
  }, [articles]);

  // Preference-based scoring
  const scoreArticle = useCallback((article: Article): number => {
    const prefs = getPreferences();
    let score = 0;
    
    // Category preference
    if (article.category && prefs.viewedCategories[article.category]) {
      score += prefs.viewedCategories[article.category] * 10;
    }
    
    // Tag preferences
    article.tags?.forEach(tag => {
      if (prefs.viewedTags[tag]) {
        score += prefs.viewedTags[tag] * 5;
      }
    });
    
    // Recency boost
    if (article.published_at) {
      const daysOld = (Date.now() - new Date(article.published_at).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 30 - daysOld);
    }
    
    // View count boost (trending)
    score += (article.view_count || 0) * 0.1;
    
    return score;
  }, []);

  // Filter and sort articles
  const { trendingArticles, latestArticles, forYouArticles, filteredArticles } = useMemo(() => {
    let filtered = [...articles];
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article => 
        article.title_en.toLowerCase().includes(query) ||
        article.title_ar?.toLowerCase().includes(query) ||
        article.summary_en?.toLowerCase().includes(query) ||
        article.summary_ar?.toLowerCase().includes(query) ||
        article.category?.toLowerCase().includes(query) ||
        article.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }
    
    // Apply tag filter
    if (selectedTag) {
      filtered = filtered.filter(article => article.tags?.includes(selectedTag));
    }
    
    // Trending: by view count
    const trending = [...articles]
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 6);
    
    // Latest: by published date
    const latest = [...articles]
      .sort((a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime())
      .slice(0, 8);
    
    // For You: preference-based
    const prefs = getPreferences();
    const forYou = prefs.totalViews > 0 
      ? [...articles].sort((a, b) => scoreArticle(b) - scoreArticle(a)).slice(0, 6)
      : [];
    
    return {
      trendingArticles: trending,
      latestArticles: latest,
      forYouArticles: forYou,
      filteredArticles: filtered,
    };
  }, [articles, searchQuery, selectedCategory, selectedTag, scoreArticle]);

  const handleArticleClick = async (article: Article) => {
    updatePreferences(article);
    
    // Increment view count in database (no rate limiting)
    supabase
      .from('articles')
      .update({ view_count: (article.view_count ?? 0) + 1 })
      .eq('id', article.id)
      .then(() => {});
    
    navigate(`/articles/${article.slug}`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedTag(null);
  };

  const hasFilters = searchQuery || selectedCategory || selectedTag;

  // Article Card Component
  const ArticleCard = ({ article, variant = 'default' }: { article: Article; variant?: 'default' | 'featured' | 'compact' }) => {
    const title = isArabic && article.title_ar ? article.title_ar : article.title_en;
    const summary = isArabic && article.summary_ar ? article.summary_ar : article.summary_en;
    
    if (variant === 'featured') {
      return (
        <Card 
          className="group cursor-pointer overflow-hidden border-0 bg-gradient-to-br from-primary/5 via-background to-primary/10 hover:shadow-xl transition-all duration-500 hover:scale-[1.02]"
          onClick={() => handleArticleClick(article)}
        >
          <div className="relative h-48 md:h-64 overflow-hidden">
            {article.hero_bg_image_url || article.og_image_url ? (
              <img 
                src={article.hero_bg_image_url || article.og_image_url} 
                alt={title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div 
                className="w-full h-full"
                style={{ backgroundColor: article.hero_bg_color || 'hsl(var(--primary))' }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            
            {/* Trending badge */}
            <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4">
              <Badge className="bg-primary/90 backdrop-blur-sm text-primary-foreground gap-1">
                <TrendingUp className="w-3 h-3" />
                {isArabic ? 'رائج' : 'Trending'}
              </Badge>
            </div>
          </div>
          
          <CardContent className="p-6 space-y-3">
            {article.category && (
              <Badge variant="outline" className="text-xs">
                {article.category}
              </Badge>
            )}
            
            <h3 className="text-xl md:text-2xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
            
            {summary && (
              <p className="text-muted-foreground line-clamp-2 text-sm">
                {summary}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
              {article.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDistanceToNow(new Date(article.published_at), { 
                    addSuffix: true,
                    locale: isArabic ? ar : undefined 
                  })}
                </span>
              )}
              {article.view_count !== undefined && article.view_count > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {article.view_count.toLocaleString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (variant === 'compact') {
      return (
        <div 
          className="group flex gap-4 p-4 rounded-xl bg-card/50 hover:bg-card border border-transparent hover:border-border cursor-pointer transition-all duration-300"
          onClick={() => handleArticleClick(article)}
        >
          {(article.hero_bg_image_url || article.og_image_url) && (
            <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
              <img 
                src={article.hero_bg_image_url || article.og_image_url} 
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-1">
            <h4 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors text-sm">
              {title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {article.published_at && (
                <span>
                  {formatDistanceToNow(new Date(article.published_at), { 
                    addSuffix: true,
                    locale: isArabic ? ar : undefined 
                  })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {(article.view_count ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      );
    }
    
    // Default variant
    return (
      <Card 
        className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50"
        onClick={() => handleArticleClick(article)}
      >
        <div className="relative h-40 overflow-hidden">
          {article.hero_bg_image_url || article.og_image_url ? (
            <img 
              src={article.hero_bg_image_url || article.og_image_url} 
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: article.hero_bg_color || 'hsl(var(--muted))' }}
            >
              <BookOpen className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
        
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {article.category && (
              <Badge variant="secondary" className="text-xs">
                {article.category}
              </Badge>
            )}
            {article.tags?.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          
          {summary && (
            <p className="text-muted-foreground text-sm line-clamp-2">
              {summary}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <div className="flex items-center gap-3">
              {article.published_at && (
                <span>
                  {format(new Date(article.published_at), 'MMM d, yyyy')}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {(article.view_count ?? 0).toLocaleString()}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardContent>
      </Card>
    );
  };

  // Loading skeleton
  const ArticleSkeleton = ({ variant = 'default' }: { variant?: 'default' | 'featured' | 'compact' }) => {
    if (variant === 'featured') {
      return (
        <Card className="overflow-hidden">
          <Skeleton className="h-48 md:h-64 w-full" />
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      );
    }
    
    if (variant === 'compact') {
      return (
        <div className="flex gap-4 p-4">
          <Skeleton className="w-20 h-20 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      );
    }
    
    return (
      <Card className="overflow-hidden">
        <Skeleton className="h-40 w-full" />
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Helmet>
        <title>{isArabic ? 'المقالات | كروليست' : 'Articles | Krolist'}</title>
        <meta 
          name="description" 
          content={isArabic 
            ? 'اكتشف أحدث المقالات والمراجعات حول المنتجات والتسوق الذكي'
            : 'Discover the latest articles and reviews about products and smart shopping'
          } 
        />
      </Helmet>

      <div className="min-h-screen bg-background relative">
        {pageBgEnabled && <SiteBackground />}
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12 md:py-20">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="container max-w-6xl mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <Badge variant="outline" className="gap-2 px-4 py-1.5">
                <Sparkles className="w-4 h-4 text-primary" />
                {isArabic ? 'مدونة كروليست' : 'Krolist Blog'}
              </Badge>
              
              <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                {isArabic ? 'اكتشف أفضل الصفقات والمراجعات' : 'Discover Best Deals & Reviews'}
              </h1>
              
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {isArabic 
                  ? 'مقالات ومراجعات شاملة لمساعدتك على اتخاذ قرارات شراء أفضل'
                  : 'Comprehensive articles and reviews to help you make better purchasing decisions'
                }
              </p>
              
              {/* Search Bar */}
              <div className="max-w-xl mx-auto pt-4">
                <div className="relative">
                  <Search className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isArabic ? 'ابحث في المقالات...' : 'Search articles...'}
                    className="pl-12 rtl:pl-4 rtl:pr-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 rtl:right-auto rtl:left-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Category & Tag Filters */}
        {(categories.length > 0 || tags.length > 0) && !hasFilters && (
          <section className="border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="container max-w-6xl mx-auto px-4 py-3">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full shrink-0"
                    onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                  >
                    {category}
                  </Button>
                ))}
                {tags.slice(0, 5).map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTag === tag ? 'default' : 'secondary'}
                    className="cursor-pointer shrink-0"
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Active Filters Bar */}
        {hasFilters && (
          <section className="border-b border-border/50 bg-muted/30">
            <div className="container max-w-6xl mx-auto px-4 py-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">
                  {isArabic ? 'نتائج البحث:' : 'Filtering by:'}
                </span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    "{searchQuery}"
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                  </Badge>
                )}
                {selectedCategory && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedCategory}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory(null)} />
                  </Badge>
                )}
                {selectedTag && (
                  <Badge variant="secondary" className="gap-1">
                    #{selectedTag}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedTag(null)} />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  {isArabic ? 'مسح الكل' : 'Clear all'}
                </Button>
              </div>
            </div>
          </section>
        )}

        <div className="container max-w-6xl mx-auto px-4 py-8 space-y-12">
          {loading ? (
            <>
              {/* Loading State */}
              <section>
                <div className="grid md:grid-cols-2 gap-6">
                  <ArticleSkeleton variant="featured" />
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <ArticleSkeleton key={i} variant="compact" />
                    ))}
                  </div>
                </div>
              </section>
              <section>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <ArticleSkeleton key={i} />
                  ))}
                </div>
              </section>
            </>
          ) : hasFilters ? (
            /* Filtered Results */
            <section>
              <h2 className="text-xl font-semibold mb-6">
                {filteredArticles.length} {isArabic ? 'نتيجة' : 'results'}
              </h2>
              {filteredArticles.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArticles.map(article => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {isArabic ? 'لا توجد نتائج' : 'No articles found'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {isArabic 
                      ? 'جرب تعديل معايير البحث'
                      : 'Try adjusting your search criteria'
                    }
                  </p>
                  <Button onClick={clearFilters}>
                    {isArabic ? 'مسح الفلاتر' : 'Clear filters'}
                  </Button>
                </div>
              )}
            </section>
          ) : (
            <>
              {/* For You Section - Only if user has preferences */}
              {forYouArticles.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                      <Star className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">
                        {isArabic ? 'مقترح لك' : 'Recommended For You'}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? 'بناءً على اهتماماتك' : 'Based on your interests'}
                      </p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {forYouArticles.map(article => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                </section>
              )}

              {/* Trending Section */}
              {trendingArticles.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10">
                      <TrendingUp className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">
                        {isArabic ? 'الأكثر رواجاً' : 'Trending Now'}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? 'المقالات الأكثر قراءة' : 'Most read articles'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Featured trending article */}
                    {trendingArticles[0] && (
                      <ArticleCard article={trendingArticles[0]} variant="featured" />
                    )}
                    
                    {/* Compact list */}
                    <div className="space-y-2 bg-muted/30 rounded-2xl p-2">
                      {trendingArticles.slice(1, 5).map((article, index) => (
                        <div key={article.id} className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-muted-foreground/30 w-8">
                            {index + 2}
                          </span>
                          <div className="flex-1">
                            <ArticleCard article={article} variant="compact" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Latest Section */}
              {latestArticles.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10">
                      <Clock className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">
                        {isArabic ? 'أحدث المقالات' : 'Latest Articles'}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {isArabic ? 'آخر ما نشرناه' : 'Fresh from our blog'}
                      </p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {latestArticles.map(article => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                </section>
              )}

              {/* All Articles */}
              {articles.length > 8 && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">
                      {isArabic ? 'جميع المقالات' : 'All Articles'}
                    </h2>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {articles.slice(8).map(article => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                </section>
              )}

              {/* Empty State */}
              {articles.length === 0 && (
                <div className="text-center py-20">
                  <BookOpen className="w-20 h-20 mx-auto text-muted-foreground/20 mb-6" />
                  <h2 className="text-2xl font-semibold mb-2">
                    {isArabic ? 'لا توجد مقالات بعد' : 'No Articles Yet'}
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {isArabic 
                      ? 'نعمل على إضافة محتوى جديد قريباً. تابعنا!'
                      : 'We\'re working on adding new content soon. Stay tuned!'
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Articles;
