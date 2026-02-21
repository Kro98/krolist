import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAdSlots } from "@/hooks/useAdSlots";
import { ExternalLink, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  // Reset on open
  useEffect(() => {
    if (open) {
      setCountdown(COUNTDOWN_SECONDS);
      setCanSkip(false);
      adPushed.current = false;
    }
  }, [open]);

  // Countdown timer
  useEffect(() => {
    if (!open) return;
    if (countdown <= 0) {
      setCanSkip(true);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [open, countdown]);

  // Push ad only after dialog renders and container has width
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
    }, 300); // wait for dialog animation to finish
    return () => clearTimeout(timer);
  }, [open, loading]);

  const handleContinue = () => {
    onClose();
    window.open(targetUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/50">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">
              {isArabic ? 'جاري نقلك إلى' : 'Redirecting you to'}
            </p>
            {productTitle && (
              <p className="text-sm font-semibold text-foreground truncate mt-0.5">
                {productTitle}
              </p>
            )}
          </div>
          {canSkip && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Ad area */}
        <div className="px-5 pb-3">
          <div
            ref={adContainerRef}
            className="relative w-full rounded-xl overflow-hidden bg-muted/15 border border-border/20 min-h-[250px] flex items-center justify-center"
          >
            <span className="absolute top-1.5 left-2 text-[9px] font-medium text-muted-foreground/40 uppercase tracking-widest z-10">
              Ad
            </span>
            {slots.clientId ? (
              <ins
                ref={adRef}
                className="adsbygoogle"
                style={{ display: "block", width: "100%", minHeight: "250px" }}
                data-ad-client={slots.clientId}
                data-ad-slot={slots.interstitialSlot || undefined}
                data-ad-format="auto"
                data-full-width-responsive="true"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? 'جاري نقلك للمتجر...' : 'Taking you to the store...'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with countdown / continue */}
        <div className="px-5 pb-5">
          <AnimatePresence mode="wait">
            {canSkip ? (
              <motion.div
                key="continue"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Button onClick={handleContinue} className="w-full gap-2">
                  <ExternalLink className="w-4 h-4" />
                  {isArabic ? 'الذهاب للمتجر' : 'Continue to Store'}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="countdown"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-3"
              >
                <div className="relative w-10 h-10">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18" cy="18" r="15.5"
                      fill="none"
                      className="stroke-muted"
                      strokeWidth="3"
                    />
                    <motion.circle
                      cx="18" cy="18" r="15.5"
                      fill="none"
                      className="stroke-primary"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={97.4}
                      initial={{ strokeDashoffset: 0 }}
                      animate={{ strokeDashoffset: 97.4 }}
                      transition={{ duration: COUNTDOWN_SECONDS, ease: "linear" }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                    {countdown}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
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
