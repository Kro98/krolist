import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import { Plus, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  store: string;
  product_url: string;
  current_price: number;
  currency: string;
  created_at: string;
  updated_at: string;
  last_checked_at: string;
  price_history?: Array<{
    price: number;
    scraped_at: string;
  }>;
}

export default function Products() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          price_history (
            price,
            scraped_at
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== id));
      toast.success('Product removed from tracking');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Product>) => {
    try {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setProducts(products.map(p => 
        p.id === id ? { ...p, ...updates } : p
      ));
      toast.success('Product updated');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const handleRefreshPrice = async (id: string) => {
    try {
      toast.info('Checking price...');
      
      await supabase.functions.invoke('check-prices', {
        body: { productId: id }
      });

      await loadProducts();
      toast.success('Price updated');
    } catch (error) {
      console.error('Error refreshing price:', error);
      toast.error('Failed to refresh price');
    }
  };

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('products.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-border"
        />
      </div>

      {filteredProducts.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold">{t('nav.products')}</h2>
            <span className="text-sm text-muted-foreground">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onRefreshPrice={handleRefreshPrice}
              />
            ))}
          </div>
        </div>
      ) : searchQuery ? (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>{t('products.noResults')}</CardTitle>
            <CardDescription>{t('products.noResultsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              variant="outline" 
              onClick={() => setSearchQuery("")}
              className="border-border hover:bg-accent"
            >
              Clear Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>{t('products.noProducts')}</CardTitle>
            <CardDescription>{t('products.startTracking')}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <NavLink to="/search-products">
              <Button className="bg-gradient-primary hover:shadow-hover transition-all duration-200">
                <Plus className="h-4 w-4 mr-2" />
                Search Products
              </Button>
            </NavLink>
          </CardContent>
        </Card>
      )}
    </div>
  );
}