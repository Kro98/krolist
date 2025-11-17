import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';

interface CategoryCollection {
  id: string;
  title: string;
  icon_url: string | null;
  display_order: number;
  is_active: boolean;
}

export default function CategoryTags() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryCollection[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

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
    // Category clicks are now disabled - categories show on /categories page only
    return;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('categories.title') || 'Categories'}</h1>
        <p className="text-muted-foreground">
          {t('categories.subtitle') || 'Browse products by category'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="cursor-pointer group overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
            onClick={() => handleCategoryClick(category.id, category.title)}
          >
            <div className="relative h-[240px] md:h-[260px] lg:h-[280px] overflow-hidden">
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
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Tag className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>{t('categories.empty') || 'No categories available yet'}</p>
        </div>
      )}
    </div>
  );
}
