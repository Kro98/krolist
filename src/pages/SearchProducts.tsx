import { useState, useEffect } from "react";
import { Search, Plus, LayoutGrid, Clock, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

export default function SearchProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [gridColumns, setGridColumns] = useState(2);
  const [searchesRemaining, setSearchesRemaining] = useState<number>(5);
  const [resetAt, setResetAt] = useState<string>("");
  const [lastSearchTime, setLastSearchTime] = useState<number>(0);
  const { t } = useLanguage();
  const { user } = useAuth();

  const DEBOUNCE_DELAY = 1000; // 1 second debounce

  const handleSearch = async () => {
    if (!user) {
      toast.error("Please login to search products");
      return;
    }

    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    // Debounce check
    const now = Date.now();
    if (now - lastSearchTime < DEBOUNCE_DELAY) {
      toast.info("Please wait a moment before searching again");
      return;
    }
    setLastSearchTime(now);

    setIsSearching(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('scrape-products', {
        body: {
          query: searchQuery
        }
      });

      if (error) {
        // Check if it's a rate limit error
        if (error.message?.includes('Daily search limit')) {
          toast.error("Daily search limit reached. Please try again tomorrow.");
          return;
        }
        throw error;
      }

      // Extract rate limit info from headers
      const rateLimitRemaining = data?.remaining;
      const rateLimitReset = data?.resetAt;

      if (rateLimitRemaining !== undefined) {
        setSearchesRemaining(rateLimitRemaining);
      }
      if (rateLimitReset) {
        setResetAt(rateLimitReset);
      }

      if (data?.results && Array.isArray(data.results)) {
        setSearchResults(data.results);
        toast.success(`Found ${data.results.length} products. ${rateLimitRemaining ?? searchesRemaining} searches remaining today.`);
      } else {
        setSearchResults([]);
        toast.info("No products found");
      }
    } catch (error: any) {
      console.error('Search error:', error);
      
      // Handle different error types
      if (error.message?.includes('429') || error.message?.includes('limit')) {
        toast.error("Daily search limit reached. Please try again tomorrow.");
      } else if (error.message?.includes('401') || error.message?.includes('Authentication')) {
        toast.error("Please login to search products");
      } else {
        toast.error("Failed to search products. Please try again.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToList = async (result: SearchResult, seller: any) => {
    if (!user) {
      toast.error("Please login to track products");
      return;
    }

    const affiliateUrl = seller.productUrl || '';
    
    if (!affiliateUrl) {
      toast.error("Product link not available");
      return;
    }

    try {
      const { data: savedProduct, error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          external_id: result.id,
          title: result.title,
          description: result.description,
          image_url: result.image,
          store: seller.store,
          product_url: affiliateUrl,
          current_price: seller.price,
          currency: 'SAR',
          category: 'General'
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          toast.error("This product is already in your tracking list");
        } else {
          throw error;
        }
        return;
      }
      
      if (savedProduct) {
        await supabase
          .from('price_history')
          .insert({
            product_id: savedProduct.id,
            price: seller.price,
            original_price: seller.originalPrice,
            currency: 'SAR'
          });
      }
      
      window.open(affiliateUrl, '_blank');
      toast.success(`${result.title} is now being tracked!`);
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error("Failed to add product to your list");
    }
  };

  const formatResetTime = () => {
    if (!resetAt) return '';
    const resetDate = new Date(resetAt);
    const now = new Date();
    const diff = resetDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find Your Perfect Product, Instantly.
          </h1>
          
          {user && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="secondary" className="text-sm">
                <Clock className="h-3 w-3 mr-1" />
                {searchesRemaining} searches remaining today
              </Badge>
              {resetAt && searchesRemaining < 5 && (
                <Badge variant="outline" className="text-sm">
                  Resets in {formatResetTime()}
                </Badge>
              )}
            </div>
          )}
          
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
                  disabled={!user || searchesRemaining === 0}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching || !user || searchesRemaining === 0}
                className="h-14 px-8 bg-primary hover:bg-primary/90"
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>

            {!user && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please login to search for products
                </AlertDescription>
              </Alert>
            )}

            {user && searchesRemaining === 0 && (
              <Alert className="mt-4" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You've reached your daily search limit. Resets in {formatResetTime()}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {searchResults.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">
              {searchResults.length} Results Found
            </h2>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Grid: {gridColumns} columns
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Grid Columns</h4>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground w-8">{gridColumns}</span>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      value={gridColumns}
                      onChange={(e) => setGridColumns(parseInt(e.target.value))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        <div 
          className="grid gap-6"
          style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
        >
          {searchResults.map((result) => (
            <Card key={result.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square overflow-hidden bg-muted">
                {result.image ? (
                  <img
                    src={result.image}
                    alt={result.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold mb-2 line-clamp-2">{result.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {result.description}
                </p>

                <div className="space-y-2">
                  {result.sellers.map((seller, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div>
                        <div className="font-medium">{seller.store}</div>
                        {seller.price > 0 ? (
                          <>
                            <div className="text-lg font-bold">
                              SAR {seller.price.toFixed(2)}
                            </div>
                            {seller.originalPrice && seller.originalPrice > seller.price && (
                              <div className="text-sm text-muted-foreground line-through">
                                SAR {seller.originalPrice.toFixed(2)}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Click to view prices
                          </div>
                        )}
                        {seller.badge && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {seller.badge}
                          </Badge>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleAddToList(result, seller)}
                        className="bg-gradient-primary"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Track
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {!isSearching && searchResults.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found. Try a different search.</p>
          </div>
        )}
      </div>
    </div>
  );
}