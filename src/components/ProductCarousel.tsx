import React, { useState, useEffect, useRef } from "react";
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
import { FavoriteCard } from "@/components/FavoriteCard";
import { MobileProductCard } from "@/components/MobileProductCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

// Single in-carousel ad component that fills the entire slide space
function CarouselAdSlide({ itemsPerSlide }: { itemsPerSlide: number }) {
  const adRef = useRef<HTMLModElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Small delay to ensure the container is rendered with proper dimensions
    const timer = setTimeout(() => {
      if (adRef.current && !adLoaded && containerRef.current) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setAdLoaded(true);
        } catch (e) {
          console.error('AdSense error:', e);
        }
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [adLoaded]);

  // Calculate aspect ratio based on items layout - match compact card dimensions
  const getAspectRatio = () => {
    if (itemsPerSlide === 1) return 'aspect-[3/4]'; // Single card
    if (itemsPerSlide === 2) return 'aspect-[6/4]'; // 2 cards side by side (wider)
    return 'aspect-[6/8]'; // 2x2 grid (square-ish)
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full ${getAspectRatio()} bg-card/50 border border-border/50 rounded-lg flex flex-col items-center justify-center backdrop-blur-sm overflow-hidden`}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client="ca-pub-2793689855806571"
        data-ad-slot="1996237166"
        data-ad-format="fluid"
        data-ad-layout-key="-6t+ed+2i-1n-4w"
      />
    </div>
  );
}

// In-feed ad component for carousel grid (PC and tablet) - same size as product cards
function InFeedAdCard() {
  const adRef = useRef<HTMLModElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (adRef.current && !adLoaded) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setAdLoaded(true);
        } catch (e) {
          console.error('AdSense error:', e);
        }
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [adLoaded]);

  return (
    <div className="w-full h-full min-h-[280px] bg-card/50 border border-border/50 rounded-lg flex flex-col items-center justify-center backdrop-blur-sm overflow-hidden">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client="ca-pub-2793689855806571"
        data-ad-slot="3691272849"
        data-ad-format="fluid"
        data-ad-layout-key="-6t+ed+2i-1n-4w"
      />
    </div>
  );
}

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
  // Favorites always uses classic style - no toggle
  const favoritesCardStyle = 'classic' as const;
  const [desktopItemsPerRow, setDesktopItemsPerRow] = useState<2 | 3>(() => {
    const saved = localStorage.getItem('desktopItemsPerRow');
    return saved === '2' ? 2 : 3;
  });
  const [mobileItemsPerSlide, setMobileItemsPerSlide] = useState<1 | 2 | 4>(() => {
    const saved = localStorage.getItem('mobileItemsPerSlide');
    if (saved === '2') return 2;
    if (saved === '4') return 4;
    return 1;
  });
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1279px)");
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const isLargeDesktop = useMediaQuery("(min-width: 1280px)");
  const isXLDesktop = useMediaQuery("(min-width: 1536px)");
  const isTabletOrAbove = useMediaQuery('(min-width: 768px)');
  const { t, language } = useLanguage();
  const [carouselAdsEnabled, setCarouselAdsEnabled] = useState(true);
  const [infeedAdFrequencyMobile, setInfeedAdFrequencyMobile] = useState(5);
  const [infeedAdFrequencyDesktop, setInfeedAdFrequencyDesktop] = useState(8);
  
  // Fetch carousel ads settings
  useEffect(() => {
    const fetchAdSettings = async () => {
      try {
        const { data } = await supabase
          .from('ad_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['carousel_ads_enabled', 'infeed_ad_frequency_mobile', 'infeed_ad_frequency_desktop']);
        
        if (data) {
          data.forEach((setting) => {
            if (setting.setting_key === 'carousel_ads_enabled') {
              setCarouselAdsEnabled(setting.setting_value === 'true');
            } else if (setting.setting_key === 'infeed_ad_frequency_mobile') {
              setInfeedAdFrequencyMobile(parseInt(setting.setting_value, 10) || 5);
            } else if (setting.setting_key === 'infeed_ad_frequency_desktop') {
              setInfeedAdFrequencyDesktop(parseInt(setting.setting_value, 10) || 8);
            }
          });
        }
      } catch (error) {
        console.error('Error fetching carousel ads settings:', error);
      }
    };
    
    fetchAdSettings();
    
    // Subscribe to changes in ad_settings table
    const channel = supabase
      .channel('carousel_ad_settings_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ad_settings' }, () => {
        fetchAdSettings();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Listen for speed changes and card layout style changes
  useEffect(() => {
    const handleSpeedChange = (e: CustomEvent) => {
      setCarouselSpeed(e.detail);
    };
    const handleLayoutChange = (e: CustomEvent) => {
      setCardLayoutStyle(e.detail);
    };
    // Favorites layout change listener removed - always uses classic
    const handleItemsPerRowChange = (e: CustomEvent) => {
      setDesktopItemsPerRow(e.detail);
    };
    const handleMobileItemsPerSlideChange = (e: CustomEvent) => {
      setMobileItemsPerSlide(e.detail);
    };
    window.addEventListener('carouselSpeedChanged', handleSpeedChange as EventListener);
    window.addEventListener('cardLayoutStyleChanged', handleLayoutChange as EventListener);
    // favoritesCardStyleChanged listener removed - always uses classic
    window.addEventListener('desktopItemsPerRowChanged', handleItemsPerRowChange as EventListener);
    window.addEventListener('mobileItemsPerSlideChanged', handleMobileItemsPerSlideChange as EventListener);
    return () => {
      window.removeEventListener('carouselSpeedChanged', handleSpeedChange as EventListener);
      window.removeEventListener('cardLayoutStyleChanged', handleLayoutChange as EventListener);
      // favoritesCardStyleChanged listener cleanup removed
      window.removeEventListener('desktopItemsPerRowChanged', handleItemsPerRowChange as EventListener);
      window.removeEventListener('mobileItemsPerSlideChanged', handleMobileItemsPerSlideChange as EventListener);
    };
  }, []);
  
  const autoplayPlugin = Autoplay({
    delay: carouselSpeed,
    stopOnInteraction: true,
    stopOnMouseEnter: true,
  });
  
  // Calculate items per slide based on device and layout style
  // Mobile compact mode respects user's mobileItemsPerSlide setting
  const getItemsPerSlide = () => {
    if (isMobile) {
      // Only apply mobile items per slide when using compact layout
      const currentStyle = isFavoritesSection ? favoritesCardStyle : cardLayoutStyle;
      if (currentStyle === 'compact') {
        return mobileItemsPerSlide;
      }
      return 1; // Classic layout always shows 1 per slide on mobile
    }
    if (!isDesktop) return 4; // Tablet (between mobile and desktop) shows 2x2 grid
    return desktopItemsPerRow;
  };
  const itemsPerSlide = getItemsPerSlide();
  
  // Check if we should show ads in carousel - never show ads in favorites section
  const currentStyle = isFavoritesSection ? favoritesCardStyle : cardLayoutStyle;
  // Mobile: show full-slide ads | PC/Tablet: show inline card-sized ads
  const shouldShowMobileAds = carouselAdsEnabled && isMobile && currentStyle === 'compact' && mobileItemsPerSlide >= 2 && !isFavoritesSection;
  const shouldShowDesktopInlineAds = carouselAdsEnabled && (isTablet || isDesktop) && !isExpanded && !isFavoritesSection;
  
  // For PC/tablet carousel: inject ad cards inline with products
  type ProductOrAd = { type: 'product'; product: Product } | { type: 'ad' };
  const productsWithAds: ProductOrAd[] = [];
  
  if (shouldShowDesktopInlineAds) {
    products.forEach((product, index) => {
      productsWithAds.push({ type: 'product', product });
      // Insert ad after every X products (configurable via admin settings)
      if ((index + 1) % infeedAdFrequencyDesktop === 0 && index < products.length - 1) {
        productsWithAds.push({ type: 'ad' });
      }
    });
  }
  
  // Group products into slides - for tablet, ensure we always try to fill 4 items
  // Insert ad slides for mobile compact view (configurable frequency)
  type SlideContent = { type: 'products'; products: Product[] } | { type: 'ad' } | { type: 'mixed'; items: ProductOrAd[] };
  const slidesWithAds: SlideContent[] = [];
  const productSlides: Product[][] = [];
  
  if (shouldShowDesktopInlineAds) {
    // For PC/tablet: group productsWithAds into slides
    for (let i = 0; i < productsWithAds.length; i += itemsPerSlide) {
      const slideItems = productsWithAds.slice(i, i + itemsPerSlide);
      slidesWithAds.push({ type: 'mixed', items: slideItems });
    }
  } else {
    // For mobile or when ads disabled: use original grouping
    for (let i = 0; i < products.length; i += itemsPerSlide) {
      productSlides.push(products.slice(i, i + itemsPerSlide));
    }
    
    // Insert ads based on configurable frequency for mobile
    productSlides.forEach((slide, index) => {
      slidesWithAds.push({ type: 'products', products: slide });
      // Add ad after every X slides (configurable via admin settings)
      if (shouldShowMobileAds && (index + 1) % infeedAdFrequencyMobile === 0 && index < productSlides.length - 1) {
        slidesWithAds.push({ type: 'ad' });
      }
    });
  }
  
  // Legacy slides array for pagination (just product slides count)
  const slides = productSlides;
  
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
        // Grid view for expanded state with in-feed ads
        <div className={`grid gap-4 grid-cols-2 ${!isTablet && desktopItemsPerRow === 3 ? 'xl:grid-cols-3' : ''}`}>
          {products.map((product, index) => (
            <React.Fragment key={product.id}>
              {isFavoritesSection ? (
                <FavoriteCard
                  product={product}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  onRemoveFromMyProducts={onRemoveFromMyProducts}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedProductIds.has(product.id)}
                  onToggleSelect={onToggleSelect}
                />
              ) : ((cardLayoutStyle) === 'classic') ? (
                <ProductCard
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
                  product={product}
                  onAddToMyProducts={onAddToMyProducts}
                  onRemoveFromMyProducts={onRemoveFromMyProducts}
                  onEdit={product.isKrolistProduct && onUpdate ? (p) => onUpdate(p.id, p) : undefined}
                  onDelete={product.isKrolistProduct && onDelete ? (p) => onDelete(p.id) : undefined}
                  userProductCount={userProductCount}
                  isInFavorites={isInFavorites(product)}
                  isFavoritesSection={isFavoritesSection}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      ) : (
        // Carousel view
        <div className="relative mx-12 md:mx-14">
          <Carousel
            opts={{
              align: "start",
              loop: true,
              direction: language === 'ar' ? 'rtl' : 'ltr',
              skipSnaps: false,
              duration: 25,
            }}
            plugins={[autoplayPlugin]}
            setApi={setApi}
            className="w-full"
          >
            <CarouselContent className="-ml-3">
              {slidesWithAds.map((slideContent, slideIndex) => (
                <CarouselItem
                  key={slideIndex}
                  className="pl-3"
                >
                  {slideContent.type === 'ad' ? (
                    // Ad slide - single container matching the slide size (mobile only)
                    <CarouselAdSlide itemsPerSlide={itemsPerSlide} />
                  ) : slideContent.type === 'mixed' ? (
                    // Mixed slide with products and inline ads (PC/tablet)
                    <div className={`grid gap-4 grid-cols-2 ${!isTablet && desktopItemsPerRow === 3 ? 'xl:grid-cols-3' : ''}`}>
                      {slideContent.items.map((item, itemIndex) => (
                        item.type === 'ad' ? (
                          <InFeedAdCard key={`ad-${itemIndex}`} />
                        ) : isFavoritesSection ? (
                          <FavoriteCard
                            key={item.product.id}
                            product={item.product}
                            onDelete={onDelete}
                            onUpdate={onUpdate}
                            onRemoveFromMyProducts={onRemoveFromMyProducts}
                            isSelectionMode={isSelectionMode}
                            isSelected={selectedProductIds.has(item.product.id)}
                            onToggleSelect={onToggleSelect}
                          />
                        ) : (cardLayoutStyle === 'classic') ? (
                          <ProductCard
                            key={item.product.id}
                            product={item.product}
                            onDelete={onDelete}
                            onUpdate={onUpdate}
                            onRefreshPrice={onRefreshPrice}
                            onAddToMyProducts={onAddToMyProducts}
                            onRemoveFromMyProducts={onRemoveFromMyProducts}
                            userProductCount={userProductCount}
                            isSelectionMode={isSelectionMode}
                            isSelected={selectedProductIds.has(item.product.id)}
                            onToggleSelect={onToggleSelect}
                            isInFavorites={isInFavorites(item.product)}
                            isFavoritesSection={isFavoritesSection}
                          />
                        ) : (
                          <MobileProductCard
                            key={item.product.id}
                            product={item.product}
                            onAddToMyProducts={onAddToMyProducts}
                            onRemoveFromMyProducts={onRemoveFromMyProducts}
                            onEdit={item.product.isKrolistProduct && onUpdate ? (p) => onUpdate(p.id, p) : undefined}
                            onDelete={item.product.isKrolistProduct && onDelete ? (p) => onDelete(p.id) : undefined}
                            userProductCount={userProductCount}
                            isInFavorites={isInFavorites(item.product)}
                            isFavoritesSection={isFavoritesSection}
                          />
                        )
                      ))}
                    </div>
                  ) : (
                    // Product slide (mobile/default)
                    <div className={`grid gap-4 ${isMobile && currentStyle === 'compact' && mobileItemsPerSlide >= 2 ? 'grid-cols-2' : isMobile ? 'grid-cols-1' : 'grid-cols-2'} ${!isMobile && !isTablet && desktopItemsPerRow === 3 ? 'xl:grid-cols-3' : ''}`}>
                      {slideContent.products.map(product => (
                        isFavoritesSection ? (
                          <FavoriteCard
                            key={product.id}
                            product={product}
                            onDelete={onDelete}
                            onUpdate={onUpdate}
                            onRemoveFromMyProducts={onRemoveFromMyProducts}
                            isSelectionMode={isSelectionMode}
                            isSelected={selectedProductIds.has(product.id)}
                            onToggleSelect={onToggleSelect}
                          />
                        ) : (cardLayoutStyle === 'classic') ? (
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
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Navigation arrows - desktop only, hidden on tablet */}
            {slidesWithAds.length > 1 && isDesktop && (
              <>
                <Button
                  onClick={() => api?.scrollPrev()}
                  size="icon"
                  variant="ghost"
                  className={`absolute ${language === 'ar' ? '-right-10 md:-right-12' : '-left-10 md:-left-12'} top-0 bottom-0 h-full z-10 rounded-lg w-8 bg-muted/50 hover:bg-muted border border-border/50 transition-all`}
                >
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button
                  onClick={() => api?.scrollNext()}
                  size="icon"
                  variant="ghost"
                  className={`absolute ${language === 'ar' ? '-left-10 md:-left-12' : '-right-10 md:-right-12'} top-0 bottom-0 h-full z-10 rounded-lg w-8 bg-muted/50 hover:bg-muted border border-border/50 transition-all`}
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </>
            )}
          </Carousel>
          
          {/* Pagination dots */}
          {slidesWithAds.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {slidesWithAds.map((_, index) => (
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
