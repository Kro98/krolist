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
    navigate(`/category/${categoryId}`, { state: { categoryTitle: title } });
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            onClick={() => handleCategoryClick(category.id, category.title)}
          >
            <div className="p-6 flex flex-col items-center justify-center gap-3">
              {category.icon_url ? (
                <div className="w-20 h-20 rounded-full border-2 border-primary overflow-hidden flex items-center justify-center bg-muted">
                  <img
                    src={category.icon_url}
                    alt={category.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-primary flex items-center justify-center bg-muted">
                  <Tag className="h-10 w-10 text-primary" />
                </div>
              )}
              <div className="text-center">
                <p className="font-semibold text-sm">{category.title}</p>
                {productCounts[category.id] > 0 && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {productCounts[category.id]} {t('products.items') || 'items'}
                  </Badge>
                )}
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
