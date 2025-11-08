import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { ProductCard, type Product } from "@/components/ProductCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductCarouselProps {
  title: string;
  products: Product[];
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Product>) => void;
  onRefreshPrice?: (id: string) => void;
  onAddToMyProducts?: (product: Product) => void;
  userProductCount?: number;
}

export function ProductCarousel({
  title,
  products,
  onDelete,
  onUpdate,
  onRefreshPrice,
  onAddToMyProducts,
  userProductCount = 0
}: ProductCarouselProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1024px)");
  const { t, language } = useLanguage();
  
  // Calculate items per slide based on device
  const itemsPerSlide = isMobile ? 1 : isTablet ? 2 : 3;
  
  // Group products into slides
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

  return (
    <div className="space-y-4">
      {/* Header with title and expand button (only show if title is provided) */}
      {title && (
        <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <h2 className={`text-xl font-bold ${language === 'ar' ? 'text-right' : 'text-left'}`}>{title}</h2>
          {!isMobile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? t('products.collapse') : t('products.expand')}
            </Button>
          )}
        </div>
      )}
      
      {isExpanded && !isMobile ? (
        // Grid view for expanded state
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onRefreshPrice={onRefreshPrice}
              onAddToMyProducts={onAddToMyProducts}
              userProductCount={userProductCount}
            />
          ))}
        </div>
      ) : (
        // Carousel view
        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: false,
              direction: language === 'ar' ? 'rtl' : 'ltr',
            }}
            setApi={setApi}
            className="w-full"
          >
            <CarouselContent className={language === 'ar' ? '-mr-2 md:-mr-4' : '-ml-2 md:-ml-4'}>
              {slides.map((slide, slideIndex) => (
                <CarouselItem
                  key={slideIndex}
                  className={language === 'ar' ? 'pr-2 md:pr-4' : 'pl-2 md:pl-4'}
                >
                  <div className={`grid gap-4 ${
                    isMobile ? 'grid-cols-1' : 
                    isTablet ? 'grid-cols-2' : 
                    'grid-cols-3'
                  }`}>
                    {slide.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onDelete={onDelete}
                        onUpdate={onUpdate}
                        onRefreshPrice={onRefreshPrice}
                        onAddToMyProducts={onAddToMyProducts}
                        userProductCount={userProductCount}
                      />
                    ))}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Navigation arrows on opposite sides */}
            {slides.length > 1 && !isMobile && (
              <>
                <Button
                  onClick={() => api?.scrollPrev()}
                  size="icon"
                  className={`absolute ${language === 'ar' ? 'right-2 lg:-right-16' : 'left-2 lg:-left-16'} top-1/2 -translate-y-1/2 z-10 rounded-full w-10 h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  onClick={() => api?.scrollNext()}
                  size="icon"
                  className={`absolute ${language === 'ar' ? 'left-2 lg:-left-16' : 'right-2 lg:-right-16'} top-1/2 -translate-y-1/2 z-10 rounded-full w-10 h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all`}
                >
                  <ChevronRight className="h-5 w-5" />
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
