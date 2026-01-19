import { Heart, Youtube, X, MoreVertical, Pencil, Trash2, History } from "lucide-react";
import { PriceHistoryCard } from "@/components/PriceHistoryCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConvertedPrice } from "@/hooks/useConvertedPrice";
import { sanitizeContent } from "@/lib/sanitize";
import { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
export interface MobileProduct {
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
  youtube_url?: string | null;
  isKrolistProduct?: boolean;
  image_fit?: string | null;
}
interface MobileProductCardProps {
  product: MobileProduct;
  onAddToMyProducts?: (product: MobileProduct) => void;
  onRemoveFromMyProducts?: (product: MobileProduct) => void;
  onEdit?: (product: MobileProduct) => void;
  onDelete?: (product: MobileProduct) => void;
  userProductCount?: number;
  isInFavorites?: boolean;
  isFavoritesSection?: boolean;
  isCompactGrid?: boolean; // True when in 2x2 mobile grid view
}
export function MobileProductCard({
  product,
  onAddToMyProducts,
  onRemoveFromMyProducts,
  onEdit,
  onDelete,
  userProductCount = 0,
  isInFavorites = false,
  isFavoritesSection = false,
  isCompactGrid = false
}: MobileProductCardProps) {
  const {
    language,
    t
  } = useLanguage();
  const {
    currency,
    convertPriceToDisplay
  } = useConvertedPrice();
  const [cardStyle, setCardStyle] = useState<'fade' | 'full'>('fade');
  useEffect(() => {
    const loadCardStyle = () => {
      const saved = localStorage.getItem('mobileCardStyle');
      if (saved === 'fade' || saved === 'full') {
        setCardStyle(saved);
      }
    };
    loadCardStyle();
    const handleStyleChange = (e: CustomEvent) => {
      setCardStyle(e.detail);
    };
    window.addEventListener('mobileCardStyleChanged', handleStyleChange as EventListener);
    return () => {
      window.removeEventListener('mobileCardStyleChanged', handleStyleChange as EventListener);
    };
  }, []);

  // Listen for carousel slide changes to close history
  useEffect(() => {
    const handleSlideChange = () => {
      setShowHistory(false);
    };
    window.addEventListener('carouselSlideChanged', handleSlideChange);
    return () => window.removeEventListener('carouselSlideChanged', handleSlideChange);
  }, []);

  const [showHistory, setShowHistory] = useState(false);
  const displayCurrentPrice = convertPriceToDisplay(product.current_price, product.original_currency);
  const displayOriginalPrice = convertPriceToDisplay(product.original_price, product.original_currency);
  const discountPercent = product.original_price > 0 ? ((product.original_price - product.current_price) / product.original_price * 100).toFixed(0) : '0';
  const discountValue = parseFloat(discountPercent);
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInFavorites && onRemoveFromMyProducts) {
      onRemoveFromMyProducts(product);
    } else if (onAddToMyProducts) {
      if (userProductCount >= 24) return;
      onAddToMyProducts(product);
    }
  };
  return <Card className="bg-card border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 ease-out overflow-hidden relative hover:-translate-y-1 hover:border-primary/20 group">
      <CardContent className="p-0">
        {/* Image Container */}
        <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="block relative">
          <div className="relative aspect-square overflow-hidden bg-white">
            <img src={product.image_url || '/placeholder.svg'} alt={product.title} className={`w-full h-full transition-all duration-500 ease-out group-hover:scale-110 group-hover:brightness-105 ${product.image_fit === 'cover' ? 'object-cover' : 'object-contain'}`} />
            {/* Gradient overlay */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ease-in-out ${cardStyle === 'fade' ? 'opacity-100' : 'opacity-0'}`} style={{
            background: 'linear-gradient(to top, hsl(var(--card)) 0%, hsl(var(--card) / 0.5) 15%, transparent 40%)'
          }} />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* YouTube Review Button - Top Left */}
            {product.youtube_url && <Button size="sm" variant="outline" className="absolute top-2 left-2 h-7 px-1.5 py-0 gap-1 bg-background/80 backdrop-blur-sm border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-transform duration-200 hover:scale-105" onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            window.open(product.youtube_url!, '_blank');
          }}>
                <Youtube className="h-3 w-3" />
                <span className="text-[0.6rem] font-medium">Review</span>
              </Button>}
          </div>
          
          {/* Admin Edit/Delete Menu for Krolist Products */}
          {product.isKrolistProduct && (onEdit || onDelete) ? <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="absolute top-2 right-2 h-8 w-8 p-0 bg-background shadow-md hover:bg-accent transition-transform active:scale-90" onClick={e => e.preventDefault()}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && <DropdownMenuItem onClick={() => onEdit(product)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>}
                {onDelete && <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu> : isFavoritesSection && onRemoveFromMyProducts ? <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-8 w-8 p-0 bg-background/50 backdrop-blur-sm hover:bg-destructive/20 transition-transform active:scale-90" onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          onRemoveFromMyProducts(product);
        }}>
              <X className="h-5 w-5 text-destructive" />
            </Button> : onAddToMyProducts && <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-8 w-8 p-0 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-transform active:scale-90" onClick={handleToggleFavorite}>
              <Heart className={`h-5 w-5 transition-all duration-200 ${isInFavorites ? 'fill-red-500 text-red-500' : 'text-foreground'}`} />
            </Button>}
        </a>

        {/* Content */}
        <div className={`p-3 space-y-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
          {/* Title */}
          <a href={product.product_url} target="_blank" rel="noopener noreferrer">
            <h3 className="font-semibold text-sm line-clamp-1 hover:text-primary transition-colors">
              {sanitizeContent(product.title)}
            </h3>
          </a>

          {/* Description */}
          {product.description && <p className="text-xs text-muted-foreground line-clamp-1">
              {sanitizeContent(product.description)}
            </p>}

          {/* Price */}
          <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <span className="font-bold text-foreground text-lg">
              {currency} {displayCurrentPrice.toFixed(2)}
            </span>
          </div>

          {/* Original Price */}
          {product.current_price !== product.original_price && <div className={`flex items-center gap-1.5 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <span className="text-xs text-muted-foreground line-through">
                {currency} {displayOriginalPrice.toFixed(2)}
              </span>
              {discountValue > 0 && <Badge className="bg-success hover:bg-success text-success-foreground text-xs px-1.5 py-0">
                  -{discountValue}%
                </Badge>}
            </div>}

          {/* Badges */}
          <div className={`flex gap-1.5 flex-wrap items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Badge className="bg-orange-500 text-white hover:bg-orange-600 px-1.5 py-0 text-[0.6rem]">
              {product.store}
            </Badge>
            {product.category && <Badge variant="secondary" className="px-1.5 py-0 text-[0.6rem] border border-border">
                {product.category}
              </Badge>}
            
            {/* History Button */}
            <Button size="sm" variant="outline" className="h-5 gap-0.5 border-primary/50 text-primary hover:bg-primary/10 history-pulse ml-auto px-[45px]" onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            setShowHistory(!showHistory);
          }}>
              <History className="h-3 w-3" />
              <span className="text-[0.55rem]">{language === 'ar' ? 'السجل' : 'History'}</span>
            </Button>
          </div>
        </div>
        
        {/* Price History Overlay with Fade */}
        {showHistory && <div className="absolute inset-0 z-30 animate-in fade-in duration-300">
            <PriceHistoryCard productId={product.id} productTitle={product.title} originalCurrency={product.original_currency} isKrolistProduct={product.isKrolistProduct} onFlip={() => setShowHistory(false)} isCompactGrid={isCompactGrid} />
          </div>}
      </CardContent>
    </Card>;
}