import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package } from 'lucide-react';
import { FunnyLoadingText } from '@/components/FunnyLoadingText';

interface Product {
  id: string;
  title: string;
  current_price: number;
  original_price: number;
  currency: string;
  original_currency: string;
  store: string;
  image_url: string | null;
  product_url: string;
  category: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  last_checked_at: string;
}

export default function CategoryProducts() {
  const { categoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const categoryTitle = location.state?.categoryTitle || 'Category';

  useEffect(() => {
    if (categoryId) {
      fetchCategoryProducts();
    }
  }, [categoryId]);

  const fetchCategoryProducts = async () => {
    try {
      // First get the product IDs for this category
      const { data: categoryProducts, error: categoryError } = await supabase
        .from('category_products')
        .select('product_id')
        .eq('category_id', categoryId)
        .order('display_order', { ascending: true });

      if (categoryError) throw categoryError;

      if (!categoryProducts || categoryProducts.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      const productIds = categoryProducts.map(cp => cp.product_id);

      // Then fetch the actual products
      const { data: productsData, error: productsError } = await supabase
        .from('krolist_products')
        .select('*')
        .in('id', productIds);

      if (productsError) throw productsError;
      
      // Map to include last_checked_at
      const mappedProducts = (productsData || []).map(p => ({
        ...p,
        last_checked_at: p.last_checked_at || p.updated_at
      }));
      
      setProducts(mappedProducts);
    } catch (error: any) {
      console.error('Error fetching category products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FunnyLoadingText />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/categories')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back') || 'Back to Categories'}
        </Button>
        <h1 className="text-3xl font-bold mb-2">{categoryTitle}</h1>
        <p className="text-muted-foreground">
          {products.length} {products.length === 1 ? 'product' : 'products'}
        </p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                isKrolistProduct: true,
                youtube_url: null
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>{t('categories.noProducts') || 'No products in this category yet'}</p>
        </div>
      )}
    </div>
  );
}
