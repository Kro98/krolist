import { useState, useEffect } from "react";
import { Search, Plus, LayoutGrid, Clock, AlertCircle, HelpCircle } from "lucide-react";
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
import { getSafeErrorMessage } from "@/lib/errorHandler";
import { sanitizeContent } from "@/lib/sanitize";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { detectStoreFromUrl } from "@/lib/storeDetection";
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

// Validation schema for search result data before database insertion
const searchResultSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  description: z.string().max(2000),
  image: z.string().url().nullable(),
  price: z.number().min(0).max(10000000),
  store: z.string().min(1).max(100),
  productUrl: z.string().url()
});
export default function SearchProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchesRemaining, setSearchesRemaining] = useState<number>(5);
  const [resetAt, setResetAt] = useState<string>("");
  const [lastSearchTime, setLastSearchTime] = useState<number>(0);
  const {
    t
  } = useLanguage();
  const {
    user,
    isGuest
  } = useAuth();
  const navigate = useNavigate();
  const DEBOUNCE_DELAY = 1000; // 1 second debounce

  const handleSearch = async () => {
    if (isGuest) {
      toast.error("Please create an account to use the search feature. Click the user icon in the top right to sign up.", {
        duration: 5000
      });
      return;
    }
    if (!user) {
      toast.error("Please log in to search products. Click the user icon in the top right.");
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
      const {
        data,
        error
      } = await supabase.functions.invoke('scrape-products', {
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
        // Limit to 6 results for 3x2 grid
        const limitedResults = data.results.slice(0, 6);
        setSearchResults(limitedResults);
        toast.success(`Found ${limitedResults.length} products. ${rateLimitRemaining ?? searchesRemaining} searches remaining today.`);
      } else {
        setSearchResults([]);
        toast.info("No products found");
      }
    } catch (error: any) {
      toast.error(getSafeErrorMessage(error));
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
      // Validate data before inserting into database
      const validatedData = searchResultSchema.parse({
        id: result.id,
        title: result.title,
        description: result.description || '',
        image: result.image || null,
        price: seller.price,
        store: seller.store,
        productUrl: affiliateUrl
      });

      // Detect store currency from URL
      const detectedStore = detectStoreFromUrl(validatedData.productUrl);
      const productCurrency = detectedStore.currency;
      const {
        data: savedProduct,
        error
      } = await supabase.from('products').insert({
        user_id: user.id,
        external_id: validatedData.id,
        title: validatedData.title,
        description: validatedData.description,
        image_url: validatedData.image,
        store: validatedData.store,
        product_url: validatedData.productUrl,
        current_price: validatedData.price,
        original_price: validatedData.price,
        original_currency: productCurrency,
        currency: productCurrency,
        category: 'General'
      }).select().single();
      if (error) throw error;
      if (savedProduct) {
        await supabase.from('price_history').insert({
          product_id: savedProduct.id,
          price: validatedData.price,
          original_price: seller.originalPrice || null,
          currency: productCurrency
        });
      }
      window.open(affiliateUrl, '_blank');
      toast.success(`${validatedData.title} is now being tracked!`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error("Invalid product data. Please try a different product");
      } else {
        toast.error(getSafeErrorMessage(error));
      }
    }
  };
  const formatResetTime = () => {
    if (!resetAt) return '';
    const resetDate = new Date(resetAt);
    const now = new Date();
    const diff = resetDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff % (1000 * 60 * 60) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };
  return <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Find Your Perfect Product, Instantly.
            </h1>
            <Button variant="ghost" size="icon" onClick={() => navigate("/how-to-use-search")} className="h-10 w-10">
              <HelpCircle className="h-6 w-6 text-primary" />
            </Button>
          </div>
          
          {user && searchesRemaining > 0 && <div className="flex items-center justify-center gap-2 mb-4">
              
              {resetAt && searchesRemaining < 5 && <Badge variant="outline" className="text-sm">
                  Resets in {formatResetTime()}
                </Badge>}
            </div>}

          {user && searchesRemaining === 0 && <div className="max-w-2xl mx-auto mb-4 p-4 bg-muted/50 rounded-lg border">
              <p className="text-sm text-muted-foreground text-center mb-3">
                We apologize, but you've reached your daily search limit. As we're currently operating with limited API resources, searches are restricted to 5 per day.
              </p>
              <p className="text-sm text-center">
                Continue your shopping on{" "}
                <a href={`https://www.amazon.com/s?k=${encodeURIComponent(searchQuery || "products")}`} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
                  Amazon.com
                </a>
              </p>
            </div>}
          
          <div className="max-w-3xl mx-auto mt-8">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder={isGuest ? "Sign up to search products..." : "Search for products, brands, or sellers..."} className="pl-12 h-14 text-base bg-card border-2" disabled={isGuest || searchesRemaining === 0} />
              </div>
              <Button onClick={handleSearch} disabled={isSearching || isGuest || searchesRemaining === 0} className="h-14 px-8 bg-primary hover:bg-primary/90">
                {isGuest ? "Sign Up to Search" : isSearching ? "Searching..." : "Search"}
              </Button>
            </div>

            {isGuest && <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Create an account using the user icon in the top right to access the search feature and track products
                </AlertDescription>
              </Alert>}

            {!user && !isGuest && <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please login to search for products
                </AlertDescription>
              </Alert>}

            {user && searchesRemaining === 0 && <Alert className="mt-4" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="mx-0">
                  You've reached your daily search limit. Resets in {formatResetTime()}
                </AlertDescription>
              </Alert>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-[50px]">
        {searchResults.length > 0 && <div className="mb-6">
            
          </div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-[10px] py-[10px]">
          {searchResults.map(result => <Card key={result.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50 mx-0">
              <div className="aspect-square overflow-hidden bg-muted">
                {result.image ? <img src={result.image} alt={result.title} className="w-full h-full object-cover transition-transform duration-300 hover:scale-110" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image
                  </div>}
              </div>
              
              <div className="p-4 py-0 px-0 mx-[5px]">
                <h3 className="font-semibold mb-2 line-clamp-2">{sanitizeContent(result.title)}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {sanitizeContent(result.description)}
                </p>

                <div className="space-y-2">
                  {result.sellers.map((seller, idx) => <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div>
                        <div className="font-medium">{seller.store}</div>
                        {seller.price > 0 ? <>
                            <div className="text-lg font-bold">
                              SAR {seller.price.toFixed(2)}
                            </div>
                            {seller.originalPrice && seller.originalPrice > seller.price && <div className="text-sm text-muted-foreground line-through">
                                SAR {seller.originalPrice.toFixed(2)}
                              </div>}
                          </> : <div className="text-sm text-muted-foreground">
                            Click to view prices
                          </div>}
                        {seller.badge && <Badge variant="secondary" className="text-xs mt-1">
                            {seller.badge}
                          </Badge>}
                      </div>
                      
                      {seller.store.toLowerCase().includes('amazon') ? <Button size="sm" onClick={() => seller.productUrl && window.open(seller.productUrl, '_blank')} className="bg-gradient-primary">
                          Open on Amazon
                        </Button> : <Button size="sm" onClick={() => handleAddToList(result, seller)} className="bg-gradient-primary">
                          <Plus className="h-4 w-4 mr-1" />
                          Track
                        </Button>}
                    </div>)}
                </div>
              </div>
            </Card>)}
        </div>

        {!isSearching && searchResults.length === 0 && searchQuery && <div className="text-center py-12">
            <p className="text-muted-foreground">No products found. Try a different search.</p>
          </div>}
      </div>
    </div>;
}