import { useState } from "react";
import { ExternalLink, TrendingUp, TrendingDown, ChevronDown, MoreVertical, Trash2, RefreshCw, Edit, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
interface Product {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  store: string;
  product_url: string;
  current_price: number;
  currency: string;
  created_at: string;
  updated_at: string;
  last_checked_at: string;
  price_history?: Array<{
    price: number;
    scraped_at: string;
  }>;
}

interface ProductCardProps {
  product: Product;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Product>) => void;
  onRefreshPrice?: (id: string) => void;
}

export function ProductCard({ product, onDelete, onUpdate, onRefreshPrice }: ProductCardProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(product.currency);
  const [editForm, setEditForm] = useState({
    title: product.title,
    description: product.description || '',
    imageUrl: product.image_url || '',
    price: product.current_price.toString(),
    category: product.category || ''
  });

  // Calculate price change
  const priceHistory = product.price_history || [];
  const sortedHistory = [...priceHistory].sort((a, b) => 
    new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime()
  );
  const previousPrice = sortedHistory[1]?.price || product.current_price;
  const priceChange = product.current_price - previousPrice;
  const priceChangePercent = previousPrice > 0 ? ((priceChange / previousPrice) * 100).toFixed(2) : '0';
  
  // Calculate price statistics
  const prices = priceHistory.map(p => p.price);
  const highestPrice = prices.length > 0 ? Math.max(...prices) : product.current_price;
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : product.current_price;
  const originalPrice = sortedHistory[sortedHistory.length - 1]?.price || product.current_price;
  
  // Prepare chart data
  const chartData = priceHistory.map((point) => ({
    date: new Date(point.scraped_at).toLocaleDateString(),
    price: point.price,
  }));
  
  const chartConfig = {
    price: {
      label: "Price",
      color: "hsl(var(--primary))",
    },
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(product.id);
      toast.success(t('products.deleteSuccess'));
    }
  };

  const handleCurrencyChange = () => {
    if (onUpdate) {
      onUpdate(product.id, { currency: selectedCurrency });
      toast.success(t('products.currencyChanged'));
    }
    setShowCurrencyDialog(false);
  };

  const handleEdit = () => {
    if (onUpdate) {
      onUpdate(product.id, {
        title: editForm.title,
        description: editForm.description,
        image_url: editForm.imageUrl,
        current_price: parseFloat(editForm.price),
        category: editForm.category
      });
      toast.success(t('products.editSuccess'));
    }
    setShowEditDialog(false);
  };

  return (
    <Card className="bg-card border-border shadow-card hover:shadow-hover transition-all duration-300 group relative">
      <CardContent className="p-4">
        {/* Top Section */}
        <div className="flex gap-4 mb-3">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <img 
              src={product.image_url || '/placeholder.svg'}
              alt={product.title} 
              className="w-24 h-24 object-cover rounded-lg"
            />
            {onRefreshPrice && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRefreshPrice(product.id)}
                className="h-8 w-8 mt-1"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <ExternalLink className="h-2.5 w-2.5" />
              {t('products.updated')}: {new Date(product.last_checked_at).toLocaleDateString()}
            </div>
          </div>
          
          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <a 
                href={product.product_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors hover:underline cursor-pointer"
              >
                {product.title}
              </a>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-popover border-border z-50">
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive cursor-pointer">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('products.delete')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowCurrencyDialog(true)} className="cursor-pointer">
                    <Tag className="h-4 w-4 mr-2" />
                    {t('products.currency')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)} className="cursor-pointer">
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
                {product.currency}{product.current_price.toFixed(2)}
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
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs flex items-center gap-2">
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
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
                <div className="w-full">
                  <ChartContainer config={chartConfig} className="h-[180px] sm:h-[200px] md:h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${product.currency}${value}`}
                          width={60}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          dot={{ fill: "hsl(var(--primary))", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
                
                {/* Price Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {/* Highest */}
                  <div className="bg-accent/10 border border-border rounded-lg p-2 sm:p-3">
                    <div className="flex items-center justify-center mb-1.5">
                      <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-price-increase" />
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 text-center">{t('products.highest')}</p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-price-increase text-center">
                      {product.currency}{highestPrice.toFixed(2)}
                    </p>
                  </div>
                  
                  {/* Lowest */}
                  <div className="bg-accent/10 border border-border rounded-lg p-2 sm:p-3">
                    <div className="flex items-center justify-center mb-1.5">
                      <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-price-decrease" />
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 text-center">{t('products.lowest')}</p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-price-decrease text-center">
                      {product.currency}{lowestPrice.toFixed(2)}
                    </p>
                  </div>
                  
                  {/* Original */}
                  <div className="bg-accent/10 border border-border rounded-lg p-2 sm:p-3">
                    <div className="flex items-center justify-center mb-1.5">
                      <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 text-center">{t('products.original')}</p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-center">
                      {product.currency}{originalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>

      {/* Currency Dialog */}
      <Dialog open={showCurrencyDialog} onOpenChange={setShowCurrencyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('products.changeCurrency')}</DialogTitle>
            <DialogDescription>
              {t('products.selectCurrency')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currency">{t('products.currency')}</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="$">USD ($)</SelectItem>
                  <SelectItem value="ر.س">SAR (ر.س)</SelectItem>
                  <SelectItem value="د.إ">AED (د.إ)</SelectItem>
                  <SelectItem value="ج.م">EGP (ج.م)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCurrencyDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleCurrencyChange}>
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('products.editProduct')}</DialogTitle>
            <DialogDescription>
              {t('products.editDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">{t('products.productTitle')}</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder={t('products.enterTitle')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t('products.productDescription')}</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder={t('products.enterDescription')}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-image">{t('products.imageUrl')}</Label>
              <Input
                id="edit-image"
                value={editForm.imageUrl}
                onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                placeholder={t('products.enterImageUrl')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">{t('products.currentPrice')}</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                placeholder={t('products.enterPrice')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleEdit}>
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}