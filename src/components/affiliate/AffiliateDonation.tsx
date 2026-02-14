import { useState, useEffect } from "react";
import { X, Heart, Play, Copy, Check, ExternalLink, Gift, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useAdSlots } from "@/hooks/useAdSlots";
import { motion, AnimatePresence } from "framer-motion";

interface PromoCode {
  id: string;
  code: string;
  store: string;
  description: string;
  custom_shop_name?: string;
  custom_icon_url?: string;
}

interface AffiliateDonationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AffiliateDonation({ isOpen, onClose }: AffiliateDonationProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const { slots: adSlots } = useAdSlots();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showVideoSupport, setShowVideoSupport] = useState(false);
  const [videoCountdown, setVideoCountdown] = useState(10);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPromoCodes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isVideoPlaying) return;
    
    if (videoCountdown > 0) {
      const timer = setTimeout(() => setVideoCountdown(videoCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF5E5B', '#fcbf47', '#00D4AA', '#FF9F43', '#A855F7']
      });
      toast.success(isArabic ? 'شكراً لدعمك! 💝' : 'Thank you for your support! 💝');
      setIsVideoPlaying(false);
      setShowVideoSupport(false);
      setVideoCountdown(10);
    }
  }, [videoCountdown, isVideoPlaying, isArabic]);

  const fetchPromoCodes = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('promo_codes')
        .select('id, code, store, description, custom_shop_name, custom_icon_url')
        .eq('is_krolist', true)
        .gte('expires', today)
        .limit(6);

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.8 }
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleStartVideo = () => {
    setShowVideoSupport(true);
    setIsVideoPlaying(true);
    setVideoCountdown(10);
  };

  const stagger = {
    animate: { transition: { staggerChildren: 0.06 } }
  };
  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 lg:p-10"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          
          {/* Main Panel */}
          <motion.div 
            className={cn(
              "relative w-full max-w-[92vw] sm:max-w-md lg:max-w-lg max-h-[88vh] overflow-y-auto overflow-x-hidden",
              "rounded-3xl bg-background/80 backdrop-blur-2xl backdrop-saturate-150",
              "border border-white/10",
              "shadow-[0_0_80px_-20px_hsl(var(--primary)/0.25)]",
            )}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 380, mass: 0.7 }}
          >
            {/* Top gradient accent line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

            {/* Ambient glow orbs */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close button */}
            <motion.button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors z-10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </motion.button>

            {/* Content */}
            <motion.div variants={stagger} initial="initial" animate="animate">
              {/* Header */}
              <motion.div variants={fadeUp} className="relative pt-10 pb-2 px-6 text-center">
                <div className="relative inline-flex mb-5">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-primary/30 rounded-2xl blur-2xl animate-pulse" />
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-primary/20 border border-pink-500/20 flex items-center justify-center">
                    <Heart className="w-7 h-7 text-pink-500 fill-pink-500/40" />
                  </div>
                </div>
                
                <h2 className="text-xl font-bold tracking-tight mb-1.5">
                  {isArabic ? 'شكراً لدعمك' : 'Support Krolist'}
                </h2>
                <p className="text-muted-foreground text-xs leading-relaxed max-w-[260px] mx-auto">
                  {isArabic 
                    ? 'دعمك يساعدنا في الحفاظ على Krolist مجانيًا للجميع'
                    : 'Help keep Krolist free & independent for everyone'}
                </p>
              </motion.div>

              {/* Promo Codes */}
              {promoCodes.length > 0 && (
                <motion.div variants={fadeUp} className="px-5 pb-3 pt-2">
                  <div className="flex items-center gap-2 mb-2.5 px-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {isArabic ? 'أكواد خصم حصرية' : 'Exclusive Codes'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {promoCodes.map((promo, i) => (
                      <motion.button
                        key={promo.id}
                        onClick={() => handleCopyCode(promo.code)}
                        className={cn(
                          "group relative p-3 rounded-xl text-left overflow-hidden",
                          "bg-white/[0.04] hover:bg-white/[0.08]",
                          "border border-white/[0.06] hover:border-primary/30",
                          "transition-all duration-300"
                        )}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider truncate">
                              {promo.custom_shop_name || promo.store}
                            </span>
                            {copiedCode === promo.code ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                          <p className="font-mono text-sm font-bold text-primary truncate">
                            {promo.code}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Divider */}
              <div className="mx-6 my-2 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

              {/* Support Options */}
              <motion.div variants={fadeUp} className="px-5 pb-6 pt-2 space-y-2.5">
                {/* Video Support */}
                <motion.button
                  onClick={handleStartVideo}
                  disabled={isVideoPlaying}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl text-left",
                    "bg-gradient-to-r from-primary/[0.08] to-purple-500/[0.06]",
                    "border border-primary/10 hover:border-primary/25",
                    "transition-all duration-300 group"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      <Play className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {isArabic ? 'شاهد فيديو للدعم' : 'Watch to Support'}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                      {isArabic ? '10 ثواني فقط • مجاني' : '10s only • Free & easy'}
                    </p>
                  </div>
                </motion.button>

                {/* Ko-fi */}
                <motion.a
                  href="https://ko-fi.com/krolist"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl",
                    "bg-gradient-to-r from-[hsl(2,90%,65%)]/[0.08] to-[hsl(2,90%,65%)]/[0.04]",
                    "border border-[hsl(2,90%,65%)]/10 hover:border-[hsl(2,90%,65%)]/25",
                    "transition-all duration-300 group"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-[hsl(2,90%,65%)]/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-2.5 rounded-xl bg-[hsl(2,90%,65%)]/10 group-hover:bg-[hsl(2,90%,65%)]/15 transition-colors">
                      <Heart className="w-5 h-5 text-[hsl(2,90%,65%)]" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[hsl(2,90%,65%)]">
                      {isArabic ? 'ادعمنا على Ko-fi' : 'Buy us a Coffee'}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                      {isArabic ? 'قهوة افتراضية 💕' : 'Support on Ko-fi 💕'}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                </motion.a>
              </motion.div>
            </motion.div>

            {/* Video Support Overlay */}
            <AnimatePresence>
              {showVideoSupport && (
                <motion.div
                  className="absolute inset-0 bg-background/95 backdrop-blur-2xl rounded-3xl flex flex-col items-center justify-center p-4 sm:p-6 z-20 overflow-y-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="text-center space-y-4 w-full max-w-sm mx-auto">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="50%" cy="50%" r="45%" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
                        <circle
                          cx="50%" cy="50%" r="45%" fill="none" stroke="currentColor" strokeWidth="3"
                          strokeDasharray={276.46}
                          strokeDashoffset={276.46 * (1 - videoCountdown / 10)}
                          strokeLinecap="round"
                          className="text-primary transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl sm:text-3xl font-bold tabular-nums">{videoCountdown}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-semibold mb-1">
                        {isArabic ? 'شكراً لدعمك!' : 'Thank you!'}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {isArabic ? 'يتم تحميل الإعلان...' : 'Loading advertisement...'}
                      </p>
                    </div>

                    <div className="w-full min-h-[280px] sm:min-h-[300px] bg-white/[0.03] rounded-2xl flex items-center justify-center border border-dashed border-primary/20 p-2">
                      <ins
                        className="adsbygoogle"
                        style={{ display: 'block', width: '100%', minHeight: '260px' }}
                        data-ad-client={adSlots.clientId}
                        data-ad-slot={adSlots.donationSlot}
                        data-ad-format="fluid"
                        data-full-width-responsive="true"
                      />
                    </div>

                    <button
                      onClick={() => {
                        setShowVideoSupport(false);
                        setIsVideoPlaying(false);
                        setVideoCountdown(10);
                      }}
                      className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors py-2"
                    >
                      {isArabic ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
