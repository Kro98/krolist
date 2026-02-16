import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { edgeFunctionUrl } from "@/config/supabase";
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
  Lock,
  ChevronDown
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

import { SiteBackground } from "@/components/SiteBackground";

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

export default function Stickers() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [addedSticker, setAddedSticker] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const DEFAULT_IMAGE_WIDTH = 280;
  const DEFAULT_IMAGE_QUALITY = 70;

  const [pageBgEnabled, setPageBgEnabled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  useEffect(() => {
    fetchStickers();
    supabase.from('page_content').select('content_en').eq('page_key', 'bg_enabled_stickers').maybeSingle()
      .then(({ data }) => { if (data?.content_en === 'true') setPageBgEnabled(true); });
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

  const getOptimizedImageUrl = useCallback((url: string | null) => {
    if (!url) return '/placeholder.svg';
    if (url.includes('supabase') && url.includes('storage')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}quality=${DEFAULT_IMAGE_QUALITY}&width=${DEFAULT_IMAGE_WIDTH}`;
    }
    return url;
  }, []);

  const getWatermarkedViewUrl = useCallback((url: string | null) => {
    if (!url) return '/placeholder.svg';
    const baseUrl = edgeFunctionUrl('process-sticker-image');
    return `${baseUrl}?url=${encodeURIComponent(url)}&watermark=true`;
  }, []);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const qualifiesForFreeStickers = cartTotal >= FREE_STICKER_THRESHOLD_SAR;

  const isInCart = useCallback((stickerId: string) => cart.some(item => item.id === stickerId), [cart]);

  const addToCart = useCallback((sticker: StickerItem) => {
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
        return prev.map(item => item.id === sticker.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...sticker, quantity: 1 }];
    });
    setAddedSticker(sticker.id);
    setTimeout(() => setAddedSticker(null), 1200);
    toast.success(isArabic ? '✨ تمت الإضافة!' : '✨ Added!', {
      duration: 1000, position: 'top-center',
      style: { background: 'hsl(var(--primary))', color: 'white', fontWeight: 'bold', border: 'none' }
    });
  }, [isArabic, qualifiesForFreeStickers]);

  const removeFromCart = useCallback((id: string) => setCart(prev => prev.filter(item => item.id !== id)), []);
  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  }, []);
  const getTotalItems = useCallback(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const getTotalPrice = useCallback(() => cartTotal, [cartTotal]);

  const handleWhatsAppOrder = useCallback(() => {
    if (cart.length === 0) return;
    const orderLines = cart.map((item) => {
      const name = isArabic ? (item.name_ar || item.name) : item.name;
      const sku = `S-${String(item.display_order + 1).padStart(3, '0')}`;
      return `• [${sku}] ${name} x${item.quantity} = ${item.price * item.quantity} SAR`;
    });
    const message = isArabic 
      ? `🛒 طلب ملصقات كروليست:\n\n${orderLines.join('\n')}\n\n💰 المجموع: ${getTotalPrice()} ريال`
      : `🛒 Krolist Stickers Order:\n\n${orderLines.join('\n')}\n\n💰 Total: ${getTotalPrice()} SAR`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  }, [cart, isArabic, getTotalPrice]);

  const filteredStickers = useMemo(() => {
    if (selectedCategory === null) return stickers;
    return stickers.filter(s => s.price === selectedCategory);
  }, [stickers, selectedCategory]);

  // Pick random floating hero stickers (up to 6)
  const heroStickers = useMemo(() => {
    if (stickers.length === 0) return [];
    const shuffled = [...stickers].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(6, stickers.length));
  }, [stickers]);

  // Slot machine: create a shuffled set different from hero stickers
  const slotStickers = useMemo(() => {
    if (stickers.length === 0) return [];
    const heroIds = new Set(heroStickers.map(s => s.id));
    const remaining = stickers.filter(s => !heroIds.has(s.id));
    // If not enough remaining, use all stickers
    const pool = remaining.length >= 4 ? remaining : stickers;
    // Triple the array for seamless looping
    return [...pool, ...pool, ...pool];
  }, [stickers, heroStickers]);

  const scrollToGrid = () => {
    gridRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Floating sticker positions - hugging the corners of the text block
  const floatingPositions = [
    // Top-left of KROLIST
    { top: '28%', left: '8%', size: 'w-16 h-16 sm:w-36 sm:h-36 md:w-44 md:h-44', rotate: -12, delay: 0 },
    { top: '25%', right: '6%', size: 'w-14 h-14 sm:w-32 sm:h-32 md:w-40 md:h-40', rotate: 15, delay: 0.15 },
    { top: '58%', left: '4%', size: 'w-14 h-14 sm:w-28 sm:h-28 md:w-36 md:h-36', rotate: -20, delay: 0.3 },
    { top: '60%', right: '4%', size: 'w-16 h-16 sm:w-34 sm:h-34 md:w-42 md:h-42', rotate: 18, delay: 0.1 },
    { top: '44%', left: '2%', size: 'w-12 h-12 sm:w-24 sm:h-24 md:w-28 md:h-28', rotate: -30, delay: 0.5 },
    { top: '40%', right: '2%', size: 'w-12 h-12 sm:w-26 sm:h-26 md:w-32 md:h-32', rotate: 22, delay: 0.25 },
  ];

  return (
    <>
      <Helmet>
        <title>{isArabic ? 'ملصقات كروليست | كروليست' : 'Krolist Stickers | Krolist'}</title>
        <meta name="description" content={isArabic ? 'اكتشف مجموعة ملصقات كروليست الحصرية' : 'Discover the exclusive Krolist sticker collection'} />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=swap" rel="stylesheet" />
      </Helmet>

      <div className={`min-h-screen overflow-x-hidden relative bg-black scroll-smooth ${isArabic ? 'rtl' : 'ltr'}`} style={{ willChange: 'auto' }}>
        {pageBgEnabled && <SiteBackground />}

        {/* ─── SLOT MACHINE ROLLER (TOP) ─── */}
        <section className="relative py-4 sm:py-8 overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-white/[0.02] to-black" />
          <div className="relative">
            <div className="relative h-20 sm:h-44 overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-40 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-40 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
              <div className="flex items-center gap-5 sm:gap-12 absolute top-0 h-full roller-track">
                {slotStickers.map((sticker, i) => (
                  <div key={`slot-${sticker.id}-${i}`} className="flex-shrink-0 w-18 h-18 sm:w-40 sm:h-40">
                    <img
                      src={getOptimizedImageUrl(sticker.image_url)}
                      alt=""
                      className="w-full h-full object-contain select-none"
                      style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}
                      loading="eager"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── HERO: FULL VIEWPORT ─── */}
        <motion.section
          ref={heroRef}
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative min-h-[55vh] sm:min-h-[70vh] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Subtle radial gradient bg */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.08)_0%,_transparent_70%)]" />

          {/* BIG TEXT */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative text-center select-none"
          >
            <h1
              className="leading-[0.82] tracking-[-0.06em]"
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900 }}
            >
              <motion.span
                className="block text-[16vw] sm:text-[16vw] md:text-[14vw] text-white uppercase relative z-30"
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                style={{
                  textShadow: '0 0 80px hsl(var(--primary) / 0.3), 0 4px 0 hsl(var(--primary) / 0.15)',
                }}
              >
                KROLIST
              </motion.span>
              <motion.span
                className="block text-[18vw] sm:text-[18vw] md:text-[16vw] uppercase relative z-10"
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(330 85% 55%), hsl(270 80% 60%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: 'none',
                  filter: 'drop-shadow(0 4px 30px hsl(var(--primary) / 0.4))',
                }}
              >
                STICKERS
              </motion.span>
            </h1>
          </motion.div>

          {/* Floating sticker images - IN FRONT of text */}
          {heroStickers.map((sticker, i) => {
            const pos = floatingPositions[i % floatingPositions.length];
            return (
              <motion.div
                key={sticker.id}
                className={`absolute ${pos.size} pointer-events-none select-none z-20`}
                style={{
                  top: pos.top,
                  left: pos.left,
                  right: pos.right,
                  willChange: 'transform',
                }}
                initial={{ opacity: 0, scale: 0.5, rotate: pos.rotate }}
                animate={{ opacity: 1, scale: 1, rotate: pos.rotate }}
                transition={{ delay: pos.delay + 0.5, duration: 0.8 }}
              >
                <div
                  className="w-full h-full sticker-float"
                  style={{ animationDelay: `${i * 0.7}s`, animationDuration: `${4 + i * 0.5}s` }}
                >
                  <img
                    src={getOptimizedImageUrl(sticker.image_url)}
                    alt=""
                    className="w-full h-full object-contain"
                    style={{
                      filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.7)) drop-shadow(0 10px 20px rgba(0,0,0,0.4))',
                    }}
                    loading="eager"
                    draggable={false}
                  />
                </div>
              </motion.div>
            );
          })}

          {/* Scroll down indicator */}
          <motion.button
            onClick={scrollToGrid}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-xs font-bold uppercase tracking-widest">
              {isArabic ? 'اكتشف المزيد' : 'Explore'}
            </span>
            <ChevronDown className="h-5 w-5" />
          </motion.button>
        </motion.section>

        {/* ─── STICKY HEADER (Cart + Filters) ─── */}
        <div className="sticky top-0 z-40 backdrop-blur-2xl bg-black/60 border-b border-white/10">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center justify-between gap-3">
              {/* Filter pills */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
                {/* All */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(null)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    selectedCategory === null
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/15'
                  }`}
                >
                  {isArabic ? 'الكل' : 'ALL'}
                </motion.button>

                {PRICE_CATEGORIES.map((price) => (
                  <motion.button
                    key={price}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(price)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                      selectedCategory === price
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/15'
                    }`}
                  >
                    {price} {isArabic ? 'ر.س' : 'SAR'}
                  </motion.button>
                ))}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(0)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    selectedCategory === 0
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/15'
                  }`}
                >
                  {!qualifiesForFreeStickers && <Lock className="h-3 w-3" />}
                  🎁 {isArabic ? 'مجاني' : 'FREE'}
                </motion.button>
              </div>

              {/* Cart Button */}
              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="relative h-10 w-10 rounded-full bg-white/10 border-white/20 hover:bg-white/20"
                    >
                      <ShoppingCart className="h-4 w-4 text-white" />
                      {getTotalItems() > 0 && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-black"
                        >
                          {getTotalItems()}
                        </motion.span>
                      )}
                    </Button>
                  </motion.div>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md flex flex-col backdrop-blur-2xl bg-black/90 border-white/10">
                  <SheetHeader className="border-b border-white/10 pb-4">
                    <SheetTitle className="flex items-center gap-2 text-xl font-black text-white">
                      <div className="p-2 bg-primary rounded-xl">
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
                        className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mb-4"
                      >
                        <Star className="h-12 w-12 text-white/20" />
                      </motion.div>
                      <p className="text-lg font-bold text-white">{isArabic ? 'السلة فارغة!' : 'Nothing here yet!'}</p>
                      <p className="text-sm text-white/40 mt-1">{isArabic ? 'اضغط على الملصقات لإضافتها' : 'Tap those stickers to add \'em'}</p>
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
                            className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10"
                          >
                            <img src={getOptimizedImageUrl(item.image_url)} alt={item.name} className="w-16 h-16 object-contain" draggable={false} />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate text-white">{isArabic ? (item.name_ar || item.name) : item.name}</p>
                              <p className="text-xs text-white/40">SKU: S-{String(item.display_order + 1).padStart(3, '0')}</p>
                              <p className="text-primary font-black text-lg">
                                {item.price === 0 ? (isArabic ? 'مجاني' : 'FREE') : `${item.price} SAR`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 bg-white/10 rounded-full p-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-white/20 text-white" onClick={() => updateQuantity(item.id, -1)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center font-black text-sm text-white">{item.quantity}</span>
                              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-white/20 text-white" onClick={() => updateQuantity(item.id, 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-red-400 hover:bg-red-500/20" onClick={() => removeFromCart(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>

                      <div className="border-t border-white/10 pt-4 space-y-4">
                        {!qualifiesForFreeStickers && (
                          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                            <p className="text-xs text-primary font-medium">
                              {isArabic 
                                ? `أضف ${FREE_STICKER_THRESHOLD_SAR - cartTotal} ريال للحصول على ملصقات مجانية!`
                                : `Add ${FREE_STICKER_THRESHOLD_SAR - cartTotal} SAR more to unlock FREE stickers!`}
                            </p>
                            <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                              <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (cartTotal / FREE_STICKER_THRESHOLD_SAR) * 100)}%` }} transition={{ duration: 0.5 }} />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-white">{isArabic ? 'المجموع' : 'TOTAL'}</span>
                          <span className="text-3xl font-black text-primary">{getTotalPrice()} <span className="text-base text-white/60">SAR</span></span>
                        </div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button className="w-full gap-3 h-14 text-lg font-black bg-green-600 hover:bg-green-700 rounded-2xl" onClick={handleWhatsAppOrder}>
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

        {/* ─── STICKERS GRID ─── */}
        <div ref={gridRef} className="container mx-auto px-3 sm:px-4 py-6 sm:py-12 pb-28 sm:pb-32 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Loader2 className="h-12 w-12 text-primary" />
              </motion.div>
              <p className="text-white/40 font-bold animate-pulse">{isArabic ? 'جاري التحميل...' : 'Loading...'}</p>
            </div>
          ) : filteredStickers.length === 0 ? (
            <div className="text-center py-20">
              <Star className="h-20 w-20 text-white/10 mx-auto mb-4" />
              <p className="text-xl font-bold text-white/40">{isArabic ? 'لا توجد ملصقات هنا!' : 'No stickers here!'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-8">
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
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ delay: (index % 5) * 0.04, duration: 0.4, ease: "easeOut" }}
                    onClick={() => !isOutOfStock && !isLocked && addToCart(sticker)}
                    disabled={isOutOfStock || isLocked}
                    className={`relative aspect-square focus:outline-none group transition-transform duration-200 ease-out hover:scale-110 hover:z-50 active:scale-95 ${
                      isOutOfStock || isLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    style={{ willChange: 'transform' }}
                  >
                    {/* Hover glow */}
                    <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                      style={{ boxShadow: inCart ? '0 0 40px hsl(var(--primary) / 0.3)' : '0 0 40px rgba(255,255,255,0.05)' }} 
                    />

                    {/* In-cart ring */}
                    {inCart && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 rounded-2xl ring-2 ring-primary/60"
                      />
                    )}

                    {/* Sticker image */}
                    <img 
                      src={getOptimizedImageUrl(sticker.image_url)} 
                      alt={isArabic ? (sticker.name_ar || sticker.name) : sticker.name}
                      className="relative w-full h-full object-contain p-3 select-none transition-all duration-300"
                      style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))' }}
                      loading="lazy"
                      draggable={false}
                      onContextMenu={(e) => { e.preventDefault(); window.open(getWatermarkedViewUrl(sticker.image_url), '_blank'); }}
                    />

                    {/* Name label on hover */}
                    <motion.div
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    >
                      <div className="px-3 py-1 rounded-full bg-black/80 backdrop-blur text-white text-[10px] font-bold whitespace-nowrap border border-white/10">
                        {isArabic ? (sticker.name_ar || sticker.name) : sticker.name}
                      </div>
                    </motion.div>

                    {/* SKU */}
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/50 text-white/40 text-[9px] font-mono">
                      S-{String(sticker.display_order + 1).padStart(3, '0')}
                    </div>

                    {/* In cart check */}
                    {inCart && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2 p-1 bg-primary rounded-full">
                        <Check className="h-3 w-3 text-white" />
                      </motion.div>
                    )}

                    {/* New badge */}
                    {sticker.is_new && !inCart && (
                      <div className="absolute top-2 right-2 p-1 bg-yellow-500 rounded-full">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                    )}

                    {/* Featured badge */}
                    {sticker.is_featured && !sticker.is_new && !inCart && (
                      <div className="absolute top-2 right-2 p-1 bg-purple-500 rounded-full">
                        <Star className="h-3 w-3 text-white" />
                      </div>
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
                          <div className="bg-primary rounded-full p-4">
                            <Check className="h-8 w-8 text-white" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Locked overlay */}
                    {isLocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/60">
                        <Lock className="h-6 w-6 text-white/60 mb-1" />
                        <span className="px-2 py-0.5 bg-white/10 rounded-full text-[9px] font-bold text-white/70">
                          {isArabic ? `${FREE_STICKER_THRESHOLD_SAR}+ ريال` : `${FREE_STICKER_THRESHOLD_SAR}+ SAR`}
                        </span>
                      </div>
                    )}

                    {/* Out of stock */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                        <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-black text-white/70">
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

        {/* ─── FLOATING CART BAR ─── */}
        <AnimatePresence>
          {cart.length > 0 && !isCartOpen && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-4 left-4 right-4 z-50"
            >
              <div className="flex gap-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={() => setCart([])} className="h-14 px-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                  <Button
                    onClick={() => setIsCartOpen(true)}
                    className="w-full h-14 bg-white text-black hover:bg-white/90 font-black text-base rounded-2xl gap-3"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span className="flex items-center gap-2">
                      <span className="bg-black/10 px-2.5 py-0.5 rounded-full text-sm">{getTotalItems()}</span>
                      <span className="text-lg">{getTotalPrice()} SAR</span>
                    </span>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes sticker-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .sticker-float {
          animation: sticker-bob ease-in-out infinite;
          will-change: transform;
        }
        
        @keyframes roller-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .roller-track {
          animation: roller-scroll 30s linear infinite;
          will-change: transform;
        }
      `}</style>
    </>
  );
}
