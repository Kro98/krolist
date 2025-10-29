import { useState } from "react";
import { MoreVertical, Trash2, RefreshCw, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConvertedPrice } from "@/hooks/useConvertedPrice";
import { toast } from "sonner";
import { sanitizeContent } from "@/lib/sanitize";

export interface Product {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  store: string;
  product_url: string;
  current_price: number;
  original_price: number;
  original_currency: string;
  currency: string;
  created_at: string;
  updated_at: string;
  last_checked_at: string;
  isKrolistProduct?: boolean;
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
  const { t, language } = useLanguage();
  const { currency, convertPriceToDisplay } = useConvertedPrice();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    title: product.title,
    description: product.description || '',
    imageUrl: product.image_url || '',
    price: product.current_price.toString(),
    category: product.category || '',
  });

  // Convert prices to display currency
  const displayPrice = convertPriceToDisplay(product.original_price, product.original_currency);
  
  // Calculate price change in display currency
  const priceHistory = product.price_history || [];
  const sortedHistory = [...priceHistory].sort((a, b) => 
    new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime()
  );
  const previousPriceOriginal = sortedHistory[1]?.price || product.original_price;
  const previousPriceDisplay = convertPriceToDisplay(previousPriceOriginal, product.original_currency);
  
  const priceChange = displayPrice - previousPriceDisplay;
  const priceChangePercent = previousPriceDisplay > 0 ? ((priceChange / previousPriceDisplay) * 100).toFixed(2) : '0';

  const handleDelete = () => {
    if (onDelete) {
      onDelete(product.id);
      toast.success(t('products.deleteSuccess'));
    }
  };

  const handleEdit = () => {
    if (onUpdate) {
      onUpdate(product.id, {
        title: editForm.title,
        description: editForm.description || null,
        image_url: editForm.imageUrl || null,
        current_price: parseFloat(editForm.price),
        category: editForm.category || null,
      });
      toast.success(t('products.updateSuccess'));
      setShowEditDialog(false);
    }
  };

  return (
    <Card className="bg-card border-border shadow-card hover:shadow-hover transition-all duration-300 group relative">
      <CardContent className="p-4">
        <div className={`flex gap-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          {/* Product Image + Refresh */}
          <div className="flex-shrink-0 space-y-2">
            <img 
              src={product.image_url || '/placeholder.svg'}
              alt={product.title} 
              className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-lg"
            />
            {onRefreshPrice && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRefreshPrice(product.id)}
                className="h-7 w-7 mx-auto block"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            <div className="text-[10px] text-muted-foreground text-center">
              {new Date(product.last_checked_at).toLocaleDateString()}
            </div>
          </div>
          
          {/* Product Info */}
          <div className={`flex-1 min-w-0 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            {/* Title and Menu */}
            <div className={`flex items-start justify-between mb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <a 
                href={product.product_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-semibold text-base line-clamp-1 hover:text-primary transition-colors hover:underline"
              >
                {sanitizeContent(product.title)}
              </a>
              {/* Only show menu if not Krolist product */}
              {!product.isKrolistProduct && (onDelete || onUpdate) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={language === 'ar' ? 'start' : 'end'}>
                    {onUpdate && (
                      <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {t('products.edit')}
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('products.delete')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {/* Description */}
            {product.description && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {sanitizeContent(product.description)}
              </p>
            )}
            
            {/* Price with inline percentage */}
            <div className={`flex items-baseline gap-2 mb-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <span className="text-xl md:text-2xl font-bold">
                {currency} {displayPrice.toFixed(2)}
              </span>
              <span className={`text-sm ${
                priceChange < 0 ? 'text-green-500' : 
                priceChange > 0 ? 'text-red-500' : 
                'text-muted-foreground'
              }`}>
                {priceChange !== 0 ? (
                  `${priceChange > 0 ? '+' : ''}${priceChangePercent}%`
                ) : (
                  '0.00%'
                )}
              </span>
            </div>
            
        {/* Badges */}
        <div className={`flex gap-2 flex-wrap ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          {product.isKrolistProduct && (
            <Badge className="bg-gradient-primary text-white">
              Krolist
            </Badge>
          )}
          <Badge className="bg-orange-500 text-white hover:bg-orange-600">
            {product.store}
          </Badge>
          {product.category && (
            <Badge 
              variant="secondary"
              className={(() => {
                const predefinedCategories = [
                  'Electronics', 'Accessories', 'Clothes', 'Shoes', 
                  'Watches', 'Home and Kitchen', 'Care products', 
                  'Pet products', 'Furniture'
                ];
                return !predefinedCategories.includes(product.category) 
                  ? 'border-2 border-white' 
                  : '';
              })()}
            >
              {product.category}
            </Badge>
          )}
        </div>
          </div>
        </div>
      </CardContent>
      
      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('products.editProduct')}</DialogTitle>
            <DialogDescription>{t('products.editProductDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">{t('products.productTitle')}</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">{t('products.description')}</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-price">{t('products.currentPrice')}</Label>
              <Input
                id="edit-price"
                type="number"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">{t('products.category')}</Label>
              <Input
                id="edit-category"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleEdit}>{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
