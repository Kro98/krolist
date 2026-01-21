import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sticker, 
  ShoppingCart,
  Check,
  Sparkles,
  Loader2,
  X,
  Plus,
  Minus,
  MessageCircle,
  Trash2
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";

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

interface CartItem extends StickerItem {
  quantity: number;
}

const WHATSAPP_NUMBER = "966501950800";
const PRICE_CATEGORIES = [7, 14, 30];

export default function Stickers() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [addedSticker, setAddedSticker] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    fetchStickers();
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

  const addToCart = useCallback((sticker: StickerItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === sticker.id);
      if (existing) {
        return prev.map(item =>
          item.id === sticker.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...sticker, quantity: 1 }];
    });
    
    setAddedSticker(sticker.id);
    setTimeout(() => setAddedSticker(null), 1500);
    
    toast.success(isArabic ? 'تمت الإضافة للسلة!' : 'Added to cart!', {
      duration: 1500,
      position: 'bottom-center'
    });
  }, [isArabic]);

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);
  const getTotalPrice = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleWhatsAppOrder = () => {
    if (cart.length === 0) return;

    const orderLines = cart.map(item => {
      const name = isArabic ? (item.name_ar || item.name) : item.name;
      return `• ${name} x${item.quantity} = ${item.price * item.quantity} SAR`;
    });

    const message = isArabic 
      ? `🛒 طلب ملصقات كروليست:\n\n${orderLines.join('\n')}\n\n💰 المجموع: ${getTotalPrice()} ريال`
      : `🛒 Krolist Stickers Order:\n\n${orderLines.join('\n')}\n\n💰 Total: ${getTotalPrice()} SAR`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
  };

  const filteredStickers = selectedCategory 
    ? stickers.filter(s => s.price === selectedCategory)
    : stickers;

  return (
    <>
      <Helmet>
        <title>{isArabic ? 'ملصقات كروليست | كروليست' : 'Krolist Stickers | Krolist'}</title>
        <meta 
          name="description" 
          content={isArabic 
            ? 'اكتشف مجموعة ملصقات كروليست الحصرية'
            : 'Discover the exclusive Krolist sticker collection'
          } 
        />
      </Helmet>

      <div className={`min-h-screen bg-gradient-to-br from-background via-background to-primary/5 ${isArabic ? 'rtl' : 'ltr'}`}>
        {/* Funky Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-primary/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 rounded-full blur-lg animate-pulse" />
                  <div className="relative bg-gradient-to-br from-primary to-orange-500 p-2 rounded-xl rotate-12 hover:rotate-0 transition-transform duration-300">
                    <Sticker className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-black bg-gradient-to-r from-primary via-orange-500 to-pink-500 bg-clip-text text-transparent">
                    {isArabic ? 'ملصقات كروليست' : 'KROLIST STICKERS'}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? 'اضغط للإضافة للسلة' : 'Tap to add to cart'}
                  </p>
                </div>
              </div>

              {/* Cart Button */}
              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="relative border-primary/50 hover:bg-primary/10 hover:scale-110 transition-all"
                  >
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    {getTotalItems() > 0 && (
                      <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold animate-bounce">
                        {getTotalItems()}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md flex flex-col">
                  <SheetHeader className="border-b border-border pb-4">
                    <SheetTitle className="flex items-center gap-2 text-xl">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      {isArabic ? 'سلة الملصقات' : 'Sticker Cart'}
                    </SheetTitle>
                  </SheetHeader>

                  {cart.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Sticker className="h-10 w-10 text-primary/50" />
                      </div>
                      <p className="text-muted-foreground">
                        {isArabic ? 'السلة فارغة' : 'Your cart is empty'}
                      </p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        {isArabic ? 'اضغط على الملصقات لإضافتها' : 'Tap stickers to add them'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto py-4 space-y-3">
                        {cart.map(item => (
                          <div 
                            key={item.id} 
                            className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10"
                          >
                            <img 
                              src={item.image_url || '/placeholder.svg'} 
                              alt={item.name}
                              className="w-14 h-14 object-contain rounded-lg"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {isArabic ? (item.name_ar || item.name) : item.name}
                              </p>
                              <p className="text-primary font-bold">
                                {item.price} SAR
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center font-bold text-sm">
                                {item.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-border pt-4 space-y-4">
                        <div className="flex items-center justify-between text-lg font-bold">
                          <span>{isArabic ? 'المجموع:' : 'Total:'}</span>
                          <span className="text-primary">{getTotalPrice()} SAR</span>
                        </div>
                        <Button 
                          className="w-full gap-2 h-12 text-base bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                          onClick={handleWhatsAppOrder}
                        >
                          <MessageCircle className="h-5 w-5" />
                          {isArabic ? 'اطلب عبر واتساب' : 'Order via WhatsApp'}
                        </Button>
                      </div>
                    </>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Price Category Filters - Funky Pills */}
        <div className="sticky top-[73px] z-30 bg-background/60 backdrop-blur-lg border-b border-primary/10">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`shrink-0 px-5 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
                  selectedCategory === null
                    ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/30 scale-105'
                    : 'bg-muted hover:bg-primary/10 text-muted-foreground hover:text-foreground'
                }`}
              >
                {isArabic ? 'الكل' : 'ALL'}
              </button>
              {PRICE_CATEGORIES.map(price => (
                <button
                  key={price}
                  onClick={() => setSelectedCategory(price)}
                  className={`shrink-0 px-5 py-2 rounded-full font-black text-sm transition-all duration-300 ${
                    selectedCategory === price
                      ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/30 scale-105'
                      : 'bg-muted hover:bg-primary/10 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {price} {isArabic ? 'ريال' : 'SAR'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stickers Grid - Image Only */}
        <div className="container mx-auto px-3 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : filteredStickers.length === 0 ? (
            <div className="text-center py-20">
              <Sticker className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                {isArabic ? 'لا توجد ملصقات' : 'No stickers found'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {filteredStickers.map((sticker) => {
                const isAdded = addedSticker === sticker.id;
                const isOutOfStock = sticker.stock_status === 'out_of_stock';
                
                return (
                  <button
                    key={sticker.id}
                    onClick={() => !isOutOfStock && addToCart(sticker)}
                    disabled={isOutOfStock}
                    className={`group relative aspect-square rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    {/* Image - Full Coverage */}
                    <img 
                      src={sticker.image_url || '/placeholder.svg'} 
                      alt={isArabic ? (sticker.name_ar || sticker.name) : sticker.name}
                      className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />

                    {/* Price Badge - Always Visible */}
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-gradient-to-r from-primary to-orange-500 text-white text-xs font-black shadow-lg">
                        {sticker.price} SAR
                      </span>
                    </div>

                    {/* Added Feedback Overlay */}
                    <AnimatePresence>
                      {isAdded && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="absolute inset-0 flex items-center justify-center bg-primary/90 rounded-2xl"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <Check className="h-8 w-8 text-white" />
                            <span className="text-white text-xs font-bold">
                              {isArabic ? 'تمت الإضافة!' : 'Added!'}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Out of Stock Overlay */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-2xl">
                        <span className="text-xs font-bold text-muted-foreground">
                          {isArabic ? 'نفذ' : 'SOLD'}
                        </span>
                      </div>
                    )}

                    {/* New Badge */}
                    {sticker.is_new && (
                      <div className="absolute top-1 right-1">
                        <Sparkles className="h-4 w-4 text-yellow-500 drop-shadow-lg" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Cart Summary */}
        {cart.length > 0 && !isCartOpen && (
          <div className="fixed bottom-4 left-4 right-4 z-50">
            <Button
              onClick={() => setIsCartOpen(true)}
              className="w-full h-14 bg-gradient-to-r from-primary via-orange-500 to-pink-500 hover:from-primary/90 hover:via-orange-500/90 hover:to-pink-500/90 text-white font-bold shadow-2xl shadow-primary/40 rounded-2xl gap-3"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>{getTotalItems()} {isArabic ? 'ملصق' : 'stickers'}</span>
              <span className="mx-2">•</span>
              <span>{getTotalPrice()} SAR</span>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
