import { useState } from "react";
import { Search, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { getAffiliateTag } from "@/config/stores";

export default function SearchProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    // Get affiliate tag from centralized config (src/config/stores.ts)
    const affiliateTag = getAffiliateTag('amazon');
    
    // Build Amazon search URL with affiliate tracking
    // Format: https://www.amazon.sa/s?k={query}&linkCode=sl2&tag={affiliateTag}
    const amazonSearchUrl = `https://www.amazon.sa/s?k=${encodeURIComponent(searchQuery.trim())}&linkCode=sl2${affiliateTag ? `&tag=${affiliateTag}` : ''}`;
    window.open(amazonSearchUrl, '_blank');
  };

  return (
    <div className="min-h-[70vh] bg-background flex flex-col">
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border flex-1 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16 md:py-20 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Find Your Perfect Product, Instantly.
            </h1>
          </div>

          <div className="max-w-4xl mx-auto mt-10">
            <div className="relative flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search for products, brands, or sellers..."
                  className="pl-14 h-16 text-lg bg-card border-2 rounded-2xl"
                />
              </div>
              <Button
                onClick={handleSearch}
                className="h-16 px-10 text-lg font-semibold bg-primary hover:bg-primary/90 rounded-2xl"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
