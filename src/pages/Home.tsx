import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProductCarousel } from '@/components/ProductCarousel';
import { Product } from '@/components/ProductCard';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CategoryCollection {
  id: string;
  title: string;
  icon_url: string | null;
  display_order: number;
  is_active: boolean;
}

export default function Home() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryCollection[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryProducts(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('category_collections')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('krolist_products')
        .select('*')
        .eq('is_featured', true)
        .limit(10);

      if (error) throw error;

      const products: Product[] = (data || []).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        image_url: item.image_url,
        current_price: Number(item.current_price),
        original_price: Number(item.original_price),
        original_currency: item.original_currency,
        currency: item.currency,
        store: item.store,
        category: item.category || 'Featured',
        product_url: item.product_url,
        last_checked_at: item.last_checked_at,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      setFeaturedProducts(products);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    }
  };

  const fetchCategoryProducts = async (categoryId: string) => {
    if (categoryProducts[categoryId]) return; // Already fetched

    try {
      const { data: categoryProductIds, error: categoryError } = await supabase
        .from('category_products')
        .select('product_id')
        .eq('category_id', categoryId)
        .order('display_order', { ascending: true });

      if (categoryError) throw categoryError;

      const productIds = categoryProductIds?.map((cp) => cp.product_id) || [];

      if (productIds.length === 0) {
        setCategoryProducts((prev) => ({ ...prev, [categoryId]: [] }));
        return;
      }

      const { data: products, error: productsError } = await supabase
        .from('krolist_products')
        .select('*')
        .in('id', productIds);

      if (productsError) throw productsError;

      const mappedProducts: Product[] = (products || []).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        image_url: item.image_url,
        current_price: Number(item.current_price),
        original_price: Number(item.original_price),
        original_currency: item.original_currency,
        currency: item.currency,
        store: item.store,
        category: item.category || 'Category',
        product_url: item.product_url,
        last_checked_at: item.last_checked_at,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      setCategoryProducts((prev) => ({ ...prev, [categoryId]: mappedProducts }));
    } catch (error) {
      console.error('Error fetching category products:', error);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-xl p-8 border">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">{t('home.welcome')}</h1>
        </div>
        <p className="text-xl text-muted-foreground mb-6">
          {t('home.subtitle')}
        </p>
        <div className="flex gap-3">
          <Button size="lg" onClick={() => navigate('/search-products')} className="bg-gradient-primary">
            {t('home.startShopping')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/products')}>
            {t('home.myProducts')}
          </Button>
        </div>
      </div>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{t('home.featured')}</h2>
            <Button variant="ghost" onClick={() => navigate('/products')}>
              {t('home.viewAll')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <ProductCarousel title="" products={featuredProducts} />
        </div>
      )}

      {/* Category Collections */}
      {categories.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">{t('home.categories')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {categories.map((category) => (
              <Card
                key={category.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedCategory === category.id
                    ? 'border-primary border-2 shadow-md'
                    : 'border-border'
                }`}
                onClick={() => handleCategoryClick(category.id)}
              >
                <CardContent className="p-6 text-center">
                  {category.icon_url && (
                    <img
                      src={category.icon_url}
                      alt={category.title}
                      className="w-16 h-16 mx-auto mb-3 object-contain"
                    />
                  )}
                  <h3 className="font-semibold">{category.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Category Products Display */}
          {selectedCategory && categoryProducts[selectedCategory] && (
            <div className="mt-6">
              <h3 className="text-xl font-bold mb-4">
                {categories.find((c) => c.id === selectedCategory)?.title}
              </h3>
              {categoryProducts[selectedCategory].length > 0 ? (
                <ProductCarousel title="" products={categoryProducts[selectedCategory]} />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {t('home.noCategoryProducts')}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
