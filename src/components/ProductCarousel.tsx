import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { ProductCard, type Product } from "@/components/ProductCard";
import { MobileProductCard } from "@/components/MobileProductCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";

interface ProductCarouselProps {
  title: string;
  products: Product[];
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Product>) => void;
  onRefreshPrice?: (id: string) => void;
  onAddToMyProducts?: (product: Product) => void;
  onRemoveFromMyProducts?: (product: Product) => void;
  userProductCount?: number;
  isSelectionMode?: boolean;
  onToggleSelect?: (product: Product) => void;
  selectedProductIds?: Set<string>;
  enableExpand?: boolean;
  userProducts?: Product[];
  isFavoritesSection?: boolean; // Whether this is the My Favorites section
}

export function ProductCarousel({
  title,
  products,
  onDelete,
  onUpdate,
  onRefreshPrice,
  onAddToMyProducts,
  onRemoveFromMyProducts,
  userProductCount = 0,
  isSelectionMode = false,
  onToggleSelect,
  selectedProductIds = new Set(),
  enableExpand = false,
  userProducts = [],
  isFavoritesSection = false
}: ProductCarouselProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [carouselSpeed, setCarouselSpeed] = useState(() => {
    const saved = localStorage.getItem('carouselSpeed');
    return saved ? parseInt(saved) : 3000;
  });
  const [cardLayoutStyle, setCardLayoutStyle] = useState<'classic' | 'compact'>(() => {
    const saved = localStorage.getItem('cardLayoutStyle');
    return saved === 'classic' ? 'classic' : 'compact';
  });
  const [favoritesCardStyle, setFavoritesCardStyle] = useState<'classic' | 'compact'>(() => {
    const saved = localStorage.getItem('favoritesCardStyle');
    return saved === 'classic' ? 'classic' : 'compact';
  });
  const [desktopItemsPerRow, setDesktopItemsPerRow] = useState<2 | 3>(() => {
    const saved = localStorage.getItem('desktopItemsPerRow');
    return saved === '2' ? 2 : 3;
  });
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1279px)");
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const isLargeDesktop = useMediaQuery("(min-width: 1280px)");
  const isXLDesktop = useMediaQuery("(min-width: 1536px)");
  const isTabletOrAbove = useMediaQuery('(min-width: 768px)');
  const { t, language } = useLanguage();
  
  // Listen for speed changes and card layout style changes
  useEffect(() => {
    const handleSpeedChange = (e: CustomEvent) => {
      setCarouselSpeed(e.detail);
    };
    const handleLayoutChange = (e: CustomEvent) => {
      setCardLayoutStyle(e.detail);
    };
    const handleFavoritesLayoutChange = (e: CustomEvent) => {
      setFavoritesCardStyle(e.detail);
    };
    const handleItemsPerRowChange = (e: CustomEvent) => {
      setDesktopItemsPerRow(e.detail);
    };
    window.addEventListener('carouselSpeedChanged', handleSpeedChange as EventListener);
    window.addEventListener('cardLayoutStyleChanged', handleLayoutChange as EventListener);
    window.addEventListener('favoritesCardStyleChanged', handleFavoritesLayoutChange as EventListener);
    window.addEventListener('desktopItemsPerRowChanged', handleItemsPerRowChange as EventListener);
    return () => {
      window.removeEventListener('carouselSpeedChanged', handleSpeedChange as EventListener);
      window.removeEventListener('cardLayoutStyleChanged', handleLayoutChange as EventListener);
      window.removeEventListener('favoritesCardStyleChanged', handleFavoritesLayoutChange as EventListener);
      window.removeEventListener('desktopItemsPerRowChanged', handleItemsPerRowChange as EventListener);
    };
  }, []);
  
  const autoplayPlugin = Autoplay({
    delay: carouselSpeed,
    stopOnInteraction: true,
    stopOnMouseEnter: true,
  });
  
  // Calculate items per slide based on device - tablet shows 2x2 grid (4 items)
  const getItemsPerSlide = () => {
    if (isMobile) return 1;
    if (!isDesktop) return 4; // Tablet (between mobile and desktop) shows 2x2 grid
    return desktopItemsPerRow;
  };
  const itemsPerSlide = getItemsPerSlide();
  
  // Group products into slides - for tablet, ensure we always try to fill 4 items
  const slides: Product[][] = [];
  for (let i = 0; i < products.length; i += itemsPerSlide) {
    slides.push(products.slice(i, i + itemsPerSlide));
  }
  
  // Update current slide when API changes
  useEffect(() => {
    if (!api) return;
    
    setCurrent(api.selectedScrollSnap());
    
    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };
    
    api.on("select", handleSelect);
    
    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  if (products.length === 0) return null;

  // Helper function to check if a product is in user's favorites
  const isInFavorites = (product: Product) => {
    return userProducts.some(p => p.product_url === product.product_url);
  };

  return (
    <div className="space-y-4">
      {/* Header with title and expand button */}
      {(title || enableExpand) && (
        <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          {title && (
            <div className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <h2 className={`text-xl font-bold ${language === 'ar' ? 'text-right' : 'text-left'}`}>{title}</h2>
              <Badge variant="secondary" className="text-xs">
                {products.length}
              </Badge>
            </div>
          )}
          {enableExpand && isTabletOrAbove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? t('products.collapse') : t('products.expand')}
            </Button>
          )}
        </div>
      )}
      
      {isExpanded && isTabletOrAbove ? (
        // Grid view for expanded state
        <div className={`grid gap-4 grid-cols-2 ${!isTablet && desktopItemsPerRow === 3 && ((isFavoritesSection ? favoritesCardStyle : cardLayoutStyle) === 'classic') ? 'xl:grid-cols-3' : ''} ${!isTablet && desktopItemsPerRow === 3 && ((isFavoritesSection ? favoritesCardStyle : cardLayoutStyle) === 'compact') ? 'xl:grid-cols-4' : ''}`}>
          {products.map(product => (
            ((isFavoritesSection ? favoritesCardStyle : cardLayoutStyle) === 'classic') ? (
              <ProductCard
                key={product.id}
                product={product}
                onDelete={onDelete}
                onUpdate={onUpdate}
                onRefreshPrice={onRefreshPrice}
                onAddToMyProducts={onAddToMyProducts}
                onRemoveFromMyProducts={onRemoveFromMyProducts}
                userProductCount={userProductCount}
                isSelectionMode={isSelectionMode}
                isSelected={selectedProductIds.has(product.id)}
                onToggleSelect={onToggleSelect}
                isInFavorites={isInFavorites(product)}
                isFavoritesSection={isFavoritesSection}
              />
            ) : (
              <MobileProductCard
                key={product.id}
                product={product}
                onAddToMyProducts={onAddToMyProducts}
                onRemoveFromMyProducts={onRemoveFromMyProducts}
                onEdit={product.isKrolistProduct && onUpdate ? (p) => onUpdate(p.id, p) : undefined}
                onDelete={product.isKrolistProduct && onDelete ? (p) => onDelete(p.id) : undefined}
                userProductCount={userProductCount}
                isInFavorites={isInFavorites(product)}
                isFavoritesSection={isFavoritesSection}
              />
            )
          ))}
        </div>
      ) : (
        // Carousel view
        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: true,
              direction: language === 'ar' ? 'rtl' : 'ltr',
            }}
            plugins={[autoplayPlugin]}
            setApi={setApi}
            className="w-full"
          >
            <CarouselContent className={language === 'ar' ? '-mr-2 md:-mr-4' : '-ml-2 md:-ml-4'}>
              {slides.map((slide, slideIndex) => (
                <CarouselItem
                  key={slideIndex}
                  className={language === 'ar' ? 'pr-2 md:pr-4' : 'pl-2 md:pl-4'}
                >
                  <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} ${!isMobile && !isTablet && desktopItemsPerRow === 3 ? 'xl:grid-cols-3' : ''}`}>
                    {slide.map(product => (
                      ((isFavoritesSection ? favoritesCardStyle : cardLayoutStyle) === 'classic') ? (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onDelete={onDelete}
                          onUpdate={onUpdate}
                          onRefreshPrice={onRefreshPrice}
                          onAddToMyProducts={onAddToMyProducts}
                          onRemoveFromMyProducts={onRemoveFromMyProducts}
                          userProductCount={userProductCount}
                          isSelectionMode={isSelectionMode}
                          isSelected={selectedProductIds.has(product.id)}
                          onToggleSelect={onToggleSelect}
                          isInFavorites={isInFavorites(product)}
                          isFavoritesSection={isFavoritesSection}
                        />
                      ) : (
                        <MobileProductCard
                          key={product.id}
                          product={product}
                          onAddToMyProducts={onAddToMyProducts}
                          onRemoveFromMyProducts={onRemoveFromMyProducts}
                          onEdit={product.isKrolistProduct && onUpdate ? (p) => onUpdate(p.id, p) : undefined}
                          onDelete={product.isKrolistProduct && onDelete ? (p) => onDelete(p.id) : undefined}
                          userProductCount={userProductCount}
                          isInFavorites={isInFavorites(product)}
                          isFavoritesSection={isFavoritesSection}
                        />
                      )
                    ))}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Navigation arrows - desktop only, hidden on tablet */}
            {slides.length > 1 && isDesktop && (
              <>
                <Button
                  onClick={() => api?.scrollPrev()}
                  size="icon"
                  variant="ghost"
                  className={`absolute ${language === 'ar' ? '-right-12' : '-left-12'} top-0 bottom-0 h-full z-10 rounded-lg w-8 bg-muted/50 hover:bg-muted border border-border/50 transition-all`}
                >
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button
                  onClick={() => api?.scrollNext()}
                  size="icon"
                  variant="ghost"
                  className={`absolute ${language === 'ar' ? '-left-12' : '-right-12'} top-0 bottom-0 h-full z-10 rounded-lg w-8 bg-muted/50 hover:bg-muted border border-border/50 transition-all`}
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </>
            )}
          </Carousel>
          
          {/* Pagination dots */}
          {slides.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    current === index
                      ? 'bg-primary w-4'
                      : 'bg-muted-foreground/30 w-2'
                  }`}
                  onClick={() => api?.scrollTo(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
