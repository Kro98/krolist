import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAdSlots } from "@/hooks/useAdSlots";
import { ExternalLink, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AdSkeleton } from "@/components/ui/AdSkeleton";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface InterstitialAdProps {
  open: boolean;
  onClose: () => void;
  targetUrl: string;
  productTitle?: string;
}

const COUNTDOWN_SECONDS = 5;

export function InterstitialAd({ open, onClose, targetUrl, productTitle }: InterstitialAdProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const { slots, loading } = useAdSlots();
  const adContainerRef = useRef<HTMLDivElement>(null);
  const adRef = useRef<HTMLModElement>(null);
  const adPushed = useRef(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (open) {
      setCountdown(COUNTDOWN_SECONDS);
      setCanSkip(false);
      adPushed.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (countdown <= 0) { setCanSkip(true); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [open, countdown]);

  useEffect(() => {
    if (!open || loading || adPushed.current) return;
    const timer = setTimeout(() => {
      const el = adContainerRef.current;
      if (el && el.offsetWidth > 0) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          adPushed.current = true;
        } catch (e) {
          console.error("Interstitial AdSense error:", e);
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [open, loading]);

  const handleContinue = () => {
    onClose();
    window.open(targetUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-md p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50 rounded-xl sm:rounded-2xl max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Header - fixed */}
        <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-2 sm:pb-3 shrink-0">
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">
              {isArabic ? 'جاري نقلك إلى' : 'Redirecting you to'}
            </p>
            {productTitle && (
              <p className="text-sm font-semibold text-foreground line-clamp-2 mt-0.5 break-words">
                {productTitle}
              </p>
            )}
          </div>
          {canSkip && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Ad area – scrollable, shrinkable */}
        <div className="px-4 sm:px-5 pb-2 sm:pb-3 min-h-0 flex-1 overflow-y-auto">
          <div
            ref={adContainerRef}
            className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-muted/5 to-muted/15 border border-border/50 shadow-sm flex items-center justify-center"
            style={{ minHeight: 'min(clamp(180px, 40vw, 300px), 50dvh)' }}
          >
            <span className="absolute top-1.5 left-2 text-[9px] font-medium text-muted-foreground/40 uppercase tracking-widest z-10">
              Ad
            </span>
            {slots.clientId ? (
              <>
                {!adPushed.current && <AdSkeleton className="min-h-[clamp(180px,40vw,300px)]" />}
                <ins
                  ref={adRef}
                  className="adsbygoogle"
                  style={{ display: adPushed.current ? "block" : "none", width: "100%", minHeight: 'clamp(180px, 40vw, 300px)' }}
                  data-ad-client={slots.clientId}
                  data-ad-slot={slots.interstitialSlot || "4588888052"}
                  data-ad-format="auto"
                  data-full-width-responsive="true"
                />
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 p-6 sm:p-8 text-center">
                <motion.div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center"
                  animate={{
                    rotate: [0, -8, 6, -4, 8, -6, 3, 0],
                    scale: [1, 1.08, 0.95, 1.05, 0.97, 1.06, 1],
                    y: [0, -3, 2, -4, 1, -2, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                  }}
                >
                  <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </motion.div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isArabic ? 'جاري نقلك للمتجر...' : 'Taking you to the store...'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 shrink-0">
          <AnimatePresence mode="wait">
            {canSkip ? (
              <motion.div key="continue" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <Button onClick={handleContinue} className="w-full gap-2 text-sm">
                  <ExternalLink className="w-4 h-4" />
                  {isArabic ? 'الذهاب للمتجر' : 'Continue to Store'}
                </Button>
              </motion.div>
            ) : (
              <motion.div key="countdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-3">
                <div className="relative w-9 h-9 sm:w-10 sm:h-10">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-muted" strokeWidth="3" />
                    <motion.circle
                      cx="18" cy="18" r="15.5" fill="none" className="stroke-primary" strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={97.4} initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: 97.4 }}
                      transition={{ duration: COUNTDOWN_SECONDS, ease: "linear" }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-bold text-foreground">
                    {countdown}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isArabic ? 'انتظر لحظة...' : 'Please wait...'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
