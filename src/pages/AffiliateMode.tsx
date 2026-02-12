import { useState, useEffect, useRef, useMemo } from "react";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink, ShoppingBag, Info, Newspaper, Sparkles, SlidersHorizontal, History } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/errorHandler";
import { FunnyLoadingText } from "@/components/FunnyLoadingText";
import { cn } from "@/lib/utils";
import krolistLogo from "@/assets/krolist-logo.png";
import { Link } from "react-router-dom";
import { replaceWithAffiliateLink } from "@/lib/affiliateLinks";
import { getAffiliateTag } from "@/config/stores";
import amazonIcon from "@/assets/shop-icons/amazon-icon.png";
import { AffiliateDock } from "@/components/affiliate/AffiliateDock";
import { AffiliateSettings } from "@/components/affiliate/AffiliateSettings";
import { AffiliateDonation } from "@/components/affiliate/AffiliateDonation";
import { AffiliateFilter, SortOption, StoreFilter } from "@/components/affiliate/AffiliateFilter";
import { AffiliateProductAd } from "@/components/affiliate/AffiliateProductAd";
import { AffiliateInfoPage } from "@/components/affiliate/AffiliateInfoPage";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSectionLocks } from "@/hooks/useSectionLocks";
import { PriceHistoryChart } from "@/components/article/PriceHistoryChart";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface AffiliateProduct {
  id: string;
  title: string;
  image_url: string | null;
  current_price: number;
  original_price: number;
  currency: string;
  store: string;
  product_url: string;
  created_at: string | null;
}

