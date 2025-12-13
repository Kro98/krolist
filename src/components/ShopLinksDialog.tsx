import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen, Clock, Image as ImageIcon, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { getStoreById } from "@/config/stores";

interface LinkPreview {
  id: string;
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  timestamp: Date;
}

interface ShopLinksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  shopUrl: string;
  onShowGuide: () => void;
}

// Shein promotional links with previews
const SHEIN_LINKS: LinkPreview[] = [
  {
    id: "1",
    url: "https://onelink.shein.com/k6j1/lhuvlb9r",
    title: "Spring Summer Bestsellers",
    description: "Grab lingerie & pajama deals at 80% OFF! New users get 50% OFF coupons. Search ADSQGW9 on the SHEIN App.",
    imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=300&fit=crop",
    timestamp: new Date("2024-12-13T08:31:00")
  },
  {
    id: "2",
    url: "https://onelink.shein.com/9w3h/r2t9m43",
    title: "Festive Beauty, Endless Cheer!",
    description: "Up To 90% OFF! Search R2T9M43 on the SHEIN App or Click the link to get started!",
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop",
    timestamp: new Date("2024-12-13T08:32:00")
  },
  {
    id: "3",
    url: "https://onelink.shein.com/22/59yf418b3khs",
    title: "Gift Yourself a Workout",
    description: "Up To 90% OFF! Search ZPS4545 on the SHEIN App.",
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop",
    timestamp: new Date("2024-12-13T08:32:00")
  },
  {
    id: "4",
    url: "https://onelink.shein.com/wrap-tech",
    title: "Wrap Tech for Loved Ones",
    description: "Up To 90% OFF! Search 402K6Q0 on the SHEIN App or Click the link to get started!",
    imageUrl: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop",
    timestamp: new Date("2024-12-13T08:32:00")
  },
  {
    id: "5",
    url: "https://onelink.shein.com/all-under-19",
    title: "ALL UNDER AED 19 - LIMITED TIME!",
    description: "EXTRA -50% COUPON for New Users Only! Search 6NSDL64 on the SHEIN App.",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
    timestamp: new Date("2024-12-13T08:32:00")
  },
  {
    id: "6",
    url: "https://onelink.shein.com/hot-sale",
    title: "AUTUMN-WINTER HOT SALE",
    description: "Up to 90% Off on Bags & Shoes! 60% OFF COUPON for every New User! Search W42AH56.",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop",
    timestamp: new Date("2024-12-13T08:33:00")
  },
  {
    id: "7",
    url: "https://onelink.shein.com/trending-brands",
    title: "Trending Brands - UP TO 40% OFF",
    description: "Can't believe it! SHEIN now offers up to 40% OFF on top brands. 50% OFF COUPON for every New User!",
    imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=300&fit=crop",
    timestamp: new Date("2024-12-13T08:33:00")
  }
];

export function ShopLinksDialog({ open, onOpenChange, shopId, shopUrl, onShowGuide }: ShopLinksDialogProps) {
  const { t, language } = useLanguage();
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  const storeConfig = getStoreById(shopId);
  const links = shopId === 'shein' ? SHEIN_LINKS : [];

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank');
  };

  const handleImageLoad = (id: string) => {
    setLoadingImages(prev => ({ ...prev, [id]: false }));
  };

  const handleImageError = (id: string) => {
    setLoadingImages(prev => ({ ...prev, [id]: false }));
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  useEffect(() => {
    if (open) {
      // Reset image states when dialog opens
      const initialLoading: Record<string, boolean> = {};
      links.forEach(link => {
        if (link.imageUrl) {
          initialLoading[link.id] = true;
        }
      });
      setLoadingImages(initialLoading);
      setImageErrors({});
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            {storeConfig?.icon && (
              <img 
                src={storeConfig.icon} 
                alt={storeConfig.displayName} 
                className="h-6 w-6 rounded-full object-cover"
              />
            )}
            {storeConfig?.displayName || shopId.toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <Button 
            onClick={() => window.open(shopUrl, '_blank')}
            className="flex-1 bg-gradient-primary hover:opacity-90"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'تسوق الآن' : 'Shop Now'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onShowGuide();
            }}
            className="flex-1"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'دليل التسوق' : 'Shop Guide'}
          </Button>
        </div>

        {/* Links List with WhatsApp-style previews */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mt-4">
          {links.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {language === 'ar' ? 'لا توجد روابط متاحة' : 'No links available'}
            </div>
          ) : (
            links.map((link) => (
              <div 
                key={link.id}
                onClick={() => handleLinkClick(link.url)}
                className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200 group"
              >
                {/* Image Preview */}
                <div className="relative w-full aspect-[16/9] bg-muted overflow-hidden">
                  {loadingImages[link.id] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {imageErrors[link.id] ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  ) : (
                    <img 
                      src={link.imageUrl}
                      alt={link.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onLoad={() => handleImageLoad(link.id)}
                      onError={() => handleImageError(link.id)}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="p-3 space-y-1.5">
                  <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {link.title}
                  </h3>
                  {link.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {link.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                    <Clock className="h-3 w-3" />
                    <span>{format(link.timestamp, 'h:mm a')}</span>
                    <span className="text-primary/60">✓✓</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
