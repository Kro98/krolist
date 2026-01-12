import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMediaQuery } from '@/hooks/use-media-query';
import Autoplay from "embla-carousel-autoplay";

interface CategoryCollection {
  id: string;
  title: string;
  icon_url: string | null;
  display_order: number;
  is_active: boolean;
}

export function CategoriesCarousel() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1279px)");
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const [categories, setCategories] = useState<CategoryCollection[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [carouselSpeed, setCarouselSpeed] = useState(() => {
    const saved = localStorage.getItem('carouselSpeed');
    return saved ? parseInt(saved) : 3000;
  });
  
  // Listen for speed changes
  useEffect(() => {
    const handleSpeedChange = (e: CustomEvent) => {
      setCarouselSpeed(e.detail);
    };
    window.addEventListener('carouselSpeedChanged', handleSpeedChange as EventListener);
    return () => window.removeEventListener('carouselSpeedChanged', handleSpeedChange as EventListener);
  }, []);
  
  const autoplayPlugin = useRef(
    Autoplay({ delay: carouselSpeed, stopOnInteraction: true })
  );
  
  // Update autoplay delay when speed changes
  useEffect(() => {
    if (autoplayPlugin.current) {
      autoplayPlugin.current = Autoplay({ delay: carouselSpeed, stopOnInteraction: true });
    }
  }, [carouselSpeed]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Fetch categories and product counts in parallel
      const [categoriesResult, countsResult] = await Promise.all([
        supabase
          .from('category_collections')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('category_products')
          .select('category_id')
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      setCategories(categoriesResult.data || []);

      // Count products per category from the single query result
      const counts: Record<string, number> = {};
      if (countsResult.data) {
        for (const item of countsResult.data) {
          counts[item.category_id] = (counts[item.category_id] || 0) + 1;
        }
      }
      setProductCounts(counts);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: string, title: string) => {
    navigate(`/category/${categoryId}`, { state: { categoryTitle: title } });
  };

  // Skeleton loading component
  const renderSkeletonCard = (index: number) => (
    <Card key={`skeleton-${index}`} className="overflow-hidden">
      <div className="relative h-[280px] sm:h-[260px] md:h-[260px] lg:h-[280px]">
        <Skeleton className="absolute inset-0 w-full h-full" />
        <div className="relative h-full flex flex-col justify-between p-4 md:p-6">
          <div className="self-start">
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div>
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-32" />
          {isTablet && <Skeleton className="h-8 w-20" />}
        </div>
        <Carousel opts={{ align: "start" }} className="w-full">
          <CarouselContent>
            {[1, 2, 3].map((index) => (
              <CarouselItem key={index} className="!basis-full sm:!basis-1/2 md:!basis-1/2 lg:!basis-1/3">
                {renderSkeletonCard(index)}
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  const renderCategoryCard = (category: CategoryCollection) => (
    <Card
      key={category.id}
      className="cursor-pointer group overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
      onClick={() => handleCategoryClick(category.id, category.title)}
    >
      {/* Increased mobile height to compensate for global zoom */}
      <div className="relative h-[280px] sm:h-[260px] md:h-[260px] lg:h-[280px] overflow-hidden">
        {category.icon_url ? (
          <>
            {/* Background Image */}
            <img 
              src={category.icon_url} 
              alt={category.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          </>
        ) : (
          <>
            {/* Fallback Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Tag className="w-20 h-20 text-white/40" />
            </div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          </>
        )}
        
        {/* Content Layer */}
        <div className="relative h-full flex flex-col justify-between p-4 md:p-6">
          {/* Top: Item Count Badge */}
          <div className="self-start">
            <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 font-semibold">
              {productCounts[category.id] || 0} {t('categories.items')}
            </Badge>
          </div>
          
          {/* Bottom: Category Title */}
          <div>
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
              {category.title}
            </h3>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 
          className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors"
          onClick={() => navigate('/categories')}
        >
          {t('categories.title')}
        </h2>
        {isTablet && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm"
          >
            {isExpanded ? t('products.collapse') : t('categories.viewAll')}
          </Button>
        )}
      </div>

      {isExpanded && isTablet ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => renderCategoryCard(category))}
        </div>
      ) : (
        <Carousel 
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[autoplayPlugin.current]}
          className="w-full"
        >
          <CarouselContent>
            {categories.map((category) => (
              <CarouselItem 
                key={category.id}
                className="!basis-full sm:!basis-1/2 md:!basis-1/2 lg:!basis-1/3"
              >
                {renderCategoryCard(category)}
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      )}
    </div>
  );
}