export default function AffiliateMode() {
  const { language } = useLanguage();
  const sectionLocks = useSectionLocks();
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Panel states
  const [showSettings, setShowSettings] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showInfoPage, setShowInfoPage] = useState(false);
  
  // Price history state
  const [priceHistoryProduct, setPriceHistoryProduct] = useState<AffiliateProduct | null>(null);
  
  // Filter & Sort state
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [storeFilter, setStoreFilter] = useState<StoreFilter>(null);
  const [manualGridOverride, setManualGridOverride] = useState<number | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Responsive breakpoints for auto grid
  const isXl = useMediaQuery("(min-width: 1280px)");
  const isLg = useMediaQuery("(min-width: 1024px)");
  const isMd = useMediaQuery("(min-width: 768px)");
  const isSm = useMediaQuery("(min-width: 640px)");

  // Auto-calculate products per row based on screen size
  const autoProductsPerRow = isXl ? 6 : isLg ? 5 : isMd ? 4 : isSm ? 3 : 2;
  const productsPerRow = manualGridOverride || autoProductsPerRow;

  const showAmazonBanner = localStorage.getItem('affiliateShowAmazonBanner') !== 'false';

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('krolist_products')
        .select('id, title, image_url, current_price, original_price, currency, store, product_url, created_at')
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

  // Get unique stores for filter
  const availableStores = useMemo(() => {
    const stores = [...new Set(products.map(p => p.store))];
    return stores.sort();
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.store.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStore = !storeFilter || product.store.toLowerCase() === storeFilter.toLowerCase();
      return matchesSearch && matchesStore;
    });

    // Sort
    switch (sortBy) {
      case 'price-low':
        result = [...result].sort((a, b) => a.current_price - b.current_price);
        break;
      case 'price-high':
        result = [...result].sort((a, b) => b.current_price - a.current_price);
        break;
      case 'discount':
        result = [...result].sort((a, b) => {
          const discountA = a.original_price > a.current_price 
            ? ((a.original_price - a.current_price) / a.original_price) * 100 
            : 0;
          const discountB = b.original_price > b.current_price 
            ? ((b.original_price - b.current_price) / b.original_price) * 100 
            : 0;
          return discountB - discountA;
        });
        break;
      case 'newest':
      default:
        break;
    }

    return result;
  }, [products, searchQuery, storeFilter, sortBy]);

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

  const handleSearchClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);
  };

  const handleGridChange = (cols: number) => {
    setManualGridOverride(cols);
  };

  const gridClass = cn(
    "grid gap-3",
    productsPerRow === 2 && "grid-cols-2",
    productsPerRow === 3 && "grid-cols-2 sm:grid-cols-3",
    productsPerRow === 4 && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
    productsPerRow === 5 && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
    productsPerRow === 6 && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
  );

  // Insert ads every N products
  const getProductsWithAds = () => {
    const AD_INTERVAL = 12;
    const items: (AffiliateProduct | 'ad')[] = [];
    
    filteredProducts.forEach((product, index) => {
      items.push(product);
      if ((index + 1) % AD_INTERVAL === 0 && index < filteredProducts.length - 1) {
        items.push('ad');
      }
    });
    
    return items;
  };

  const itemsWithAds = getProductsWithAds();
  const hasActiveFilters = sortBy !== 'newest' || storeFilter !== null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <FunnyLoadingText />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Settings Panel */}
      <AffiliateSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        onGridChange={handleGridChange}
        currentGrid={productsPerRow}
      />

      {/* Donation Panel */}
      <AffiliateDonation 
        isOpen={showDonation} 
        onClose={() => setShowDonation(false)} 
      />

      {/* Filter Panel */}
      <AffiliateFilter
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        sortBy={sortBy}
        onSortChange={setSortBy}
        storeFilter={storeFilter}
        onStoreFilterChange={setStoreFilter}
        availableStores={availableStores}
      />

      {/* Info Page */}
      <AffiliateInfoPage
        isOpen={showInfoPage}
        onClose={() => setShowInfoPage(false)}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 h-16 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm px-4">
        <div className="flex items-center gap-2">
          {!sectionLocks.articles && (
            <Link
              to="/articles"
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium",
                "bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              )}
            >
              <Newspaper className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'ar' ? 'مقالات' : 'Articles'}</span>
            </Link>
          )}
          {!sectionLocks.stickers && (
            <Link
              to="/stickers"
              className={cn(
                "group relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium",
                "bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="w-4 h-4 holographic-icon" />
              <span className="hidden sm:inline relative z-10">{language === 'ar' ? 'ملصقات' : 'Stickers'}</span>
            </Link>
          )}
        </div>
        <Link to="/" className="flex items-center gap-2">
          <img src={krolistLogo} alt="Krolist" className="h-8 object-contain cursor-pointer hover:opacity-80 transition-opacity" />
        </Link>
        <button
          onClick={() => setShowInfoPage(true)}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            "bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          )}
        >
          <Info className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 pb-28">
        {/* Search Bar with Filter Button */}
        <div className="relative mb-3 max-w-2xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder={language === 'ar' ? 'ابحث عن المنتجات...' : 'Search products...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-card border-border focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={() => setShowFilter(true)}
            className={cn(
              "h-11 px-3 rounded-lg border flex items-center gap-1.5 transition-all shrink-0",
              hasActiveFilters
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">{language === 'ar' ? 'تصفية' : 'Filter'}</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        </div>

        {/* Amazon Search Banner */}
        {searchQuery.trim() && showAmazonBanner && (
          <button
            onClick={() => {
              const affiliateTag = getAffiliateTag('amazon');
              const amazonSearchUrl = `https://www.amazon.sa/s?k=${encodeURIComponent(searchQuery)}&linkCode=sl2&tag=${affiliateTag}`;
              window.open(amazonSearchUrl, '_blank');
            }}
            className="group w-full max-w-2xl mx-auto mb-4 block"
          >
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#131921] via-[#232f3e] to-[#131921] border border-[#febd69]/20 p-3 sm:p-4 transition-all duration-300 hover:border-[#febd69]/50 hover:shadow-lg hover:shadow-[#febd69]/10">
              <div className="absolute inset-0 bg-gradient-to-r from-[#febd69]/5 via-transparent to-[#febd69]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <img src={amazonIcon} alt="Amazon" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-[#febd69] truncate">
                      {language === 'ar' ? 'ابحث على أمازون' : 'Find on Amazon'}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                      "{searchQuery}"
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-[#febd69] text-[#131921] text-xs sm:text-sm font-semibold transition-transform duration-200 group-hover:scale-105">
                  <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">{language === 'ar' ? 'بحث' : 'Search'}</span>
                  <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Products Count & Active Filters */}
        <div className="flex items-center justify-center gap-2 mb-4 text-sm text-muted-foreground">
          <span>
            {language === 'ar' 
              ? `${filteredProducts.length} منتج` 
              : `${filteredProducts.length} products`}
          </span>
          {storeFilter && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs capitalize">
              {storeFilter}
            </span>
          )}
        </div>

        {/* Products Grid with Ads */}
        <div className={gridClass}>
          {itemsWithAds.map((item, index) => {
            if (item === 'ad') {
              return (
                <div key={`ad-${index}`} className="col-span-full">
                  <AffiliateProductAd />
                </div>
              );
            }

            const product = item;
            const discount = getDiscount(product.original_price, product.current_price);
            
            return (
              <div
                key={product.id}
                className="group relative bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 hover:shadow-md transition-all duration-200"
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

                {/* Clickable Image */}
                <button
                  onClick={() => handleProductClick(product)}
                  className="w-full text-left"
                >
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
                </button>

                {/* Info */}
                <div className="p-2 space-y-1">
                  {/* Store Badge */}
                  <span className="inline-block px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] font-medium rounded uppercase">
                    {product.store}
                  </span>

                  {/* Title */}
                  <h3 
                    className="text-xs font-medium text-foreground line-clamp-2 leading-tight cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleProductClick(product)}
                  >
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

                  {/* Price History Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPriceHistoryProduct(product);
                    }}
                    className={cn(
                      "w-full flex items-center justify-center gap-1.5 mt-1 py-1.5 rounded-md text-[10px] font-medium",
                      "border border-border/50 text-muted-foreground",
                      "hover:bg-muted hover:text-foreground transition-colors"
                    )}
                  >
                    <History className="w-3 h-3" />
                    {language === 'ar' ? 'سجل الأسعار' : 'Price History'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {language === 'ar' ? 'لم يتم العثور على منتجات' : 'No products found'}
            </p>
          </div>
        )}
      </main>

      {/* Price History Modal */}
      <Dialog open={!!priceHistoryProduct} onOpenChange={(open) => !open && setPriceHistoryProduct(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          {priceHistoryProduct && (
            <PriceHistoryChart
              productId={priceHistoryProduct.id}
              productTitle={priceHistoryProduct.title}
              currentPrice={priceHistoryProduct.current_price}
              originalPrice={priceHistoryProduct.original_price}
              currency={priceHistoryProduct.currency}
              onClose={() => setPriceHistoryProduct(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Dock - without filter */}
      <AffiliateDock 
        onSearchClick={handleSearchClick}
        onHeartClick={() => setShowDonation(true)}
        onSettingsClick={() => setShowSettings(true)}
      />

      {/* Footer - simplified */}
      <Footer hideQuickLinks />
    </div>
  );
}
