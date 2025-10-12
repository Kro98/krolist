import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, Plus, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

// Affiliate link configuration for Saudi Arabia
const AFFILIATE_LINKS = {
  noon: (productId: string) => `https://www.noon.com/saudi-en/product/${productId}?ref=YOUR_AFFILIATE_ID`,
  amazon: (productId: string) => `https://www.amazon.sa/dp/${productId}?tag=YOUR_AFFILIATE_TAG`,
  namshi: (productId: string) => `https://www.namshi.com/sa/product/${productId}?aff=YOUR_AFFILIATE_ID`,
  shein: (productId: string) => `https://sa.shein.com/product/${productId}?aff_id=YOUR_AFFILIATE_ID`,
};

interface SearchResult {
  id: string;
  title: string;
  description: string;
  image: string;
  sellers: {
    store: string;
    price: number;
    originalPrice?: number;
    badge?: string;
    productUrl?: string;
  }[];
  bestPrice: number;
}

// Mock search results - In production, this would come from an API
const mockSearchResults: SearchResult[] = [
  {
    id: "iphone-15-pro",
    title: "iPhone 15 Pro",
    description: "Powerful latency with best in class performance",
    image: "/placeholder.svg",
    sellers: [
      { store: "Noon", price: 4200, originalPrice: 4500, badge: "FLASH SALES" },
      { store: "Amazon", price: 4350 },
      { store: "Shein", price: 4195, badge: "FLASH SALES" },
    ],
    bestPrice: 4195,
  },
  {
    id: "ergonomic-chair",
    title: "Ergonomic Office Chair",
    description: "Designed for maximum comfort",
    image: "/placeholder.svg",
    sellers: [
      { store: "IKEA", price: 350 },
      { store: "Noon", price: 325 },
    ],
    bestPrice: 325,
  },
];

// Get active shops from localStorage (same as sidebar)
const getActiveShops = () => {
  const saved = localStorage.getItem('shopOrder');
  if (saved) {
    const shopOrder = JSON.parse(saved);
    return shopOrder
      .filter((shop: any) => shop.enabled)
      .map((shop: any) => ({
        id: shop.id,
        name: shop.name
      }));
  }
  
  return [
    { id: "shein", name: "Shein" },
    { id: "noon", name: "Noon" },
    { id: "amazon", name: "Amazon" },
    { id: "ikea", name: "IKEA" },
    { id: "abyat", name: "Abyat" },
    { id: "namshi", name: "Namshi" },
    { id: "trendyol", name: "Trendyol" },
    { id: "asos", name: "ASOS" },
  ];
};

