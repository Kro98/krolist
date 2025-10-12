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
      // Call the scrape-products edge function
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
          <aside className={`w-full lg:w-64 space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-card rounded-lg p-4 border border-border">
              <h3 className="font-semibold mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filter Results
                </div>
                <button 
                  onClick={() => setShowFilterCard(!showFilterCard)}
                  className="hidden lg:block p-1 hover:bg-sidebar-accent rounded-md transition-colors"
                  aria-label={showFilterCard ? "Hide filters" : "Show filters"}
                >
                  {showFilterCard ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </h3>

              {showFilterCard && (<>
              {/* Categories Filter */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="w-full text-left font-medium mb-2">
                  Categories
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${category}`}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => toggleCategory(category)}
                      />
                      <Label
                        htmlFor={`cat-${category}`}
                        className="text-sm cursor-pointer"
                      >
                        {category}
                      </Label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Price Range Filter */}
              <Collapsible defaultOpen className="mt-6">
                <CollapsibleTrigger className="w-full text-left font-medium mb-2">
                  Price Range
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4">
                  <Slider
                    min={0}
                    max={10000}
                    step={100}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>SAR {priceRange[0]}</span>
                    <span>Max: SAR {priceRange[1]}</span>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Shops Filter */}
              <Collapsible defaultOpen className="mt-6">
                <CollapsibleTrigger className="w-full text-left font-medium mb-2">
                  Shops
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2">
                  {activeShops.map((shop) => {
                    const isNoon = shop.id === 'noon';
                    const isShein = shop.id === 'shein';
                    
                    return (
                      <div key={shop.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={`shop-${shop.id}`}
                          checked={selectedShops.includes(shop.id)}
                          onCheckedChange={() => toggleShop(shop.id)}
                          className="mt-0.5"
                        />
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <Label
                            htmlFor={`shop-${shop.id}`}
                            className="text-sm cursor-pointer flex items-center gap-1 flex-wrap"
                          >
                            <span className="shrink-0">{shop.name}</span>
                            {isNoon && (
                              <>
                                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium rounded border border-emerald-500/30 shrink-0">
                                  KINGDOME
                                </span>
                                <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-700 dark:text-orange-400 text-[10px] font-medium rounded border border-orange-500/30 shrink-0">
                                  save 10 rial
                                </span>
                              </>
                            )}
                            {isShein && (
                              <>
                                <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[10px] font-medium rounded border border-blue-500/30 shrink-0">
                                  search for
                                </span>
                                <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-700 dark:text-purple-400 text-[10px] font-medium rounded border border-purple-500/30 shrink-0">
                                  R2M6A
                                </span>
                              </>
                            )}
                          </Label>
                        </div>
                      </div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
              </>)}
            </div>
          </aside>

          {/* Results Grid */}
          <main className="flex-1">
            {searchResults.length === 0 ? (
              <div className="text-center py-20">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">
                  {isSearching ? "Searching..." : "Search for products"}
                </h2>
                <p className="text-muted-foreground">
                  Enter a product name to search across all Saudi stores
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <Card key={result.id} className="p-6 hover:shadow-lg transition-all">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Product Image */}
                      <div className="w-full md:w-48 h-48 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                          src={result.image}
                          alt={result.title}
                          className="w-full h-full object-contain bg-muted"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">
                            {result.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {result.description}
                          </p>
                        </div>

                        {/* Sellers Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {result.sellers.map((seller, idx) => (
                            <div
                              key={idx}
                              className="border border-border rounded-lg p-3 space-y-2"
                            >
                              {seller.badge && (
                                <Badge className="bg-green-500/10 text-green-500 text-xs">
                                  {seller.badge}
                                </Badge>
                              )}
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  {seller.store}
                                </p>
                                {seller.originalPrice && (
                                  <p className="text-xs line-through text-muted-foreground">
                                    SAR {seller.originalPrice}
                                  </p>
                                )}
                                <p className="text-lg font-bold">
                                  SAR {seller.price}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleAddToList(result, seller)}
                                className="w-full"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add to List
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs"
                              >
                                Compare Sellers
                              </Button>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-border">
                          <p className="text-sm font-semibold text-primary">
                            Best Price: SAR {result.bestPrice}
                          </p>
                        </div>
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
