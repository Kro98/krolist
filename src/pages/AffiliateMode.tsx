import { useState, useEffect } from "react";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink, Grid2X2, Grid3X3, LayoutGrid } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/errorHandler";
import { FunnyLoadingText } from "@/components/FunnyLoadingText";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import krolistLogo from "@/assets/krolist-logo.png";
import { Link } from "react-router-dom";
import { replaceWithAffiliateLink } from "@/lib/affiliateLinks";

interface AffiliateProduct {
  id: string;
  title: string;
  image_url: string | null;
  current_price: number;
  original_price: number;
  currency: string;
  store: string;
  product_url: string;
}

export default function AffiliateMode() {
  const { language } = useLanguage();
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [productsPerRow, setProductsPerRow] = useState(4);

  // Load settings from localStorage
  useEffect(() => {
    const savedPerRow = localStorage.getItem('affiliateProductsPerRow');
    if (savedPerRow) {
      setProductsPerRow(parseInt(savedPerRow, 10));
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('krolist_products')
        .select('id, title, image_url, current_price, original_price, currency, store, product_url')
        .eq('is_featured', true)
        .eq('availability_status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast.error(getSafeErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.store.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleProductClick = (product: AffiliateProduct) => {
    const affiliateUrl = replaceWithAffiliateLink(product.product_url);
    window.open(affiliateUrl, '_blank');
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price.toFixed(2)} ${currency}`;
  };

  const getDiscount = (original: number, current: number) => {
    if (original <= current) return null;
    return Math.round(((original - current) / original) * 100);
  };

  const gridClass = cn(
    "grid gap-3",
    productsPerRow === 2 && "grid-cols-2",
    productsPerRow === 3 && "grid-cols-2 sm:grid-cols-3",
    productsPerRow === 4 && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
    productsPerRow === 5 && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
    productsPerRow === 6 && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <FunnyLoadingText />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm px-4">
        <Link to="/products" className="flex items-center gap-2">
          <img src={krolistLogo} alt="Krolist" className="h-8 object-contain cursor-pointer hover:opacity-80 transition-opacity" />
        </Link>
        
        {/* Grid Size Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant={productsPerRow === 3 ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setProductsPerRow(3);
              localStorage.setItem('affiliateProductsPerRow', '3');
            }}
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button
            variant={productsPerRow === 4 ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setProductsPerRow(4);
              localStorage.setItem('affiliateProductsPerRow', '4');
            }}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={productsPerRow === 5 ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setProductsPerRow(5);
              localStorage.setItem('affiliateProductsPerRow', '5');
            }}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4">
        {/* Search Bar */}
        <div className="relative mb-4 max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={language === 'ar' ? 'ابحث عن المنتجات...' : 'Search products...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-card border-border focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Products Count */}
        <p className="text-sm text-muted-foreground text-center mb-4">
          {language === 'ar' 
            ? `${filteredProducts.length} منتج` 
            : `${filteredProducts.length} products`}
        </p>

        {/* Products Grid */}
        <div className={gridClass}>
          {filteredProducts.map((product) => {
            const discount = getDiscount(product.original_price, product.current_price);
            
            return (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="group relative bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 hover:shadow-md transition-all duration-200 text-left"
              >
                {/* Discount Badge */}
                {discount && (
                  <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 bg-destructive text-destructive-foreground text-xs font-bold rounded">
                    -{discount}%
                  </div>
                )}

                {/* External Link Icon */}
                <div className="absolute top-2 right-2 z-10 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </div>

                {/* Image */}
                <div className="aspect-square bg-muted overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <span className="text-xs">{language === 'ar' ? 'لا صورة' : 'No image'}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2 space-y-1">
                  {/* Store Badge */}
                  <span className="inline-block px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] font-medium rounded uppercase">
                    {product.store}
                  </span>

                  {/* Title */}
                  <h3 className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
                    {product.title}
                  </h3>

                  {/* Price */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-primary">
                      {formatPrice(product.current_price, product.currency)}
                    </span>
                    {discount && (
                      <span className="text-[10px] text-muted-foreground line-through">
                        {formatPrice(product.original_price, product.currency)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* No Results */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {language === 'ar' ? 'لم يتم العثور على منتجات' : 'No products found'}
            </p>
            {searchQuery && (
              <Button
                variant="ghost"
                className="mt-2"
                onClick={() => setSearchQuery("")}
              >
                {language === 'ar' ? 'مسح البحث' : 'Clear search'}
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Footer - simplified */}
      <Footer hideQuickLinks />
    </div>
  );
}
