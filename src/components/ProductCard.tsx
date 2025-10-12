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
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Product>) => void;
}
export function ProductCard({
  product,
  onDelete,
  onUpdate
}: ProductCardProps) {
  const {
    t
  } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(product.currency);
  const [editForm, setEditForm] = useState({
    title: product.title,
    description: t('products.description'),
    imageUrl: product.imageUrl,
    price: product.price.toString()
  });
  const priceChange = product.price - product.previousPrice;
  const priceChangePercent = (priceChange / product.previousPrice * 100).toFixed(2);

  // Calculate price statistics
  const prices = product.priceHistory.map(p => p.price);
  const highestPrice = Math.max(...prices);
  const lowestPrice = Math.min(...prices);
  const originalPrice = product.priceHistory[0]?.price || product.price;

  // Prepare chart data
  const chartData = product.priceHistory.map(point => ({
    date: point.date,
    price: point.price
  }));
  const chartConfig = {
    price: {
      label: "Price",
      color: "hsl(var(--primary))"
    }
  };
  const handleDelete = () => {
    if (onDelete) {
      onDelete(product.id);
      toast.success(t('products.deleteSuccess'));
    }
  };
  const handleCurrencyChange = () => {
    if (onUpdate) {
      onUpdate(product.id, {
        currency: selectedCurrency
      });
      toast.success(t('products.currencyChanged'));
    }
    setShowCurrencyDialog(false);
  };
  const handleEdit = () => {
    if (onUpdate) {
      onUpdate(product.id, {
        title: editForm.title,
        imageUrl: editForm.imageUrl,
        price: parseFloat(editForm.price)
      });
      toast.success(t('products.editSuccess'));
    }
    setShowEditDialog(false);
  };
  return <Card className="bg-card border-border shadow-card hover:shadow-hover transition-all duration-300 group relative">
      <CardContent className="p-4">
        {/* Top Section */}
        <div className="flex gap-4 mb-3">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <img src={product.imageUrl} alt={product.title} className="w-24 h-24 object-cover rounded-lg" />
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
              <Input id="edit-title" value={editForm.title} onChange={e => setEditForm({
              ...editForm,
              title: e.target.value
            })} placeholder={t('products.enterTitle')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t('products.productDescription')}</Label>
              <Textarea id="edit-description" value={editForm.description} onChange={e => setEditForm({
              ...editForm,
              description: e.target.value
            })} placeholder={t('products.enterDescription')} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-image">{t('products.imageUrl')}</Label>
              <Input id="edit-image" value={editForm.imageUrl} onChange={e => setEditForm({
              ...editForm,
              imageUrl: e.target.value
            })} placeholder={t('products.enterImageUrl')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">{t('products.currentPrice')}</Label>
              <Input id="edit-price" type="number" step="0.01" value={editForm.price} onChange={e => setEditForm({
              ...editForm,
              price: e.target.value
            })} placeholder={t('products.enterPrice')} />
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
    </Card>;
}