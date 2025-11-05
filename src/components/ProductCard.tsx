import { useState } from "react";
import { MoreVertical, Trash2, RefreshCw, Edit, Youtube, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  youtube_url?: string | null;
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
  onAddToMyProducts?: (product: Product) => void;
}
export function ProductCard({
  product,
  onDelete,
  onUpdate,
  onRefreshPrice,
  onAddToMyProducts
}: ProductCardProps) {
  const {
    t,
    language
  } = useLanguage();
  const {
    currency,
    convertPriceToDisplay
  } = useConvertedPrice();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    title: product.title,
    description: product.description || '',
    imageUrl: product.image_url || '',
    price: product.current_price.toString(),
    category: product.category || '',
    currency: product.currency || 'SAR',
    categoryType: ['Electronics', 'Accessories', 'Clothes', 'Shoes', 'Watches', 'Home and Kitchen', 'Care products', 'Pet products', 'Furniture'].includes(product.category || '') ? product.category : 'Custom'
  });

  // Convert prices to display currency
  const displayCurrentPrice = convertPriceToDisplay(product.current_price, product.original_currency);
  const displayOriginalPrice = convertPriceToDisplay(product.original_price, product.original_currency);

  // Calculate discount percentage (original - current) / original * 100
  const discountPercent = product.original_price > 0 ? ((product.original_price - product.current_price) / product.original_price * 100).toFixed(0) : '0';
  const discountValue = parseFloat(discountPercent);

  // Calculate price change in display currency (for user products price history)
  const priceHistory = product.price_history || [];
  const sortedHistory = [...priceHistory].sort((a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime());
  const previousPriceOriginal = sortedHistory[1]?.price || product.original_price;
  const previousPriceDisplay = convertPriceToDisplay(previousPriceOriginal, product.original_currency);
  const priceChange = displayCurrentPrice - previousPriceDisplay;
  const priceChangePercent = previousPriceDisplay > 0 ? (priceChange / previousPriceDisplay * 100).toFixed(2) : '0';
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
        category: editForm.categoryType === 'Custom' ? editForm.category : editForm.categoryType,
        currency: editForm.currency
      });
      toast.success(t('products.editSuccess'));
      setShowEditDialog(false);
    }
  };
  return <Card className="bg-card border-border shadow-card hover:shadow-hover transition-all duration-300 group relative lg:max-w-lg">
      <CardContent className="p-4 px-0">
        <div className={`flex gap-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          {/* Product Image */}
          <div className="flex-shrink-0 space-y-2 relative">
            <img src={product.image_url || '/placeholder.svg'} alt={product.title} className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-lg" />
            {!product.isKrolistProduct && (
              <div className="text-[10px] text-muted-foreground text-center">
                {new Date(product.last_checked_at).toLocaleDateString()}
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div className={`flex-1 min-w-0 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            {/* Title and Menu */}
            <div className={`flex items-start justify-between mb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-base line-clamp-1 hover:text-primary transition-colors hover:underline">
                {sanitizeContent(product.title)}
              </a>
              {/* Show menu for both Krolist and user products */}
              {(onDelete || onUpdate || onAddToMyProducts) && <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={language === 'ar' ? 'start' : 'end'}>
                    {onUpdate && !product.isKrolistProduct && <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {t('products.edit')}
                      </DropdownMenuItem>}
                    {product.isKrolistProduct && onAddToMyProducts && <DropdownMenuItem onClick={() => onAddToMyProducts(product)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add to My List
                      </DropdownMenuItem>}
                    {onDelete && !product.isKrolistProduct && <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('products.delete')}
                      </DropdownMenuItem>}
                  </DropdownMenuContent>
                </DropdownMenu>}
            </div>
            
            {/* Description */}
            {product.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {sanitizeContent(product.description)}
              </p>}

            {/* Review button under image for Krolist products */}
            {product.isKrolistProduct && product.youtube_url && (
              <div className="mb-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 gap-1.5 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() => window.open(product.youtube_url!, '_blank')}
                >
                  <Youtube className="h-3.5 w-3.5" />
                  <span className="text-xs">Review</span>
                </Button>
              </div>
            )}
            
            {/* Price Display */}
            <div className={`space-y-1 mb-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {/* Current Price */}
              <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                  {currency} {displayCurrentPrice.toFixed(2)}
                </span>
                
                {/* Show discount badge for Krolist products */}
                {product.isKrolistProduct && product.current_price !== product.original_price && (
                  <Badge className={`text-xs ${discountValue > 0 ? 'bg-success hover:bg-success text-success-foreground' : 'bg-destructive hover:bg-destructive text-destructive-foreground'}`}>
                    {discountValue > 0 ? '-' : '+'}{Math.abs(discountValue)}%
                  </Badge>
                )}
                
                {/* Show price change for user products */}
                {!product.isKrolistProduct && (
                  <span className={`text-xs sm:text-sm ${priceChange < 0 ? 'text-success' : priceChange > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {priceChange !== 0 ? `${priceChange > 0 ? '+' : ''}${priceChangePercent}%` : '0.00%'}
                  </span>
                )}
              </div>
              
              {/* Original Price (under current price for Krolist products) */}
              {product.isKrolistProduct && product.current_price !== product.original_price && (
                <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs sm:text-sm text-muted-foreground line-through">
                    {currency} {displayOriginalPrice.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            
        {/* Badges (YouTube review button moved above for Krolist products) */}
        <div className={`flex gap-2 flex-wrap items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          {product.isKrolistProduct && <Badge className="bg-gradient-primary text-white">
              Krolist
            </Badge>}
          <Badge className="bg-orange-500 text-white hover:bg-orange-600">
            {product.store}
          </Badge>
          {product.category && <Badge variant="secondary" className={(() => {
              const predefinedCategories = ['Electronics', 'Accessories', 'Clothes', 'Shoes', 'Watches', 'Home and Kitchen', 'Care products', 'Pet products', 'Furniture'];
              return !predefinedCategories.includes(product.category) ? 'border-2 border-white' : '';
            })()}>
              {product.category}
            </Badge>}
          {/* Show YouTube button for user products only */}
          {!product.isKrolistProduct && product.youtube_url && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 gap-1 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={() => window.open(product.youtube_url!, '_blank')}
            >
              <Youtube className="h-3 w-3" />
              <span className="text-xs">Review</span>
            </Button>
          )}
        </div>
          </div>
        </div>
      </CardContent>
      
      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('products.editProduct')}</DialogTitle>
            <DialogDescription>{t('products.editDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">{t('products.productTitle')}</Label>
              <Input id="edit-title" value={editForm.title} onChange={e => setEditForm({
              ...editForm,
              title: e.target.value
            })} placeholder={t('products.enterTitle')} />
            </div>
            <div>
              <Label htmlFor="edit-description">{t('products.productDescription')}</Label>
              <Textarea id="edit-description" value={editForm.description} onChange={e => setEditForm({
              ...editForm,
              description: e.target.value
            })} placeholder={t('products.enterDescription')} rows={3} />
            </div>
            <div>
              <Label htmlFor="edit-image">{t('products.imageUrl')}</Label>
              <Input id="edit-image" value={editForm.imageUrl || ''} onChange={e => setEditForm({
              ...editForm,
              imageUrl: e.target.value
            })} placeholder={t('products.enterImageUrl')} />
              {editForm.imageUrl && <img src={editForm.imageUrl} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-md border" onError={e => e.currentTarget.style.display = 'none'} />}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">{t('products.currentPrice')}</Label>
                <Input id="edit-price" type="number" step="0.01" value={editForm.price} onChange={e => setEditForm({
                ...editForm,
                price: e.target.value
              })} placeholder={t('products.enterPrice')} />
              </div>
              <div>
                <Label htmlFor="edit-currency">{t('products.currency')}</Label>
                <Select value={editForm.currency || product.currency} onValueChange={value => setEditForm({
                ...editForm,
                currency: value
              })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">SAR</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-category">{t('product.category')}</Label>
              <Select value={editForm.categoryType || 'Custom'} onValueChange={value => setEditForm({
              ...editForm,
              categoryType: value,
              category: value === 'Custom' ? editForm.category : value
            })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Accessories">Accessories</SelectItem>
                  <SelectItem value="Clothes">Clothes</SelectItem>
                  <SelectItem value="Shoes">Shoes</SelectItem>
                  <SelectItem value="Watches">Watches</SelectItem>
                  <SelectItem value="Home and Kitchen">Home and Kitchen</SelectItem>
                  <SelectItem value="Care products">Care products</SelectItem>
                  <SelectItem value="Pet products">Pet products</SelectItem>
                  <SelectItem value="Furniture">Furniture</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editForm.categoryType === 'Custom' && <div>
                <Label htmlFor="edit-custom-category">{t('product.customCategory')}</Label>
                <Input id="edit-custom-category" value={editForm.category} onChange={e => setEditForm({
              ...editForm,
              category: e.target.value
            })} maxLength={16} placeholder={t('product.customCategoryPlaceholder')} />
              </div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleEdit}>{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>;
}