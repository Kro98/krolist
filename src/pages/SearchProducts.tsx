import { useState } from "react";
import { Search, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { getAffiliateLink } from "@/config/stores";

export default function SearchProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    // Open Amazon affiliate link - it will redirect to Amazon
    const amazonAffiliateUrl = getAffiliateLink('amazon');
    window.open(amazonAffiliateUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Find Your Perfect Product, Instantly.
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/how-to-use-search")}
              className="h-10 w-10"
            >
              <HelpCircle className="h-6 w-6 text-primary" />
            </Button>
          </div>

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
                className="h-14 px-8 bg-primary hover:bg-primary/90"
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
