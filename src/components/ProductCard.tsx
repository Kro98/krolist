import { useState } from "react";
import { ExternalLink, TrendingUp, TrendingDown, ChevronDown, MoreVertical, Trash2, RefreshCw, Edit, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useLanguage } from "@/contexts/LanguageContext";
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
  priceHistory: Array<{
    date: string;
    price: number;
  }>;
}
interface ProductCardProps {
  product: Product;
}
export function ProductCard({ product }: ProductCardProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const priceChange = product.price - product.previousPrice;
  const priceChangePercent = ((priceChange / product.previousPrice) * 100).toFixed(2);
  
  // Calculate price statistics
  const prices = product.priceHistory.map(p => p.price);
  const highestPrice = Math.max(...prices);
  const lowestPrice = Math.min(...prices);
  const originalPrice = product.priceHistory[0]?.price || product.price;
  
  // Prepare chart data
  const chartData = product.priceHistory.map((point) => ({
    date: point.date,
    price: point.price,
  }));
  
  const chartConfig = {
    price: {
      label: "Price",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card className="bg-card border-border shadow-card hover:shadow-hover transition-all duration-300 group relative">
      <CardContent className="p-4">
        {/* Top Section */}
        <div className="flex gap-4 mb-3">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <img 
              src={product.imageUrl} 
              alt={product.title} 
              className="w-24 h-24 object-cover rounded-lg"
            />
          </div>
          
          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                {product.title}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-popover border-border">
                  <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('products.delete')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Tag className="h-4 w-4 mr-2" />
                    {t('products.currency')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('products.refresh')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Edit className="h-4 w-4 mr-2" />
                    {t('products.edit')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {t('products.description')}
            </p>
            
            {/* Price */}
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-2xl font-bold">
                {product.currency}{product.price.toFixed(2)}
              </span>
              <span className={`text-sm ${priceChange < 0 ? 'text-price-decrease' : priceChange > 0 ? 'text-price-increase' : 'text-muted-foreground'}`}>
                {priceChange !== 0 && (priceChange > 0 ? '+' : '')}
                {priceChange.toFixed(2)} ({priceChangePercent}%)
              </span>
            </div>
            
            {/* Tags */}
            <div className="flex gap-2 mb-2">
              <Badge variant="default" className="text-xs bg-primary text-primary-foreground">
                {product.store}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {product.category}
              </Badge>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ExternalLink className="h-4 w-4" />
            <span>{t('products.updated')}: {product.lastUpdated}</span>
          </div>
          
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs">
                <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                {t('products.showHistory')}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-4">
              <div className="space-y-4 pt-4 border-t border-border">
                {/* Price Details Header */}
                <div>
                  <h4 className="text-sm font-semibold mb-1">{t('products.priceDetails')}</h4>
                  <p className="text-xs text-muted-foreground">
                    {t('products.recordedHistory')}
                  </p>
                </div>
                
                {/* Chart */}
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', { month: 'short' });
                        }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
                
                {/* Price Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Highest */}
                  <div className="border border-border rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <TrendingUp className="h-4 w-4 text-price-increase" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{t('products.highest')}</p>
                    <p className="text-lg font-bold text-price-increase">
                      {product.currency}{highestPrice.toFixed(2)}
                    </p>
                  </div>
                  
                  {/* Lowest */}
                  <div className="border border-border rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <TrendingDown className="h-4 w-4 text-price-decrease" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{t('products.lowest')}</p>
                    <p className="text-lg font-bold text-price-decrease">
                      {product.currency}{lowestPrice.toFixed(2)}
                    </p>
                  </div>
                  
                  {/* Original */}
                  <div className="border border-border rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Tag className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{t('products.original')}</p>
                    <p className="text-lg font-bold">
                      {product.currency}{originalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}