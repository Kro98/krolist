import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen, Clock, Image as ImageIcon, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { getStoreById } from "@/config/stores";
import { supabase } from "@/integrations/supabase/client";

interface ShopCampaign {
  id: string;
  shop_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  campaign_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ShopLinksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  shopUrl: string;
  onShowGuide: () => void;
}

export function ShopLinksDialog({ open, onOpenChange, shopId, shopUrl, onShowGuide }: ShopLinksDialogProps) {
  const { language } = useLanguage();
  const [campaigns, setCampaigns] = useState<ShopCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  const storeConfig = getStoreById(shopId);

  useEffect(() => {
    if (open && shopId) {
      fetchCampaigns();
    }
  }, [open, shopId]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shop_campaigns')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setCampaigns(data || []);
      
      // Initialize loading states for images
      const initialLoading: Record<string, boolean> = {};
      (data || []).forEach(campaign => {
        if (campaign.image_url) {
          initialLoading[campaign.id] = true;
        }
      });
      setLoadingImages(initialLoading);
      setImageErrors({});
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {language === 'ar' ? 'لا توجد روابط متاحة' : 'No links available'}
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div 
                key={campaign.id}
                onClick={() => handleLinkClick(campaign.campaign_url)}
                className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200 group"
              >
                {/* Image Preview */}
                {campaign.image_url && (
                  <div className="relative w-full aspect-[16/9] bg-muted overflow-hidden">
                    {loadingImages[campaign.id] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {imageErrors[campaign.id] ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    ) : (
                      <img 
                        src={campaign.image_url}
                        alt={campaign.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onLoad={() => handleImageLoad(campaign.id)}
                        onError={() => handleImageError(campaign.id)}
                      />
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-3 space-y-1.5">
                  <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {campaign.title}
                  </h3>
                  {campaign.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {campaign.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(campaign.updated_at), 'h:mm a')}</span>
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
