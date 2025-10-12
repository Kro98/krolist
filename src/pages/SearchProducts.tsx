import { useState } from "react";
import { Search, SlidersHorizontal, Plus } from "lucide-react";
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

export default function SearchProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const { toast } = useToast();
  const { t } = useLanguage();

  const categories = ["Electronics", "Home Goods", "Fashion", "Books", "Toys"];
  const shops = ["Noon", "Amazon", "Shein", "Namshi", "IKEA", "Abyat", "Trendyol", "ASOS"];

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
    
    // Simulate API call to search across Saudi stores
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In production, this would call your backend API that searches across
    // Noon, Amazon Saudi, Namshi, etc. using their APIs
    setSearchResults(mockSearchResults);
    setIsSearching(false);
  };

  const handleAddToList = (result: SearchResult, seller: any) => {
    // Generate affiliate link based on store
    const storeName = seller.store.toLowerCase();
    let affiliateUrl = "";
    
    if (storeName.includes("noon")) {
      affiliateUrl = AFFILIATE_LINKS.noon(result.id);
    } else if (storeName.includes("amazon")) {
      affiliateUrl = AFFILIATE_LINKS.amazon(result.id);
    } else if (storeName.includes("namshi")) {
      affiliateUrl = AFFILIATE_LINKS.namshi(result.id);
    } else if (storeName.includes("shein")) {
      affiliateUrl = AFFILIATE_LINKS.shein(result.id);
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
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 space-y-4">
            <div className="bg-card rounded-lg p-4 border border-border">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filter Results
              </h3>

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
                  {shops.map((shop) => (
                    <div key={shop} className="flex items-center space-x-2">
                      <Checkbox
                        id={`shop-${shop}`}
                        checked={selectedShops.includes(shop)}
                        onCheckedChange={() => toggleShop(shop)}
                      />
                      <Label
                        htmlFor={`shop-${shop}`}
                        className="text-sm cursor-pointer"
                      >
                        {shop}
                      </Label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
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
                          className="w-full h-full object-cover"
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
