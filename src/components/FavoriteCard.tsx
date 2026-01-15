import { useState, useEffect, useRef } from "react";
import { MoreVertical, Trash2, Edit, Youtube, TrendingDown, TrendingUp, ExternalLink, Sparkles, X, History } from "lucide-react";
import { PriceHistoryCard } from "@/components/PriceHistoryCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";

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
  collection_title?: string | null;
  isKrolistProduct?: boolean;
  image_fit?: string | null;
  price_history?: Array<{
    price: number;
    scraped_at: string;
  }>;
}

interface FavoriteCardProps {
  product: Product;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Product>) => void;
  onRemoveFromMyProducts?: (product: Product) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (product: Product) => void;
}

export function FavoriteCard({
  product,
  onDelete,
  onUpdate,
  onRemoveFromMyProducts,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect
}: FavoriteCardProps) {
  const { t, language } = useLanguage();
  const { currency, convertPriceToDisplay } = useConvertedPrice();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [titleScrollSpeed] = useState(() => {
    const saved = localStorage.getItem('titleScrollSpeed');
    return saved ? parseInt(saved) : 50;
  });
  const titleRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollDuration, setScrollDuration] = useState(0);
  const [scrollDistance, setScrollDistance] = useState(0);
  
  const [editForm, setEditForm] = useState({
    title: product.title,
    description: product.description || '',
    imageUrl: product.image_url || '',
    price: product.current_price.toString(),
    category: product.category || '',
    currency: product.currency || 'SAR',
    categoryType: ['Electronics', 'Accessories', 'Clothes', 'Shoes', 'Watches', 'Home and Kitchen', 'Care products', 'Pet products', 'Furniture', 'EDC'].includes(product.category || '') ? product.category : 'Custom',
    imageFit: product.image_fit || 'contain'
  });

  // Calculate scroll for title
  useEffect(() => {
    const calculateScroll = () => {
      if (titleRef.current && containerRef.current) {
        const titleWidth = titleRef.current.scrollWidth;
        const containerWidth = containerRef.current.clientWidth;
        const overflow = titleWidth - containerWidth;
        if (overflow > 0) {
          const duration = overflow / titleScrollSpeed;
          setScrollDuration(duration);
          setScrollDistance(-overflow);
        } else {
          setScrollDuration(0);
          setScrollDistance(0);
        }
      }
    };
    const timer = setTimeout(calculateScroll, 100);
    return () => clearTimeout(timer);
  }, [product.title, titleScrollSpeed]);

  // Convert prices
  const displayCurrentPrice = convertPriceToDisplay(product.current_price, product.original_currency);
  const displayOriginalPrice = convertPriceToDisplay(product.original_price, product.original_currency);

  // Price history analysis
  const priceHistory = product.price_history || [];
  const sortedHistory = [...priceHistory].sort((a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime());
  const previousPriceOriginal = sortedHistory[1]?.price || product.original_price;
  const previousPriceDisplay = convertPriceToDisplay(previousPriceOriginal, product.original_currency);
  const priceChange = displayCurrentPrice - previousPriceDisplay;
  const priceChangePercent = previousPriceDisplay > 0 ? priceChange / previousPriceDisplay * 100 : 0;
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
        currency: editForm.currency,
        image_fit: editForm.imageFit
      });
      toast.success(t('products.editSuccess'));
      setShowEditDialog(false);
    }
  };
  const handleCardClick = () => {
    if (isSelectionMode && onToggleSelect) {
      onToggleSelect(product);
    }
  };
  const isArabic = language === 'ar';
  return <>
      <div className={cn("group relative overflow-hidden rounded-2xl transition-all duration-500 ease-out", "bg-gradient-to-br from-card via-card to-card/80", "border-2 hover:border-primary/40", "shadow-sm hover:shadow-xl hover:shadow-primary/5", isSelected ? "border-primary ring-2 ring-primary/30 scale-[0.98]" : "border-border/40", isSelectionMode ? "cursor-pointer" : "", "hover:-translate-y-1")} onClick={handleCardClick} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        {/* Gradient Overlay Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Sparkle Effect on Hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:rotate-12">
          <Sparkles className="h-4 w-4 text-primary/40" />
        </div>

        {/* Selection Checkbox */}
        {isSelectionMode && <div className="absolute top-3 left-3 z-20">
            <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200", isSelected ? "bg-primary border-primary" : "bg-background/80 backdrop-blur-sm border-border")}>
              {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
          </div>}

        {/* Main Content */}
        <div className={cn("flex gap-3 p-3", isArabic && "flex-row-reverse")}>
          {/* Image Container */}
          <div className="relative flex-shrink-0 px-[5px] py-[5px]">
            <div className={cn(
              "relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden ring-1 ring-border/30 group-hover:ring-primary/30 transition-all duration-300",
              product.image_fit !== 'cover' && "bg-white"
            )}>
              <img 
                src={product.image_url || '/placeholder.svg'} 
                alt={product.title} 
                className={cn(
                  "w-full h-full transition-all duration-700 ease-out group-hover:scale-110",
                  product.image_fit === 'cover' ? 'object-cover' : 'object-contain'
                )} 
              />
              {/* Image Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Quick Link Button */}
              <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300" onClick={e => e.stopPropagation()}>
                <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                  <ExternalLink className="h-3.5 w-3.5 text-foreground" />
                </div>
              </a>
            </div>

            {/* Price Change Indicator */}
            {priceChange !== 0 && <div className={cn("absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-lg", priceChange < 0 ? "bg-emerald-500 text-white" : "bg-red-500 text-white")}>
                {priceChange < 0 ? <TrendingDown className="h-2.5 w-2.5" /> : <TrendingUp className="h-2.5 w-2.5" />}
                {Math.abs(priceChangePercent).toFixed(0)}%
              </div>}
          </div>

          {/* Info Container */}
          <div className={cn("flex-1 min-w-0 flex flex-col justify-between", isArabic && "text-right")}>
            {/* Top Row: Title + Actions */}
            <div className={cn("flex items-start gap-2", isArabic && "flex-row-reverse")}>
              <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0" onClick={e => isSelectionMode && e.preventDefault()}>
                <div ref={containerRef} className="title-scroll-container overflow-hidden">
                  <span ref={titleRef} className="title-scroll-text font-semibold text-sm leading-tight hover:text-primary transition-colors inline-block whitespace-nowrap" style={scrollDuration > 0 ? {
                  '--scroll-duration': `${scrollDuration}s`,
                  '--scroll-distance': `${scrollDistance}px`
                } as React.CSSProperties : undefined}>
                    {sanitizeContent(product.title)}
                  </span>
                </div>
              </a>

              {/* Actions */}
              <div className={cn("flex items-center gap-0.5 transition-opacity duration-200", isHovered || isSelectionMode ? "opacity-100" : "opacity-0 sm:opacity-100")}>
                {onRemoveFromMyProducts && <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-destructive/10 rounded-full transition-all active:scale-90" onClick={e => {
                e.stopPropagation();
                onRemoveFromMyProducts(product);
              }}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                  </Button>}
                {(onDelete || onUpdate) && <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full">
                        <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isArabic ? 'start' : 'end'} className="bg-background border-2 border-border z-50">
                      {onUpdate && <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('products.edit')}
                        </DropdownMenuItem>}
                      {onDelete && <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('products.delete')}
                        </DropdownMenuItem>}
                    </DropdownMenuContent>
                  </DropdownMenu>}
              </div>
            </div>

            {/* Price Row */}
            <div className={cn("flex items-baseline gap-2 mt-1", isArabic && "flex-row-reverse")}>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                {currency} {displayCurrentPrice.toFixed(2)}
              </span>
              {product.current_price !== product.original_price && <span className="text-xs text-muted-foreground line-through">
                  {displayOriginalPrice.toFixed(2)}
                </span>}
            </div>

            {/* Bottom Row: Badges */}
            <div className={cn("flex items-center gap-1.5 mt-2 flex-wrap", isArabic && "flex-row-reverse")}>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 px-2 py-0.5 text-[10px] font-medium border-0 rounded-full">
                {product.store}
              </Badge>
              {product.category && <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-medium border-border/50 rounded-full">
                  {product.category}
                </Badge>}
              {product.youtube_url && <Button size="sm" variant="ghost" className="h-5 w-5 p-0 hover:bg-red-500/10 rounded-full" onClick={e => {
              e.stopPropagation();
              window.open(product.youtube_url!, '_blank');
            }}>
                  <Youtube className="h-3 w-3 text-red-500" />
                </Button>}
              
              {/* History Button */}
              <Button 
                size="sm" 
                variant="outline" 
                className="h-5 px-1.5 gap-1 border-primary/50 text-primary hover:bg-primary/10 rounded-full" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHistory(true);
                }}
                title={language === 'ar' ? 'سجل الأسعار' : 'Price History'}
              >
                <History className="h-3 w-3" />
                <span className="text-[9px]">{language === 'ar' ? 'السجل' : 'History'}</span>
              </Button>
            </div>

            {/* Last Checked */}
            <div className={cn("mt-1.5", isArabic && "text-right")}>
              <div className="text-[9px] text-muted-foreground/60">
                {new Date(product.last_checked_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
        
        {/* Price History Overlay */}
        {showHistory && (
          <div className="absolute inset-0 z-20 animate-in fade-in duration-300">
            <PriceHistoryCard
              productId={product.id}
              productTitle={product.title}
              originalCurrency={product.original_currency}
              isKrolistProduct={false}
              onFlip={() => setShowHistory(false)}
            />
          </div>
        )}
      </div>

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
                <Select value={editForm.currency} onValueChange={value => setEditForm({
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
                  <SelectItem value="EDC">EDC</SelectItem>
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
    </>;
}