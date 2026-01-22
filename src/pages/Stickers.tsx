import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart,
  Check,
  Sparkles,
  Loader2,
  Plus,
  Minus,
  MessageCircle,
  Trash2,
  Zap,
  Star
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

// Random rotation for scattered effect
const getRandomRotation = (index: number) => {
  const rotations = [-12, 8, -5, 15, -8, 10, -15, 6, -10, 12, 5, -6];
  return rotations[index % rotations.length];
};

// Random scale for variety
const getRandomScale = (index: number) => {
  const scales = [1, 1.05, 0.95, 1.1, 0.9, 1.08, 0.92, 1.03, 0.97, 1.12];
  return scales[index % scales.length];
};

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
    setTimeout(() => setAddedSticker(null), 1200);
    
    toast.success(isArabic ? '✨ تمت الإضافة!' : '✨ Added!', {
      duration: 1000,
      position: 'top-center',
      style: {
        background: 'hsl(var(--primary))',
        color: 'white',
        fontWeight: 'bold',
        border: 'none',
      }
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

      <div className={`min-h-screen bg-background overflow-x-hidden ${isArabic ? 'rtl' : 'ltr'}`}>
        {/* Wild Animated Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-40 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          {/* Floating shapes */}
          <motion.div 
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-32 right-20 w-8 h-8 bg-primary/20 rounded-lg"
          />
          <motion.div 
            animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-60 left-16 w-6 h-6 bg-orange-500/20 rounded-full"
          />
          <motion.div 
            animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/3 left-1/4 w-4 h-4 bg-pink-500/20 rotate-45"
          />
        </div>

        {/* Crazy Header */}
        <div className="sticky top-0 z-40 bg-background/70 backdrop-blur-xl border-b-2 border-primary/30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <motion.div 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center gap-4"
              >
                {/* Bouncing sticker icon */}
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-orange-500 to-pink-500 rounded-2xl blur-lg opacity-50" />
                  <div className="relative bg-gradient-to-br from-primary via-orange-500 to-pink-500 p-3 rounded-2xl shadow-xl">
                    <Zap className="h-7 w-7 text-white" />
                  </div>
                </motion.div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tighter">
                    <span className="bg-gradient-to-r from-primary via-orange-500 to-pink-500 bg-clip-text text-transparent">
                      {isArabic ? 'ملصقات' : 'STICKERS'}
                    </span>
                  </h1>
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    {isArabic ? 'اضغط • أضف • اطلب' : 'TAP • ADD • ORDER'}
                  </p>
                </div>
              </motion.div>

              {/* Cart Button - Wobbly */}
              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="relative h-12 w-12 rounded-2xl border-2 border-primary/50 bg-primary/5 hover:bg-primary/20 transition-colors"
                    >
                      <ShoppingCart className="h-6 w-6 text-primary" />
                      {getTotalItems() > 0 && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs flex items-center justify-center font-black shadow-lg"
                        >
                          {getTotalItems()}
                        </motion.span>
                      )}
                    </Button>
                  </motion.div>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md flex flex-col bg-background/95 backdrop-blur-xl">
                  <SheetHeader className="border-b-2 border-primary/20 pb-4">
                    <SheetTitle className="flex items-center gap-2 text-xl font-black">
                      <div className="p-2 bg-gradient-to-r from-primary to-orange-500 rounded-xl">
                        <ShoppingCart className="h-5 w-5 text-white" />
                      </div>
                      {isArabic ? 'سلة الملصقات' : 'YOUR STASH'}
                    </SheetTitle>
                  </SheetHeader>

                  {cart.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center mb-4"
                      >
                        <Star className="h-12 w-12 text-primary/50" />
                      </motion.div>
                      <p className="text-lg font-bold text-foreground">
                        {isArabic ? 'السلة فارغة!' : 'Nothing here yet!'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isArabic ? 'اضغط على الملصقات لإضافتها' : 'Tap those stickers to add \'em'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto py-4 space-y-3">
                        {cart.map((item, index) => (
                          <motion.div 
                            key={item.id}
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-primary/5 to-orange-500/5 border-2 border-primary/10"
                          >
                            <div className="relative">
                              <img 
                                src={item.image_url || '/placeholder.svg'} 
                                alt={item.name}
                                className="w-16 h-16 object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">
                                {isArabic ? (item.name_ar || item.name) : item.name}
                              </p>
                              <p className="text-primary font-black text-lg">
                                {item.price} <span className="text-xs">SAR</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 rounded-full hover:bg-primary/20"
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center font-black text-sm">
                                {item.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 rounded-full hover:bg-primary/20"
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>

                      <div className="border-t-2 border-primary/20 pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold">{isArabic ? 'المجموع' : 'TOTAL'}</span>
                          <span className="text-3xl font-black bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                            {getTotalPrice()} <span className="text-base">SAR</span>
                          </span>
                        </div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button 
                            className="w-full gap-3 h-14 text-lg font-black bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 rounded-2xl shadow-xl shadow-green-500/30"
                            onClick={handleWhatsAppOrder}
                          >
                            <MessageCircle className="h-6 w-6" />
                            {isArabic ? 'اطلب الآن!' : 'ORDER NOW!'}
                          </Button>
                        </motion.div>
                      </div>
                    </>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Wild Price Filter Pills */}
        <div className="sticky top-[73px] z-30 bg-background/60 backdrop-blur-lg py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 justify-center flex-wrap">
              <motion.button
                whileHover={{ scale: 1.1, rotate: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(null)}
                className={`px-6 py-3 rounded-2xl font-black text-sm transition-all duration-300 border-2 ${
                  selectedCategory === null
                    ? 'bg-gradient-to-r from-primary via-orange-500 to-pink-500 text-white border-transparent shadow-xl shadow-primary/30'
                    : 'bg-background border-primary/20 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {isArabic ? '🔥 الكل' : '🔥 ALL'}
              </motion.button>
              {PRICE_CATEGORIES.map((price, i) => (
                <motion.button
                  key={price}
                  whileHover={{ scale: 1.1, rotate: i % 2 === 0 ? 3 : -3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(price)}
                  className={`px-6 py-3 rounded-2xl font-black text-sm transition-all duration-300 border-2 ${
                    selectedCategory === price
                      ? 'bg-gradient-to-r from-primary via-orange-500 to-pink-500 text-white border-transparent shadow-xl shadow-primary/30'
                      : 'bg-background border-primary/20 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  {price} {isArabic ? 'ر.س' : 'SAR'}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Scattered Stickers Grid */}
        <div className="container mx-auto px-4 py-8 pb-32 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-12 w-12 text-primary" />
              </motion.div>
              <p className="text-muted-foreground font-bold animate-pulse">
                {isArabic ? 'جاري التحميل...' : 'Loading the good stuff...'}
              </p>
            </div>
          ) : filteredStickers.length === 0 ? (
            <div className="text-center py-20">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block mb-4"
              >
                <Star className="h-20 w-20 text-muted-foreground/30" />
              </motion.div>
              <p className="text-xl font-bold text-muted-foreground">
                {isArabic ? 'لا توجد ملصقات هنا!' : 'No stickers here!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8">
              {filteredStickers.map((sticker, index) => {
                const isAdded = addedSticker === sticker.id;
                const isOutOfStock = sticker.stock_status === 'out_of_stock';
                const rotation = getRandomRotation(index);
                const scale = getRandomScale(index);
                
                return (
                  <motion.button
                    key={sticker.id}
                    initial={{ opacity: 0, y: 50, rotate: rotation * 2 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      rotate: rotation,
                      scale: scale
                    }}
                    transition={{ 
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 200
                    }}
                    whileHover={{ 
                      scale: 1.2, 
                      rotate: 0,
                      zIndex: 50,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => !isOutOfStock && addToCart(sticker)}
                    disabled={isOutOfStock}
                    className={`relative aspect-square focus:outline-none group ${
                      isOutOfStock ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer'
                    }`}
                  >
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* The sticker image - raw and expressive */}
                    <img 
                      src={sticker.image_url || '/placeholder.svg'} 
                      alt={isArabic ? (sticker.name_ar || sticker.name) : sticker.name}
                      className="w-full h-full object-contain drop-shadow-2xl transition-all duration-300 group-hover:drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
                      loading="lazy"
                    />

                    {/* Floating price tag */}
                    <motion.div 
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-primary via-orange-500 to-pink-500 text-white text-xs font-black shadow-lg shadow-primary/40 whitespace-nowrap">
                        {sticker.price} SAR
                      </div>
                    </motion.div>

                    {/* New badge - spinning star */}
                    {sticker.is_new && (
                      <motion.div 
                        className="absolute -top-1 -right-1"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      >
                        <div className="p-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                      </motion.div>
                    )}

                    {/* Featured badge */}
                    {sticker.is_featured && !sticker.is_new && (
                      <motion.div 
                        className="absolute -top-1 -right-1"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <div className="p-1.5 bg-gradient-to-r from-primary to-purple-500 rounded-full shadow-lg">
                          <Star className="h-4 w-4 text-white" />
                        </div>
                      </motion.div>
                    )}

                    {/* Added feedback - exploding effect */}
                    <AnimatePresence>
                      {isAdded && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1.5, opacity: 1 }}
                          exit={{ scale: 2, opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                          <div className="bg-gradient-to-r from-primary to-orange-500 rounded-full p-4 shadow-2xl">
                            <Check className="h-10 w-10 text-white" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Out of stock */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="px-3 py-1 bg-background/90 rounded-full text-sm font-black text-muted-foreground border-2 border-muted">
                          {isArabic ? 'نفذ' : 'SOLD OUT'}
                        </span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Epic Floating Cart Bar */}
        <AnimatePresence>
          {cart.length > 0 && !isCartOpen && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-4 left-4 right-4 z-50"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => setIsCartOpen(true)}
                  className="w-full h-16 bg-gradient-to-r from-primary via-orange-500 to-pink-500 hover:from-primary/90 hover:via-orange-500/90 hover:to-pink-500/90 text-white font-black text-lg shadow-2xl shadow-primary/50 rounded-3xl gap-4 border-2 border-white/20"
                >
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <ShoppingCart className="h-6 w-6" />
                  </motion.div>
                  <span className="flex items-center gap-3">
                    <span className="bg-white/20 px-3 py-1 rounded-full">
                      {getTotalItems()} {isArabic ? 'ملصق' : 'stickers'}
                    </span>
                    <span className="text-2xl font-black">{getTotalPrice()} SAR</span>
                  </span>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
