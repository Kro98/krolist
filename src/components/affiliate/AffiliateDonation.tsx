import { useState, useEffect } from "react";
import { X, Heart, Play, Copy, Check, ExternalLink, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";

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

  // Video countdown timer
  useEffect(() => {
    if (!isVideoPlaying) return;
    
    if (videoCountdown > 0) {
      const timer = setTimeout(() => setVideoCountdown(videoCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Video completed
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      
      {/* Main Panel */}
      <div 
        className={cn(
          "relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl",
          "bg-gradient-to-b from-background/95 to-background/90",
          "backdrop-blur-2xl backdrop-saturate-150",
          "border border-white/20 dark:border-white/10",
          "shadow-2xl shadow-pink-500/10",
          "animate-in zoom-in-95 duration-300"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="relative pt-8 pb-4 px-6 text-center">
          {/* Animated heart */}
          <div className="relative inline-flex mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-red-500/30 rounded-full blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/20 to-red-500/20 border border-pink-500/30 flex items-center justify-center">
              <Heart className="w-8 h-8 text-pink-500 fill-pink-500/30" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-2">
            {isArabic ? 'شكراً لدعمك' : 'Thank You for Your Support'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isArabic 
              ? 'دعمك يساعدنا في الحفاظ على Krolist مجانيًا للجميع'
              : 'Your support helps keep Krolist free for everyone'}
          </p>
        </div>

        {/* Promo Codes Section */}
        {promoCodes.length > 0 && (
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">
                {isArabic ? 'أكواد خصم حصرية' : 'Exclusive Discount Codes'}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {promoCodes.map((promo) => (
                <button
                  key={promo.id}
                  onClick={() => handleCopyCode(promo.code)}
                  className={cn(
                    "group relative p-3 rounded-xl text-left",
                    "bg-muted/30 hover:bg-muted/50 border border-border/50",
                    "transition-all duration-200 hover:scale-[1.02]"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground truncate">
                      {promo.custom_shop_name || promo.store}
                    </span>
                    {copiedCode === promo.code ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <p className="font-mono text-sm font-semibold text-primary truncate">
                    {promo.code}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Support Options */}
        <div className="px-6 pb-6 space-y-3">
          {/* Video Support Button */}
          <button
            onClick={handleStartVideo}
            disabled={isVideoPlaying}
            className={cn(
              "w-full flex items-center justify-center gap-3 p-4 rounded-xl",
              "bg-gradient-to-r from-primary/10 to-purple-500/10",
              "border border-primary/20 hover:border-primary/40",
              "transition-all duration-300 hover:scale-[1.02]",
              "group"
            )}
          >
            <div className="p-2 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
              <Play className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left flex-1">
              <p className="font-medium">
                {isArabic ? 'شاهد فيديو للدعم المجاني' : 'Watch a Video for Free Support'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isArabic ? '10 ثواني فقط • لا تكلفة عليك' : '10 seconds only • No cost to you'}
              </p>
            </div>
          </button>

          {/* Ko-fi Link */}
          <a
            href="https://ko-fi.com/krolist"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "w-full flex items-center justify-center gap-3 p-4 rounded-xl",
              "bg-[#FF5E5B]/10 hover:bg-[#FF5E5B]/20",
              "border border-[#FF5E5B]/20 hover:border-[#FF5E5B]/40",
              "transition-all duration-300 hover:scale-[1.02]",
              "group"
            )}
          >
            <div className="p-2 rounded-full bg-[#FF5E5B]/20 group-hover:bg-[#FF5E5B]/30 transition-colors">
              <Heart className="w-5 h-5 text-[#FF5E5B]" />
            </div>
            <div className="text-left flex-1">
              <p className="font-medium text-[#FF5E5B]">
                {isArabic ? 'ادعمنا على Ko-fi' : 'Support on Ko-fi'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isArabic ? 'قهوة افتراضية 💕' : 'Buy us a virtual coffee 💕'}
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
        </div>

        {/* Video Support Overlay */}
        {showVideoSupport && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-xl rounded-3xl flex flex-col items-center justify-center p-4 sm:p-6 z-20 overflow-y-auto">
            <div className="text-center space-y-4 w-full max-w-sm mx-auto">
              {/* Countdown Circle */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-muted"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={276.46}
                    strokeDashoffset={276.46 * (1 - videoCountdown / 10)}
                    className="text-primary transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl font-bold">{videoCountdown}</span>
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-1">
                  {isArabic ? 'شكراً لدعمك!' : 'Thank you for your support!'}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isArabic 
                    ? 'يتم تحميل الإعلان...'
                    : 'Loading advertisement...'}
                </p>
              </div>

              {/* Ad Container - responsive sizing */}
              <div className="w-full min-h-[280px] sm:min-h-[300px] bg-muted/20 rounded-xl flex items-center justify-center border-2 border-dashed border-primary/30 p-2">
                <ins
                  className="adsbygoogle"
                  style={{ display: 'block', width: '100%', minHeight: '260px' }}
                  data-ad-client="ca-pub-2793689855806571"
                  data-ad-slot=""
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
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
