import { useState, useEffect, useCallback, useMemo } from "react";
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
  Star,
  Lock
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import GeminiGradientBackground from "@/components/GeminiGradientBackground";
import stickersTitleImage from "@/assets/stickers-title.png";

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
  display_order: number;
}

interface CartItem extends StickerItem {
  quantity: number;
}

const WHATSAPP_NUMBER = "966501950800";
const PRICE_CATEGORIES = [7, 14, 30];
const FREE_STICKER_THRESHOLD_SAR = 30;
const FREE_STICKER_THRESHOLD_USD = 8;

export default function Stickers() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [addedSticker, setAddedSticker] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Lower default resolution for faster loading
  const DEFAULT_IMAGE_WIDTH = 280;
  const DEFAULT_IMAGE_QUALITY = 70;

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

  // Optimized image URL with lower resolution by default
  const getOptimizedImageUrl = useCallback((url: string | null) => {
    if (!url) return '/placeholder.svg';
    if (url.includes('supabase') && url.includes('storage')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}quality=${DEFAULT_IMAGE_QUALITY}&width=${DEFAULT_IMAGE_WIDTH}`;
    }
    return url;
  }, []);

  // Get watermarked image URL for viewing in new tab
  const getWatermarkedViewUrl = useCallback((url: string | null) => {
    if (!url) return '/placeholder.svg';
    const baseUrl = 'https://cnmdwgdizfrvyplllmdn.supabase.co/functions/v1/process-sticker-image';
    return `${baseUrl}?url=${encodeURIComponent(url)}&watermark=true`;
  }, []);

  // Cart total for free sticker eligibility
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  // Check if user qualifies for free stickers
  const qualifiesForFreeStickers = cartTotal >= FREE_STICKER_THRESHOLD_SAR;

  // Check if sticker is in cart
  const isInCart = useCallback((stickerId: string) => {
    return cart.some(item => item.id === stickerId);
  }, [cart]);

  const addToCart = useCallback((sticker: StickerItem) => {
    // Check if it's a free sticker and user doesn't qualify
    if (sticker.price === 0 && !qualifiesForFreeStickers) {
      toast.error(
        isArabic 
          ? `أضف منتجات بقيمة ${FREE_STICKER_THRESHOLD_SAR} ريال للحصول على الملصقات المجانية` 
          : `Add ${FREE_STICKER_THRESHOLD_SAR} SAR worth of stickers to unlock free ones!`,
        { duration: 3000 }
      );
      return;
    }

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
  }, [isArabic, qualifiesForFreeStickers]);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  }, []);

  const getTotalItems = useCallback(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const getTotalPrice = useCallback(() => cartTotal, [cartTotal]);

  const handleWhatsAppOrder = useCallback(() => {
    if (cart.length === 0) return;

    const orderLines = cart.map((item, index) => {
      const name = isArabic ? (item.name_ar || item.name) : item.name;
      // Use display_order as SKU reference
      const sku = `S-${String(item.display_order + 1).padStart(3, '0')}`;
      return `• [${sku}] ${name} x${item.quantity} = ${item.price * item.quantity} SAR`;
    });

    const message = isArabic 
      ? `🛒 طلب ملصقات كروليست:\n\n${orderLines.join('\n')}\n\n💰 المجموع: ${getTotalPrice()} ريال`
      : `🛒 Krolist Stickers Order:\n\n${orderLines.join('\n')}\n\n💰 Total: ${getTotalPrice()} SAR`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
  }, [cart, isArabic, getTotalPrice]);

  const filteredStickers = useMemo(() => {
    if (selectedCategory === null) return stickers;
    return stickers.filter(s => s.price === selectedCategory);
  }, [stickers, selectedCategory]);

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
        {/* Preload graffiti font */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap" 
          rel="stylesheet" 
        />
      </Helmet>

      <div className={`min-h-screen overflow-x-hidden ${isArabic ? 'rtl' : 'ltr'}`}>
        {/* Gemini-style Abstract Gradient Background */}
        <GeminiGradientBackground />

        {/* Glassmorphic Header */}
        <div className="sticky top-0 z-40 backdrop-blur-2xl bg-background/20 border-b border-white/10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <motion.div 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center gap-4"
              >
                {/* Stickers Title Image */}
                <motion.img 
                  src={stickersTitleImage}
                  alt={isArabic ? 'ملصقات' : 'Stickers'}
                  className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto object-contain cursor-pointer"
                  draggable={false}
                  initial={{ 
                    filter: 'drop-shadow(0 4px 12px hsla(0, 0%, 0%, 0.4))'
                  }}
                  animate={{ 
                    rotate: [-1, 1, -1],
                    filter: 'drop-shadow(0 4px 12px hsla(0, 0%, 0%, 0.4))'
                  }}
                  whileHover={{ 
                    scale: 1.08,
                    rotate: 0,
                    filter: 'drop-shadow(0 0 25px hsla(31, 98%, 51%, 0.6)) drop-shadow(0 0 50px hsla(330, 85%, 55%, 0.4))'
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ 
                    duration: 0.3,
                    rotate: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                  }}
                />
              </motion.div>

              {/* Cart Button */}
              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="relative h-14 w-14 rounded-2xl backdrop-blur-xl bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-300"
                    >
                      <ShoppingCart className="h-6 w-6 text-white" />
                      {getTotalItems() > 0 && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-gradient-to-r from-primary to-pink-500 text-white text-sm flex items-center justify-center font-black shadow-lg"
                        >
                          {getTotalItems()}
                        </motion.span>
                      )}
                    </Button>
                  </motion.div>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md flex flex-col backdrop-blur-2xl bg-background/90 border-white/10">
                  <SheetHeader className="border-b border-white/10 pb-4">
                    <SheetTitle className="flex items-center gap-2 text-xl font-black text-white">
                      <div className="p-2 bg-gradient-to-r from-primary to-pink-500 rounded-xl">
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
                        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center mb-4"
                      >
                        <Star className="h-12 w-12 text-primary/50" />
                      </motion.div>
                      <p className="text-lg font-bold text-white">
                        {isArabic ? 'السلة فارغة!' : 'Nothing here yet!'}
                      </p>
                      <p className="text-sm text-white/60 mt-1">
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
                            className="flex items-center gap-3 p-3 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10"
                          >
                            <div className="relative">
                              <img 
                                src={getOptimizedImageUrl(item.image_url)} 
                                alt={item.name}
                                className="w-16 h-16 object-contain"
                                draggable={false}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate text-white">
                                {isArabic ? (item.name_ar || item.name) : item.name}
                              </p>
                              <p className="text-xs text-white/50">
                                SKU: S-{String(item.display_order + 1).padStart(3, '0')}
                              </p>
                              <p className="text-primary font-black text-lg">
                                {item.price === 0 ? (isArabic ? 'مجاني' : 'FREE') : `${item.price} SAR`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 backdrop-blur-xl bg-white/10 rounded-full p-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 rounded-full hover:bg-white/20 text-white"
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center font-black text-sm text-white">
                                {item.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 rounded-full hover:bg-white/20 text-white"
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-full text-red-400 hover:bg-red-500/20"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>

                      <div className="border-t border-white/10 pt-4 space-y-4">
                        {/* Free sticker progress */}
                        {!qualifiesForFreeStickers && (
                          <div className="p-3 rounded-xl backdrop-blur-xl bg-primary/10 border border-primary/20">
                            <p className="text-xs text-primary font-medium">
                              {isArabic 
                                ? `أضف ${FREE_STICKER_THRESHOLD_SAR - cartTotal} ريال للحصول على ملصقات مجانية!`
                                : `Add ${FREE_STICKER_THRESHOLD_SAR - cartTotal} SAR more to unlock FREE stickers!`
                              }
                            </p>
                            <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                              <motion.div 
                                className="h-full bg-gradient-to-r from-primary to-pink-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (cartTotal / FREE_STICKER_THRESHOLD_SAR) * 100)}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-white">{isArabic ? 'المجموع' : 'TOTAL'}</span>
                          <span className="text-3xl font-black bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
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

        {/* Frosted Category Buttons */}
        <div className="sticky top-[73px] z-30 backdrop-blur-2xl bg-background/10 py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 justify-center flex-wrap">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(null)}
                className={`px-6 py-3 rounded-2xl font-black text-sm transition-all duration-300 backdrop-blur-xl ${
                  selectedCategory === null
                    ? 'bg-gradient-to-r from-primary via-pink-500 to-purple-500 text-white shadow-xl shadow-primary/30'
                    : 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:text-white'
                }`}
              >
                {isArabic ? '🔥 الكل' : '🔥 ALL'}
              </motion.button>
              {PRICE_CATEGORIES.map((price) => (
                <motion.button
                  key={price}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(price)}
                  className={`px-6 py-3 rounded-2xl font-black text-sm transition-all duration-300 backdrop-blur-xl ${
                    selectedCategory === price
                      ? 'bg-gradient-to-r from-primary via-pink-500 to-purple-500 text-white shadow-xl shadow-primary/30'
                      : 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {price} {isArabic ? 'ر.س' : 'SAR'}
                </motion.button>
              ))}
              {/* Free stickers category */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(0)}
                className={`px-6 py-3 rounded-2xl font-black text-sm transition-all duration-300 backdrop-blur-xl flex items-center gap-2 ${
                  selectedCategory === 0
                    ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white shadow-xl shadow-green-500/30'
                    : 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:text-white'
                }`}
              >
                {!qualifiesForFreeStickers && <Lock className="h-3 w-3" />}
                {isArabic ? '🎁 مجاني' : '🎁 FREE'}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Stickers Grid */}
        <div className="container mx-auto px-4 py-8 pb-32 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-12 w-12 text-primary" />
              </motion.div>
              <p className="text-white/60 font-bold animate-pulse">
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
                <Star className="h-20 w-20 text-white/20" />
              </motion.div>
              <p className="text-xl font-bold text-white/60">
                {isArabic ? 'لا توجد ملصقات هنا!' : 'No stickers here!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {filteredStickers.map((sticker, index) => {
                const isAdded = addedSticker === sticker.id;
                const isOutOfStock = sticker.stock_status === 'out_of_stock';
                const isFreeSticker = sticker.price === 0;
                const isLocked = isFreeSticker && !qualifiesForFreeStickers;
                const inCart = isInCart(sticker.id);
                
                return (
                  <motion.button
                    key={sticker.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: index * 0.03,
                      type: "spring",
                      stiffness: 300,
                      damping: 25
                    }}
                    whileHover={{ 
                      scale: 1.08, 
                      zIndex: 50,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => !isOutOfStock && !isLocked && addToCart(sticker)}
                    disabled={isOutOfStock || isLocked}
                    className={`relative aspect-square focus:outline-none group rounded-2xl ${
                      isOutOfStock || isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    {/* Selected/In-cart highlight ring */}
                    {inCart && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 rounded-2xl ring-4 ring-primary ring-offset-2 ring-offset-transparent"
                        style={{
                          boxShadow: '0 0 30px hsla(31, 98%, 51%, 0.4), inset 0 0 20px hsla(31, 98%, 51%, 0.1)'
                        }}
                      />
                    )}

                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Glassmorphic card background */}
                    <div className={`absolute inset-0 rounded-2xl backdrop-blur-sm transition-all duration-300 ${
                      inCart 
                        ? 'bg-primary/20 border-2 border-primary/50' 
                        : 'bg-white/5 border border-white/10 group-hover:bg-white/10'
                    }`} />
                    
                    {/* The sticker image - optimized */}
                    <img 
                      src={getOptimizedImageUrl(sticker.image_url)} 
                      alt={isArabic ? (sticker.name_ar || sticker.name) : sticker.name}
                      className="relative w-full h-full object-contain p-2 drop-shadow-2xl transition-all duration-300 group-hover:drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] select-none"
                      loading="lazy"
                      draggable={false}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        window.open(getWatermarkedViewUrl(sticker.image_url), '_blank');
                      }}
                    />

                    {/* SKU Badge */}
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-lg backdrop-blur-xl bg-black/40 text-white/70 text-[10px] font-mono">
                      S-{String(sticker.display_order + 1).padStart(3, '0')}
                    </div>

                    {/* Price tag */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                      <div className={`px-4 py-1.5 rounded-full text-white text-xs font-black shadow-lg whitespace-nowrap ${
                        sticker.price === 0 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-green-500/40'
                          : 'bg-gradient-to-r from-primary via-pink-500 to-purple-500 shadow-primary/40'
                      }`}>
                        {sticker.price === 0 ? (isArabic ? 'مجاني' : 'FREE') : `${sticker.price} SAR`}
                      </div>
                    </div>

                    {/* In cart badge */}
                    {inCart && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 p-1.5 bg-primary rounded-full shadow-lg"
                      >
                        <Check className="h-3 w-3 text-white" />
                      </motion.div>
                    )}

                    {/* New badge */}
                    {sticker.is_new && !inCart && (
                      <motion.div 
                        className="absolute top-2 right-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      >
                        <div className="p-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg">
                          <Sparkles className="h-3 w-3 text-white" />
                        </div>
                      </motion.div>
                    )}

                    {/* Featured badge */}
                    {sticker.is_featured && !sticker.is_new && !inCart && (
                      <motion.div 
                        className="absolute top-2 right-2"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg">
                          <Star className="h-3 w-3 text-white" />
                        </div>
                      </motion.div>
                    )}

                    {/* Added feedback */}
                    <AnimatePresence>
                      {isAdded && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1.5, opacity: 1 }}
                          exit={{ scale: 2, opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                          <div className="bg-gradient-to-r from-primary to-pink-500 rounded-full p-4 shadow-2xl">
                            <Check className="h-8 w-8 text-white" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Locked overlay for free stickers - show price over locked */}
                    {isLocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl backdrop-blur-sm bg-black/50">
                        <div className="px-4 py-2 bg-gradient-to-r from-primary via-pink-500 to-purple-500 rounded-2xl shadow-lg mb-2">
                          <span className="text-lg font-black text-white">
                            {sticker.price === 0 ? (isArabic ? 'مجاني' : 'FREE') : `${sticker.price} SAR`}
                          </span>
                        </div>
                        <Lock className="h-6 w-6 text-white/80 mb-1" />
                        <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold text-white/90">
                          {isArabic ? `اشترِ بـ ${FREE_STICKER_THRESHOLD_SAR}+ ريال` : `Spend ${FREE_STICKER_THRESHOLD_SAR}+ SAR`}
                        </span>
                      </div>
                    )}

                    {/* Out of stock */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl backdrop-blur-sm bg-black/40">
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-black text-white/90">
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

        {/* Floating Cart Bar */}
        <AnimatePresence>
          {cart.length > 0 && !isCartOpen && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-4 left-4 right-4 z-50"
            >
              <div className="flex gap-2">
                {/* Clear button */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => setCart([])}
                    className="h-16 px-4 bg-red-500 hover:bg-red-600 text-white font-black shadow-2xl shadow-red-500/40 rounded-3xl border border-white/20"
                  >
                    <Trash2 className="h-6 w-6" />
                  </Button>
                </motion.div>
                {/* Cart button */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                  <Button
                    onClick={() => setIsCartOpen(true)}
                    className="w-full h-16 bg-gradient-to-r from-primary via-pink-500 to-purple-500 hover:from-primary/90 hover:via-pink-500/90 hover:to-purple-500/90 text-white font-black text-lg shadow-2xl shadow-primary/50 rounded-3xl gap-4 border border-white/20"
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CSS for gradient animation */}
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </>
  );
}
