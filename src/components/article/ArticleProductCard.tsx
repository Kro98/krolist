import { ExternalLink, TrendingDown, TrendingUp, Minus, History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KrolistProduct } from '@/types/article';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/lib/currencyConversion';
import { useState } from 'react';

interface ArticleProductCardProps {
  product: KrolistProduct;
  onProductClick?: (productId: string) => void;
  onViewHistory?: (productId: string) => void;
}

export const ArticleProductCard = ({ product, onProductClick, onViewHistory }: ArticleProductCardProps) => {
  const { language } = useLanguage();
  const [imageError, setImageError] = useState(false);
  
  const priceChange = product.original_price - product.current_price;
  const priceChangePercent = product.original_price > 0 
    ? ((priceChange / product.original_price) * 100).toFixed(0) 
    : '0';
  
  const isPriceDrop = priceChange > 0;
  const isPriceIncrease = priceChange < 0;
  
  const handleCardClick = () => {
    onProductClick?.(product.id);
  };
  
  return (
    <Card 
      className="group overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 cursor-pointer"
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewHistory?.(product.id);
                }}
              >
                <History className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'سجل الأسعار' : 'Price History'}
              </Button>
              
              <Button
                size="sm"
                className="flex-1"
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
      </CardContent>
    </Card>
  );
};
