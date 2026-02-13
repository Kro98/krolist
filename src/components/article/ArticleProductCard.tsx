import { useState } from 'react';
import { ExternalLink, TrendingDown, TrendingUp, History, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { KrolistProduct } from '@/types/article';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/lib/currencyConversion';
import { PriceHistoryChart } from './PriceHistoryChart';
import { cn } from '@/lib/utils';

interface ArticleProductCardProps {
  product: KrolistProduct;
  onProductClick?: (productId: string) => void;
  onViewHistory?: (productId: string) => void;
  showInlineChart?: boolean;
}

export const ArticleProductCard = ({ 
  product, 
  onProductClick, 
  onViewHistory,
  showInlineChart = false 
}: ArticleProductCardProps) => {
  const { language } = useLanguage();
  const [imageError, setImageError] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [chartExpanded, setChartExpanded] = useState(false);
  
  const priceChange = product.original_price - product.current_price;
  const priceChangePercent = product.original_price > 0 
    ? ((priceChange / product.original_price) * 100).toFixed(0) 
    : '0';
  
  const isPriceDrop = priceChange > 0;
  const isPriceIncrease = priceChange < 0;
  
  const handleCardClick = () => {
    onProductClick?.(product.id);
  };

  const handleViewHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showInlineChart) {
      setChartExpanded(!chartExpanded);
    } else {
      setShowChart(true);
    }
    onViewHistory?.(product.id);
  };
  
  return (
    <>
      <Card 
        className={cn(
          "group overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 cursor-pointer",
          chartExpanded && "border-primary/30"
        )}
        onClick={handleCardClick}
      >
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Product Image */}
            <div className="relative w-full sm:w-40 h-40 sm:h-auto flex-shrink-0 bg-muted/50 overflow-hidden">
              {product.image_url && !imageError ? (
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <span className="text-4xl">📦</span>
                </div>
              )}
              
              {/* Price change badge */}
              {isPriceDrop && (
                <Badge className="absolute top-2 left-2 bg-emerald-500 text-white border-0">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  {priceChangePercent}%
                </Badge>
              )}
              {isPriceIncrease && (
                <Badge className="absolute top-2 left-2 bg-red-500 text-white border-0">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {Math.abs(Number(priceChangePercent))}%
                </Badge>
              )}
            </div>
            
            {/* Product Info */}
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                {/* Store badge */}
                <Badge variant="outline" className="mb-2 text-xs">
                  {product.store}
                </Badge>
                
                {/* Title */}
                <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                  {product.title}
                </h3>
                
                {/* Prices */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(product.current_price, product.currency as any)}
                  </span>
                  {product.original_price !== product.current_price && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.original_price, product.currency as any)}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleViewHistory}
                >
                  <History className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'سجل الأسعار' : 'Price History'}
                  {showInlineChart && (
                    chartExpanded ? 
                      <ChevronUp className="w-4 h-4 ml-1" /> : 
                      <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </Button>
                
                <Button
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(product.product_url, '_blank');
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'عرض المنتج' : 'View Product'}
                </Button>
              </div>
            </div>
          </div>

          {/* Inline Chart (expandable) */}
          {showInlineChart && chartExpanded && (
            <div 
              className="border-t border-border/50 p-4 animate-in slide-in-from-top-2 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <PriceHistoryChart
                productId={product.id}
                productTitle={product.title}
                currentPrice={product.current_price}
                originalPrice={product.original_price}
                currency={product.currency}
                onClose={() => setChartExpanded(false)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Chart (for non-inline mode) */}
      {!showInlineChart && (
        <Dialog open={showChart} onOpenChange={setShowChart}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden">
            <PriceHistoryChart
              productId={product.id}
              productTitle={product.title}
              currentPrice={product.current_price}
              originalPrice={product.original_price}
              currency={product.currency}
              onClose={() => setShowChart(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
