import { useState } from "react";
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
  Package
} from "lucide-react";
import { Helmet } from "react-helmet-async";

interface StickerItem {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  currency: string;
  imageUrl: string;
  category: string;
  inStock: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
}

// Placeholder stickers - you can manage these from admin later
const placeholderStickers: StickerItem[] = [
  {
    id: "1",
    name: "Krolist Logo Pack",
    nameAr: "حزمة شعار كروليست",
    description: "Premium die-cut stickers featuring the Krolist logo in various sizes",
    descriptionAr: "ملصقات مقطوعة بجودة عالية تتضمن شعار كروليست بأحجام مختلفة",
    price: 5.99,
    currency: "SAR",
    imageUrl: "/placeholder.svg",
    category: "Logo",
    inStock: true,
    isNew: true,
    isFeatured: true
  },
  {
    id: "2",
    name: "Shopping Vibes",
    nameAr: "أجواء التسوق",
    description: "Fun shopping-themed stickers perfect for planners and laptops",
    descriptionAr: "ملصقات ممتعة بطابع التسوق مثالية للمفكرات واللابتوب",
    price: 3.99,
    currency: "SAR",
    imageUrl: "/placeholder.svg",
    category: "Lifestyle",
    inStock: true,
    isNew: false,
    isFeatured: false
  },
  {
    id: "3",
    name: "Deal Hunter Collection",
    nameAr: "مجموعة صياد العروض",
    description: "Celebrate your best deals with these exclusive stickers",
    descriptionAr: "احتفل بأفضل صفقاتك مع هذه الملصقات الحصرية",
    price: 4.99,
    currency: "SAR",
    imageUrl: "/placeholder.svg",
    category: "Special",
    inStock: false,
    isNew: false,
    isFeatured: true
  }
];

export default function Stickers() {
  const { language, t } = useLanguage();
  const isArabic = language === 'ar';
  const [likedStickers, setLikedStickers] = useState<Set<string>>(new Set());

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
        title: isArabic ? sticker.nameAr : sticker.name,
        text: isArabic ? sticker.descriptionAr : sticker.description,
        url: window.location.href
      });
    }
  };

  const handleContact = () => {
    // You can customize this to open WhatsApp or email
    window.open('https://wa.me/YOUR_NUMBER?text=Hi! I\'m interested in Krolist stickers', '_blank');
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {placeholderStickers.map((sticker) => (
              <Card 
                key={sticker.id} 
                className="group overflow-hidden bg-card border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img 
                      src={sticker.imageUrl} 
                      alt={isArabic ? sticker.nameAr : sticker.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {sticker.isNew && (
                        <Badge className="bg-primary text-primary-foreground">
                          {isArabic ? 'جديد' : 'New'}
                        </Badge>
                      )}
                      {sticker.isFeatured && (
                        <Badge className="bg-amber-500 hover:bg-amber-500 text-amber-50">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {isArabic ? 'مميز' : 'Featured'}
                        </Badge>
                      )}
                      {!sticker.inStock && (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">
                          {isArabic ? 'نفذ' : 'Sold Out'}
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
                        <Badge variant="outline" className="text-[10px] mb-2">
                          {sticker.category}
                        </Badge>
                        <h3 className="font-semibold text-lg line-clamp-1">
                          {isArabic ? sticker.nameAr : sticker.name}
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

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {isArabic ? sticker.descriptionAr : sticker.description}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button 
                        className="flex-1 gap-2" 
                        disabled={!sticker.inStock}
                        onClick={handleContact}
                      >
                        <ShoppingBag className="h-4 w-4" />
                        {sticker.inStock 
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
            ))}
          </div>

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
                <Button size="lg" className="gap-2" onClick={handleContact}>
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