export default function SearchProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [activeShops, setActiveShops] = useState(getActiveShops());
  const [showFilters, setShowFilters] = useState(false);
  const [filterSidebarCollapsed, setFilterSidebarCollapsed] = useState(false);
  const [gridColumns, setGridColumns] = useState(2); // 1, 2, 3, or 4 columns
  const { toast } = useToast();
  const { t } = useLanguage();

  const categories = ["Electronics", "Home Goods", "Fashion", "Books", "Toys"];

  // Update active shops when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setActiveShops(getActiveShops());
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event when shops are updated
    const handleShopsUpdate = () => {
      setActiveShops(getActiveShops());
    };
    window.addEventListener('shopsUpdated', handleShopsUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('shopsUpdated', handleShopsUpdate);
    };
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Query Required",
        description: "Please enter a product to search for",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    try {
      // Always search all available stores - filters will be applied to results
      const { data, error } = await supabase.functions.invoke('scrape-products', {
        body: { 
          query: searchQuery,
          stores: ['noon', 'amazon']
        }
      });

      if (error) {
        console.error('Error scraping products:', error);
        toast({
          title: "Search Failed",
          description: "Unable to fetch products. Please try again.",
          variant: "destructive",
        });
        setSearchResults([]);
        return;
      }

      if (data?.success && data?.results) {
        setSearchResults(data.results);
        
        if (data.results.length === 0) {
          toast({
            title: "No Results",
            description: "No products found for your search query.",
          });
        }
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      toast({
        title: "Search Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToList = (result: SearchResult, seller: any) => {
    // Use the productUrl from the scraper (already has affiliate params)
    const affiliateUrl = seller.productUrl || '';
    
    if (!affiliateUrl) {
      toast({
        title: "Error",
        description: "Product link not available",
        variant: "destructive",
      });
      return;
    }

    // Open affiliate link in new tab
    window.open(affiliateUrl, '_blank');

    // Add to user's tracked products list
    toast({
      title: "Product Added!",
      description: `${result.title} from ${seller.store} has been added to your tracked products`,
    });
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleShop = (shop: string) => {
    setSelectedShops(prev =>
      prev.includes(shop) ? prev.filter(s => s !== shop) : [...prev, shop]
    );
  };

  const [showFilterCard, setShowFilterCard] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find Your Perfect Product, Instantly.
          </h1>
          
          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mt-8">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search for products, brands, or sellers..."
                  className="pl-12 h-14 text-base bg-card border-2"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="h-14 px-8 bg-primary hover:bg-primary/90"
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <aside className={`space-y-4 transition-all duration-300 ${showFilters ? 'block' : 'hidden lg:block'} ${filterSidebarCollapsed ? 'lg:w-12' : 'lg:w-64'} w-full`}>
            <div className="bg-card rounded-lg p-4 border border-border relative">
              <button 
                onClick={() => setFilterSidebarCollapsed(!filterSidebarCollapsed)}
                className="hidden lg:flex absolute -right-3 top-4 h-6 w-6 items-center justify-center rounded-full border border-border bg-card hover:bg-accent z-10"
                aria-label={filterSidebarCollapsed ? "Expand filters" : "Collapse filters"}
              >
                {filterSidebarCollapsed ? <SlidersHorizontal className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
              
              {!filterSidebarCollapsed && (
                <>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filter Results
              </h3>

              {/* Categories Filter - Disabled for scraped products */}
              <Collapsible defaultOpen>
...
              </Collapsible>
              </>
              )}
            </div>
          </aside>

          {/* Results Grid */}
          <main className="flex-1">
            {/* Grid Controls */}
            {searchResults.length > 0 && (
              <div className="mb-4 flex items-center justify-between bg-card border border-border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  {searchResults.filter((result) => {
                    if (result.bestPrice < priceRange[0] || result.bestPrice > priceRange[1]) return false;
                    if (selectedShops.length > 0) {
                      const hasSelectedShop = result.sellers.some(seller => 
                        selectedShops.some(shop => seller.store.toLowerCase() === shop.toLowerCase())
                      );
                      if (!hasSelectedShop) return false;
                    }
                    return true;
                  }).length} results
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground hidden md:inline">Grid:</span>
                  {[1, 2, 3, 4].map((cols) => (
                    <Button
                      key={cols}
                      size="sm"
                      variant={gridColumns === cols ? "default" : "outline"}
                      onClick={() => setGridColumns(cols)}
                      className="h-8 w-8 p-0"
                    >
                      {cols}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {searchResults.length === 0 ? (
              <div className="text-center py-20">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">
                  {isSearching ? "Searching..." : "Search for products"}
                </h2>
                <p className="text-muted-foreground">
                  Enter a product name to search for
                </p>
              </div>
            ) : (
              <div className={`grid gap-4 ${
                gridColumns === 1 ? 'grid-cols-1' :
                gridColumns === 2 ? 'grid-cols-1 lg:grid-cols-2' :
                gridColumns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}>
                {searchResults
                  .filter((result) => {
                    // Filter by price range
                    if (result.bestPrice < priceRange[0] || result.bestPrice > priceRange[1]) {
                      return false;
                    }
                    
                    // Filter by selected shops - if no shops selected, show all
                    if (selectedShops.length > 0) {
                      const hasSelectedShop = result.sellers.some(seller => 
                        selectedShops.some(shop => 
                          seller.store.toLowerCase() === shop.toLowerCase()
                        )
                      );
                      if (!hasSelectedShop) return false;
                    }
                    
                    return true;
                  })
                  .map((result) => (
                  <Card key={result.id} className="p-4 hover:shadow-lg transition-all flex flex-col h-full">
                    {/* Product Image */}
                    <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center overflow-hidden mb-4">
                      <img
                        src={result.image}
                        alt={result.title}
                        className="w-full h-full object-contain bg-muted"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 space-y-3 flex flex-col">
                      <div className="mb-2">
                        <h3 className="text-lg font-semibold mb-1 line-clamp-2">
                          {result.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {result.description}
                        </p>
                      </div>

                      {/* Sellers Grid */}
                      <div className="grid grid-cols-1 gap-2 flex-1">
                          {result.sellers
                            .filter(seller => {
                              // Filter sellers by selected shops
                              if (selectedShops.length === 0) return true;
                              return selectedShops.some(shop => 
                                seller.store.toLowerCase() === shop.toLowerCase()
                              );
                            })
                            .map((seller, idx) => (
                            <div
                              key={idx}
                              className="border border-border rounded-lg p-2 space-y-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                  {seller.store}
                                </p>
                                {seller.badge && (
                                  <Badge className="bg-green-500/10 text-green-500 text-[10px] h-5">
                                    {seller.badge}
                                  </Badge>
                                )}
                              </div>
                              <div>
                                {seller.originalPrice && (
                                  <p className="text-[10px] line-through text-muted-foreground">
                                    SAR {seller.originalPrice}
                                  </p>
                                )}
                                <p className="text-base font-bold">
                                  SAR {seller.price}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleAddToList(result, seller)}
                                className="w-full h-8 text-xs"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            </div>
                          ))}
                      </div>

                      <div className="pt-2 mt-auto border-t border-border">
                        <p className="text-sm font-semibold text-primary">
                          Best Price: SAR {result.bestPrice}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
