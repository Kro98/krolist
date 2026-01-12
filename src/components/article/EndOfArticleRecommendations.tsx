import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Article, KrolistProduct } from '@/types/article';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { formatPrice } from '@/lib/currencyConversion';

interface EndOfArticleRecommendationsProps {
  articles?: Article[];
  products?: KrolistProduct[];
}

export const EndOfArticleRecommendations = ({ articles = [], products = [] }: EndOfArticleRecommendationsProps) => {
  const { language } = useLanguage();
  
  if (!articles.length && !products.length) return null;
  
  return (
    <section className="py-8 border-t border-border/50">
      <div className="text-center mb-6">
        <p className="text-lg font-medium text-foreground mb-1">
          {language === 'ar' ? 'قبل أن تشتري، عادةً يقارن الناس هذه' : 'Before you buy, people usually compare these'}
        </p>
        <p className="text-sm text-muted-foreground">
          {language === 'ar' ? 'اختيارات ذكية بناءً على سلوك المستخدمين' : 'Smart picks based on user behavior'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Product recommendations */}
        {products.slice(0, 2).map(product => (
          <Card key={product.id} className="group hover:border-primary/30 transition-all">
            <CardContent className="p-4">
              {product.image_url && (
                <div className="aspect-square mb-3 bg-muted/50 rounded-lg overflow-hidden">
                  <img 
                    src={product.image_url} 
                    alt={product.title}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                </div>
              )}
              <p className="text-sm font-medium text-foreground line-clamp-2 mb-2">
                {product.title}
              </p>
              <p className="text-primary font-bold">
                {formatPrice(product.current_price, product.currency as any)}
              </p>
              <Button 
                size="sm" 
                className="w-full mt-3"
                onClick={() => window.open(product.product_url, '_blank')}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'عرض المنتج' : 'View Product'}
              </Button>
            </CardContent>
          </Card>
        ))}
        
        {/* Article recommendations */}
        {articles.slice(0, 2).map(article => (
          <Link key={article.id} to={`/articles/${article.slug}`}>
            <Card className="group h-full hover:border-primary/30 transition-all">
              <CardContent className="p-4 h-full flex flex-col">
                {article.og_image_url && (
                  <div className="aspect-video mb-3 bg-muted/50 rounded-lg overflow-hidden">
                    <img 
                      src={article.og_image_url} 
                      alt={article.title_en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                )}
                <p className="text-sm font-medium text-foreground line-clamp-2 mb-2 flex-1">
                  {language === 'ar' && article.title_ar ? article.title_ar : article.title_en}
                </p>
                <div className="flex items-center text-sm text-primary font-medium">
                  {language === 'ar' ? 'اقرأ المزيد' : 'Read article'}
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
