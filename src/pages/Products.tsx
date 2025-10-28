import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard, type Product } from "@/components/ProductCard";
import { ProductCarousel } from "@/components/ProductCarousel";
import { Plus, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/errorHandler";
import { z } from "zod";

// Validation schema for product updates
const productUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  current_price: z.number().positive().optional(),
  currency: z.enum(['SAR', 'AED', 'USD', 'EUR', 'GBP']).optional(),
  store: z.string().min(1).max(100).optional(),
  category: z.string().max(100).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
}).strict();

export default function Products() {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [krolistProducts, setKrolistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      // Load user products
      const { data: userProducts, error: userError } = await supabase
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

      if (userError) throw userError;

      // Load Krolist curated products
      const { data: krolistData, error: krolistError } = await supabase
        .from('krolist_products')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false });

      if (krolistError) {
        console.warn('Could not load Krolist products:', krolistError);
      }

      // Mark Krolist products
      const markedKrolistProducts = (krolistData || []).map(p => ({
        ...p,
        isKrolistProduct: true,
        price_history: []  // Krolist products don't have history tracking
      }));

      setProducts(userProducts || []);
      setKrolistProducts(markedKrolistProducts);
    } catch (error) {
      toast.error(getSafeErrorMessage(error));
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
      toast.error(getSafeErrorMessage(error));
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Product>) => {
    try {
      // Validate updates before sending to database
      const validatedUpdates = productUpdateSchema.parse(updates);
      
      const { error } = await supabase
        .from('products')
        .update(validatedUpdates)
        .eq('id', id);

      if (error) throw error;

      setProducts(products.map(p => 
        p.id === id ? { ...p, ...validatedUpdates } : p
      ));
      toast.success('Product updated');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error('Invalid update data. Please check your inputs');
      } else {
        toast.error(getSafeErrorMessage(error));
      }
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
      toast.error(getSafeErrorMessage(error));
    }
  };

  // Filter both user products and Krolist products
  const filteredUserProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredKrolistProducts = krolistProducts.filter(product =>
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

      {(filteredUserProducts.length > 0 || filteredKrolistProducts.length > 0) ? (
        <div className="space-y-8">
          {/* Krolist Curated Products - Read Only */}
          {filteredKrolistProducts.length > 0 && (
            <ProductCarousel
              title="KROLIST SELECTIONS"
              products={filteredKrolistProducts}
            />
          )}

          {/* User Products Carousel */}
          {filteredUserProducts.length > 0 && (
            <ProductCarousel
              title={t('products.myProducts')}
              products={filteredUserProducts}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              onRefreshPrice={handleRefreshPrice}
            />
          )}
          
          {/* Store-based grouping for user products only */}
          {(() => {
            const productsByStore = filteredUserProducts.reduce((acc, product) => {
              if (!acc[product.store]) {
                acc[product.store] = [];
              }
              acc[product.store].push(product);
              return acc;
            }, {} as Record<string, Product[]>);
            
            const storeNames = Object.keys(productsByStore).filter(store => productsByStore[store].length >= 3);
            
            return storeNames.map(store => (
              <ProductCarousel
                key={store}
                title={`${t('products.krolistSelections')}: ${store.toUpperCase()}`}
                products={productsByStore[store]}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onRefreshPrice={handleRefreshPrice}
              />
            ));
          })()}
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