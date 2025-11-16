import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [categories, setCategories] = useState<CategoryCollection[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('category_collections')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch product counts for each category
      const counts: Record<string, number> = {};
      for (const category of categoriesData || []) {
        const { count, error } = await supabase
          .from('category_products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id);

        if (!error) {
          counts[category.id] = count || 0;
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

  if (isLoading || categories.length === 0) {
    return null;
  }

  const itemsPerSlide = isMobile ? 3 : 6;
  const slides = [];
  for (let i = 0; i < categories.length; i += itemsPerSlide) {
    slides.push(categories.slice(i, i + itemsPerSlide));
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto hover:bg-transparent">
            <h2 className="text-2xl font-bold">{t('categories.title')}</h2>
            <ChevronRight className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        {!isMobile && (
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

      <CollapsibleContent>
        {isExpanded && !isMobile ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                onClick={() => handleCategoryClick(category.id, category.title)}
              >
                <div className="p-4 flex flex-col items-center justify-center gap-3">
                  {category.icon_url ? (
                    <div className="w-16 h-16 rounded-full border-2 border-primary overflow-hidden flex items-center justify-center bg-muted">
                      <img
                        src={category.icon_url}
                        alt={category.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center bg-muted">
                      <Tag className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="font-semibold text-sm line-clamp-2">{category.title}</p>
                    {productCounts[category.id] > 0 && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {productCounts[category.id]} {t('categories.items')}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent>
              {slides.map((slideCategories, slideIndex) => (
                <CarouselItem key={slideIndex}>
                  <div className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-6'} gap-4`}>
                    {slideCategories.map((category) => (
                      <Card
                        key={category.id}
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                        onClick={() => handleCategoryClick(category.id, category.title)}
                      >
                        <div className="p-4 flex flex-col items-center justify-center gap-3">
                          {category.icon_url ? (
                            <div className="w-16 h-16 rounded-full border-2 border-primary overflow-hidden flex items-center justify-center bg-muted">
                              <img
                                src={category.icon_url}
                                alt={category.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center bg-muted">
                              <Tag className="h-8 w-8 text-primary" />
                            </div>
                          )}
                          <div className="text-center">
                            <p className="font-semibold text-sm line-clamp-2">{category.title}</p>
                            {productCounts[category.id] > 0 && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {productCounts[category.id]} {t('categories.items')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
