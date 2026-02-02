import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAffiliateTag } from "@/config/stores";

export default function SearchProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error(isArabic ? "الرجاء إدخال كلمة للبحث" : "Please enter a search query");
      return;
    }

    // Get affiliate tag from centralized config (src/config/stores.ts)
    const affiliateTag = getAffiliateTag('amazon');
    
    // Build Amazon search URL with affiliate tracking
    const amazonSearchUrl = `https://www.amazon.sa/s?k=${encodeURIComponent(searchQuery.trim())}&linkCode=sl2${affiliateTag ? `&tag=${affiliateTag}` : ''}`;
    window.open(amazonSearchUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              {isArabic ? 'اعثر على منتجك المثالي، فوراً.' : 'Find Your Perfect Product, Instantly.'}
            </h1>
          </div>
          
          <p className="text-muted-foreground text-lg mb-8">
            {isArabic 
              ? 'ابحث في أمازون السعودية عن أفضل العروض والمنتجات'
              : 'Search Amazon Saudi Arabia for the best deals and products'}
          </p>

          <div className="max-w-3xl mx-auto">
            <div className="relative flex gap-2" dir={isArabic ? 'rtl' : 'ltr'}>
              <div className="relative flex-1">
                <Search className={`absolute ${isArabic ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={isArabic ? "ابحث عن منتجات، ماركات، أو بائعين..." : "Search for products, brands, or sellers..."}
                  className={`${isArabic ? 'pr-12' : 'pl-12'} h-14 text-base bg-card border-2`}
                />
              </div>
              <Button
                onClick={handleSearch}
                className="h-14 px-8 bg-primary hover:bg-primary/90"
              >
                {isArabic ? 'بحث' : 'Search'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
