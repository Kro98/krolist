import { useState } from "react";
import { ExternalLink, TrendingUp, TrendingDown, Minus, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Product {
  id: string;
  title: string;
  price: number;
  previousPrice: number;
  currency: string;
  imageUrl: string;
  url: string;
  store: string;
  category: string;
  lastUpdated: string;
  priceHistory: Array<{ date: string; price: number }>;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const priceChange = product.price - product.previousPrice;
  const priceChangePercent = ((priceChange / product.previousPrice) * 100).toFixed(1);
  
  const getPriceChangeIcon = () => {
    if (priceChange > 0) return <TrendingUp className="h-4 w-4 text-price-increase" />;
    if (priceChange < 0) return <TrendingDown className="h-4 w-4 text-price-decrease" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getPriceChangeColor = () => {
    if (priceChange > 0) return "text-price-increase";
    if (priceChange < 0) return "text-price-decrease";
    return "text-muted-foreground";
  };

  return (
    <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300 group">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-20 h-20 object-cover rounded-lg"
            />
          </div>
          
          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {product.title}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(product.url, '_blank')}
                className="flex-shrink-0 ml-2"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Price and Change */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold">
                {product.currency}{product.price.toFixed(2)}
              </span>
              <div className={`flex items-center gap-1 ${getPriceChangeColor()}`}>
                {getPriceChangeIcon()}
                <span className="text-sm font-medium">
                  {priceChange !== 0 && (priceChange > 0 ? '+' : '')}
                  {priceChange.toFixed(2)} ({priceChangePercent}%)
                </span>
              </div>
            </div>
            
            {/* Tags */}
            <div className="flex gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {product.store}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {product.category}
              </Badge>
            </div>
            
            {/* Last Updated */}
            <p className="text-xs text-muted-foreground">
              Updated: {product.lastUpdated}
            </p>
          </div>
        </div>
        
        {/* Expandable Details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full mt-3 justify-center"
              size="sm"
            >
              <MoreHorizontal className="h-4 w-4 mr-2" />
              {isExpanded ? 'Show Less' : 'Show Details'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 animate-accordion-down">
            <div className="space-y-3 pt-3 border-t border-border">
              {/* Price History Chart Placeholder */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">Price History</h4>
                <div className="h-24 flex items-end gap-1">
                  {product.priceHistory.slice(-7).map((point, index) => (
                    <div
                      key={index}
                      className="bg-primary flex-1 rounded-sm opacity-70"
                      style={{
                        height: `${(point.price / Math.max(...product.priceHistory.map(p => p.price))) * 100}%`
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>7 days ago</span>
                  <span>Today</span>
                </div>
              </div>
              
              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Original Price:</span>
                  <div className="font-medium">
                    {product.currency}{product.priceHistory[0]?.price.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Best Price:</span>
                  <div className="font-medium text-price-decrease">
                    {product.currency}{Math.min(...product.priceHistory.map(p => p.price)).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}