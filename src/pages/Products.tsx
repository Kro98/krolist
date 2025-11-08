import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard, type Product } from "@/components/ProductCard";
import { ProductCarousel } from "@/components/ProductCarousel";
import { Plus, Search, Filter, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/errorHandler";
import { z } from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

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
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<{
    canRefresh: boolean;
    nextRefreshDate: string | null;
    remainingRefreshes: number;
  }>({ canRefresh: true, nextRefreshDate: null, remainingRefreshes: 1 });

  const categories = [
    'Electronics', 'Accessories', 'Clothes', 'Shoes', 
    'Watches', 'Home and Kitchen', 'Care products', 
    'Pet products', 'Furniture'
  ];

  const stores = Array.from(new Set([...products.map(p => p.store), ...krolistProducts.map(p => p.store)])).sort();

  useEffect(() => {
    loadProducts();
    checkRefreshStatus();
  }, []);

  const checkRefreshStatus = async () => {
    try {
      const now = new Date();
      const currentDayOfWeek = now.getDay();
      const daysToSunday = currentDayOfWeek === 0 ? 0 : -currentDayOfWeek;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + daysToSunday);
      weekStart.setHours(0, 0, 0, 0);
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const { data: refreshLog } = await supabase
        .from('user_refresh_logs')
        .select('*')
        .eq('week_start', weekStartStr)
        .maybeSingle();

      const nextSunday = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      const currentCount = refreshLog?.refresh_count || 0;
      
      if (currentCount >= 1) {
        setRefreshStatus({
          canRefresh: false,
          nextRefreshDate: nextSunday.toISOString(),
          remainingRefreshes: 0
        });
      } else {
        setRefreshStatus({
          canRefresh: true,
          nextRefreshDate: null,
          remainingRefreshes: 1
        });
      }
    } catch (error) {
      console.error('Error checking refresh status:', error);
    }
  };

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

  const handleRefreshAllPrices = async () => {
    if (!refreshStatus.canRefresh) {
      const nextDate = refreshStatus.nextRefreshDate 
        ? new Date(refreshStatus.nextRefreshDate).toLocaleDateString() 
        : 'next Sunday';
      toast.error(`Weekly refresh limit reached. Next refresh available on ${nextDate}`);
      return;
    }

    setIsRefreshingAll(true);
    try {
      const { data, error } = await supabase.functions.invoke('user-refresh-prices');
      
      if (error) throw error;
      
      if (data.error) {
        toast.error(data.message || 'Refresh limit reached');
        setRefreshStatus({
          canRefresh: false,
          nextRefreshDate: data.nextRefreshDate,
          remainingRefreshes: 0
        });
      } else {
        toast.success(`Refreshed ${data.updated} of ${data.checked} products`);
        await loadProducts();
        await checkRefreshStatus();
      }
    } catch (error) {
      toast.error(getSafeErrorMessage(error));
    } finally {
      setIsRefreshingAll(false);
    }
  };

  const handleAddToMyProducts = async (product: Product) => {
    try {
      // Check current product count
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (count && count >= 24) {
        toast.error('You have reached the maximum of 24 products');
        return;
      }

      // Check if product already exists
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('product_url', product.product_url)
        .eq('is_active', true)
        .maybeSingle();

      if (existing) {
        toast.info('This product is already in your list');
        return;
      }

      // Add product
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const { error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          title: product.title,
          description: product.description,
          image_url: product.image_url,
          category: product.category,
          store: product.store,
          product_url: product.product_url,
          current_price: product.current_price,
          original_price: product.original_price,
          original_currency: product.original_currency,
          currency: product.currency,
        });

      if (error) throw error;

      toast.success('Product added to your list!');
      await loadProducts();
    } catch (error) {
      toast.error(getSafeErrorMessage(error));
    }
  };

  // Filter both user products and Krolist products
  const filteredUserProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategories.length === 0 || (product.category && selectedCategories.includes(product.category));
    const matchesStore = selectedStores.length === 0 || selectedStores.includes(product.store);
    
    return matchesSearch && matchesCategory && matchesStore;
  });

  const filteredKrolistProducts = krolistProducts.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategories.length === 0 || (product.category && selectedCategories.includes(product.category));
    const matchesStore = selectedStores.length === 0 || selectedStores.includes(product.store);
    
    return matchesSearch && matchesCategory && matchesStore;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('products.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-card border-border focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefreshAllPrices}
          disabled={!refreshStatus.canRefresh || isRefreshingAll}
          className="h-10 w-10 flex-shrink-0 border-border hover:bg-accent hover:border-primary/50 transition-all bg-primary text-primary-foreground hover:bg-primary/90"
          title={refreshStatus.canRefresh ? `Refresh all products (${refreshStatus.remainingRefreshes} left)` : `Next refresh: ${refreshStatus.nextRefreshDate ? new Date(refreshStatus.nextRefreshDate).toLocaleDateString() : 'N/A'}`}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshingAll ? 'animate-spin' : ''}`} />
        </Button>
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0 border-border hover:bg-accent hover:border-primary/50 transition-all">
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-popover z-50" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">{t('filters.title')}</h4>
              </div>
              
              <Separator />

              <div className="space-y-2">
                <Label>{t('filters.categories')}</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map((cat) => (
                    <div key={cat} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${cat}`}
                        checked={selectedCategories.includes(cat)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCategories([...selectedCategories, cat]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(c => c !== cat));
                          }
                        }}
                      />
                      <label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer">
                        {cat}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Stores</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {stores.map((store) => (
                    <div key={store} className="flex items-center space-x-2">
                      <Checkbox
                        id={`store-${store}`}
                        checked={selectedStores.includes(store)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStores([...selectedStores, store]);
                          } else {
                            setSelectedStores(selectedStores.filter(s => s !== store));
                          }
                        }}
                      />
                      <label htmlFor={`store-${store}`} className="text-sm cursor-pointer">
                        {store}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setSelectedCategories([]);
                  setSelectedStores([]);
                }}
              >
                {t('filters.clearAll')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {(filteredUserProducts.length > 0 || filteredKrolistProducts.length > 0) ? (
        <div className="space-y-8 animate-fade-in">
          {/* User Products Carousel - Show first */}
          {filteredUserProducts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{t('products.myProducts')}</h2>
                {!refreshStatus.canRefresh && refreshStatus.nextRefreshDate && (
                  <p className="text-sm text-muted-foreground">
                    Next refresh: {new Date(refreshStatus.nextRefreshDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <ProductCarousel
                title=""
                products={filteredUserProducts}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            </div>
          )}

          {/* Krolist Featured Products - Read Only with Add Button */}
          {filteredKrolistProducts.length > 0 && (
            <ProductCarousel
              title={t('products.featuredProducts') || 'Featured Products'}
              products={filteredKrolistProducts}
              onAddToMyProducts={handleAddToMyProducts}
              userProductCount={products.length}
            />
          )}
        </div>
      ) : searchQuery ? (
        <Card className="shadow-card border-border animate-fade-in">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">{t('products.noResults')}</CardTitle>
            <CardDescription className="text-base">{t('products.noResultsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button 
              variant="outline" 
              onClick={() => setSearchQuery("")}
              className="border-border hover:bg-accent hover:border-primary/50 transition-all"
            >
              Clear Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card border-border animate-fade-in max-w-2xl mx-auto">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">{t('products.noProducts')}</CardTitle>
            <CardDescription className="text-base">{t('products.startTracking')}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <div className="flex gap-3 justify-center flex-wrap">
              <NavLink to="/search-products">
                <Button className="bg-gradient-primary hover:shadow-hover transition-all duration-300 h-11 px-6">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('products.searchProducts')}
                </Button>
              </NavLink>
              <NavLink to="/add-product">
                <Button variant="outline" className="border-border hover:bg-accent hover:border-primary/50 transition-all duration-300 h-11 px-6">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('products.manualEntry')}
                </Button>
              </NavLink>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}