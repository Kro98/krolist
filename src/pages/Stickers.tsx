import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Sticker, 
  ShoppingBag, 
  Heart, 
  Share2, 
  MessageCircle,
  Sparkles,
  Package,
  Loader2
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StickerItem {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  category: string | null;
  stock_status: string;
  is_featured: boolean | null;
  is_new: boolean | null;
}

export default function Stickers() {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const isArabic = language === 'ar';
  const [likedStickers, setLikedStickers] = useState<Set<string>>(new Set());
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');

  useEffect(() => {
    fetchStickers();
    fetchWhatsappNumber();
  }, []);

  const fetchStickers = async () => {
    try {
      const { data, error } = await supabase
        .from('stickers')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setStickers(data || []);
    } catch (error) {
      console.error('Error fetching stickers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWhatsappNumber = async () => {
    try {
      const { data, error } = await supabase
        .from('sticker_settings')
        .select('setting_value')
        .eq('setting_key', 'whatsapp_number')
        .single();

      if (error) throw error;
      if (data) {
        setWhatsappNumber(data.setting_value);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp number:', error);
    }
  };

  const toggleLike = (id: string) => {
    setLikedStickers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleShare = (sticker: StickerItem) => {
    if (navigator.share) {
      navigator.share({
        title: isArabic ? (sticker.name_ar || sticker.name) : sticker.name,
        text: isArabic ? (sticker.description_ar || sticker.description || '') : (sticker.description || ''),
        url: window.location.href
      });
    }
  };

  const handleOrder = (sticker: StickerItem) => {
    if (!whatsappNumber) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'رقم الواتساب غير متوفر حالياً' : 'WhatsApp number is not available',
        variant: 'destructive'
      });
      return;
    }

    const stickerName = isArabic ? (sticker.name_ar || sticker.name) : sticker.name;
    const message = isArabic 
      ? `مرحباً! أريد طلب ملصق: ${stickerName} - السعر: ${sticker.price} ${sticker.currency}`
      : `Hi! I'd like to order the sticker: ${stickerName} - Price: ${sticker.price} ${sticker.currency}`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
  };

  const handleContactGeneral = () => {
    if (!whatsappNumber) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'رقم الواتساب غير متوفر حالياً' : 'WhatsApp number is not available',
        variant: 'destructive'
      });
      return;
    }

    const message = isArabic 
      ? 'مرحباً! أريد الاستفسار عن ملصقات كروليست'
      : 'Hi! I\'m interested in Krolist stickers';
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
  };

  const getStockLabel = (status: string) => {
    switch (status) {
      case 'in_stock':
        return null;
      case 'out_of_stock':
        return isArabic ? 'نفذ' : 'Sold Out';
      case 'limited':
        return isArabic ? 'كمية محدودة' : 'Limited';
      case 'pre_order':
        return isArabic ? 'طلب مسبق' : 'Pre-order';
      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>{isArabic ? 'ملصقات كروليست | كروليست' : 'Krolist Stickers | Krolist'}</title>
        <meta 
          name="description" 
          content={isArabic 
            ? 'اكتشف مجموعة ملصقات كروليست الحصرية - ملصقات عالية الجودة للتسوق والحياة اليومية'
            : 'Discover the exclusive Krolist sticker collection - premium quality stickers for shopping lovers and everyday life'
          } 
        />
      </Helmet>

      <div className={`min-h-screen bg-background ${isArabic ? 'rtl' : 'ltr'}`}>
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b border-border/50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
          <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
            <div className={`flex flex-col items-center text-center gap-6 ${isArabic ? 'font-arabic' : ''}`}>
              <div className="relative">
                <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative bg-gradient-to-br from-primary to-primary/80 p-4 rounded-2xl shadow-xl">
                  <Sticker className="h-12 w-12 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent mb-3">
                  {isArabic ? 'ملصقات كروليست' : 'Krolist Stickers'}
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl max-w-2xl">
                  {isArabic 
                    ? 'ملصقات حصرية مصممة بحب لعشاق التسوق الأذكياء'
                    : 'Exclusive stickers designed with love for smart shoppers'}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <Badge variant="outline" className="px-4 py-2 text-sm border-primary/50 bg-primary/5">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isArabic ? 'جودة عالية' : 'Premium Quality'}
                </Badge>
                <Badge variant="outline" className="px-4 py-2 text-sm border-primary/50 bg-primary/5">
                  <Package className="h-4 w-4 mr-2" />
                  {isArabic ? 'شحن سريع' : 'Fast Shipping'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Stickers Grid */}
        <div className="container mx-auto px-4 py-8 md:py-12">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : stickers.length === 0 ? (
            <div className="text-center py-20">
              <Sticker className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold text-muted-foreground">
                {isArabic ? 'لا توجد ملصقات حالياً' : 'No stickers available yet'}
              </h2>
              <p className="text-muted-foreground mt-2">
                {isArabic ? 'ترقبوا ملصقاتنا القادمة!' : 'Stay tuned for our upcoming stickers!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stickers.map((sticker) => {
                const stockLabel = getStockLabel(sticker.stock_status);
                const isAvailable = sticker.stock_status === 'in_stock' || sticker.stock_status === 'limited' || sticker.stock_status === 'pre_order';
                
                return (
                  <Card 
                    key={sticker.id} 
                    className="group overflow-hidden bg-card border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <CardContent className="p-0">
                      {/* Image */}
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        <img 
                          src={sticker.image_url || '/placeholder.svg'} 
                          alt={isArabic ? (sticker.name_ar || sticker.name) : sticker.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {sticker.is_new && (
                            <Badge className="bg-primary text-primary-foreground">
                              {isArabic ? 'جديد' : 'New'}
                            </Badge>
                          )}
                          {sticker.is_featured && (
                            <Badge className="bg-amber-500 hover:bg-amber-500 text-amber-50">
                              <Sparkles className="h-3 w-3 mr-1" />
                              {isArabic ? 'مميز' : 'Featured'}
                            </Badge>
                          )}
                          {stockLabel && (
                            <Badge variant="secondary" className="bg-muted text-muted-foreground">
                              {stockLabel}
                            </Badge>
                          )}
                        </div>
                        {/* Like Button */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-3 right-3 h-9 w-9 bg-background/80 backdrop-blur-sm hover:bg-background"
                          onClick={() => toggleLike(sticker.id)}
                        >
                          <Heart 
                            className={`h-5 w-5 transition-colors ${
                              likedStickers.has(sticker.id) 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-foreground'
                            }`} 
                          />
                        </Button>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {sticker.category && (
                              <Badge variant="outline" className="text-[10px] mb-2">
                                {sticker.category}
                              </Badge>
                            )}
                            <h3 className="font-semibold text-lg line-clamp-1">
                              {isArabic ? (sticker.name_ar || sticker.name) : sticker.name}
                            </h3>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-xl font-bold text-primary">
                              {sticker.price}
                            </span>
                            <span className="text-sm text-muted-foreground ml-1">
                              {sticker.currency}
                            </span>
                          </div>
                        </div>

                        {(sticker.description || sticker.description_ar) && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {isArabic ? (sticker.description_ar || sticker.description) : sticker.description}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2">
                          <Button 
                            className="flex-1 gap-2" 
                            disabled={!isAvailable}
                            onClick={() => handleOrder(sticker)}
                          >
                            <ShoppingBag className="h-4 w-4" />
                            {isAvailable 
                              ? (isArabic ? 'اطلب الآن' : 'Order Now')
                              : (isArabic ? 'نفذت الكمية' : 'Sold Out')
                            }
                          </Button>
                          <Button 
                            size="icon" 
                            variant="outline"
                            onClick={() => handleShare(sticker)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Contact Section */}
          <div className="mt-12 text-center">
            <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
              <CardContent className="p-8">
                <MessageCircle className="h-12 w-12 mx-auto text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-2">
                  {isArabic ? 'هل لديك طلب خاص؟' : 'Have a Custom Request?'}
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {isArabic 
                    ? 'نحن نحب الطلبات المخصصة! تواصل معنا لتصميم ملصقات حصرية لك'
                    : 'We love custom orders! Contact us to create exclusive stickers just for you'}
                </p>
                <Button size="lg" className="gap-2" onClick={handleContactGeneral}>
                  <MessageCircle className="h-5 w-5" />
                  {isArabic ? 'تواصل معنا' : 'Contact Us'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}