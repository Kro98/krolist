import { Heart, Coffee, CreditCard } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { useLanguage } from "@/contexts/LanguageContext";

declare global {
  interface Window {
    kofiWidgetOverlay?: {
      draw: (username: string, config: Record<string, string>) => void;
    };
  }
}

export default function Donation() {
  const { t, language } = useLanguage();

  useEffect(() => {
    sessionStorage.removeItem('kofi-dismissed');
    const script = document.createElement('script');
    script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
    script.async = true;
    script.onload = () => {
      if (window.kofiWidgetOverlay) {
        window.kofiWidgetOverlay.draw('krolist', {
          'type': 'floating-chat',
          'floating-chat.donateButton.text': 'Donate',
          'floating-chat.donateButton.background-color': '#fcbf47',
          'floating-chat.donateButton.text-color': '#323842'
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleDonate = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF5E5B', '#fcbf47', '#00D4AA', '#7C3AED', '#F472B6']
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FF5E5B', '#fcbf47', '#00D4AA']
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FF5E5B', '#fcbf47', '#00D4AA']
      });
    }, 150);
    
    window.open('https://ko-fi.com/krolist', '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-float"
          style={{ animationDuration: '8s' }}
        />
        <div 
          className="absolute bottom-1/4 -right-32 w-80 h-80 bg-[#FF5E5B]/15 rounded-full blur-[100px] animate-float"
          style={{ animationDuration: '10s', animationDelay: '2s' }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#fcbf47]/10 rounded-full blur-[120px] animate-float"
          style={{ animationDuration: '12s', animationDelay: '1s' }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto space-y-8">
        
        {/* Floating Heart Icon */}
        <div 
          className="relative animate-float"
          style={{ animationDuration: '3s' }}
        >
          <div className="absolute inset-0 bg-[#FF5E5B]/30 rounded-full blur-xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#FF5E5B] to-[#FF5E5B]/70 flex items-center justify-center shadow-2xl shadow-[#FF5E5B]/30">
            <Heart className="h-12 w-12 text-white fill-white" />
          </div>
        </div>

        {/* Title with Staggered Animation */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
            {t('donation.title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {t('donation.subtitle')}
          </p>
        </div>

        {/* Payment Card - Glassmorphism */}
        <div 
          className="w-full animate-fade-in"
          style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}
        >
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#FF5E5B]/20 via-[#fcbf47]/20 to-primary/20 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Card */}
            <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 space-y-6">
              {/* Ko-fi Button */}
              <Button 
                onClick={handleDonate} 
                size="lg" 
                className="w-full gap-3 text-lg py-6 bg-[#FF5E5B] hover:bg-[#FF5E5B]/90 text-white shadow-lg shadow-[#FF5E5B]/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#FF5E5B]/30"
              >
                <Coffee className="h-5 w-5" />
                {t('donation.buyMeCoffee')}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t('donation.paymentMethods')}
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              {/* Payment Methods */}
              <div className="flex items-center justify-center gap-3">
                {/* Apple Pay */}
                <div className="w-12 h-8 rounded-md bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-muted-foreground">
                    <path d="M17.72 13.2c-.03-2.7 2.2-4 2.3-4.06-1.25-1.84-3.2-2.1-3.9-2.13-1.66-.17-3.24 1-4.08 1-.84 0-2.14-.96-3.52-.94-1.81.03-3.48 1.06-4.41 2.7-1.88 3.27-.48 8.12 1.35 10.78.9 1.3 1.97 2.76 3.38 2.71 1.36-.05 1.87-.88 3.51-.88 1.64 0 2.1.88 3.53.85 1.46-.02 2.38-1.33 3.27-2.64 1.03-1.51 1.45-2.97 1.48-3.05-.03-.01-2.83-1.09-2.86-4.32l-.05-.02z"/>
                    <path d="M14.94 3.52c.75-.9 1.25-2.16 1.11-3.42-1.08.04-2.38.72-3.15 1.62-.69.8-1.3 2.08-1.13 3.3 1.2.09 2.42-.61 3.17-1.5z"/>
                  </svg>
                </div>
                
                {/* Google Pay */}
                <div className="w-12 h-8 rounded-md bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-muted-foreground">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                  </svg>
                </div>
                
                {/* PayPal */}
                <div className="w-12 h-8 rounded-md bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-muted-foreground">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h2.524a.56.56 0 0 0 .555-.479l.921-5.828a.564.564 0 0 1 .557-.479h1.746c4.506 0 8.029-1.832 9.055-7.131.172-.891.225-1.669.153-2.338-.017-.165-.052-.325-.092-.48-.102-.386-.247-.75-.44-1.085-.133-.212-.283-.415-.46-.6z"/>
                  </svg>
                </div>
                
                {/* Cards */}
                <div className="w-12 h-8 rounded-md bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thank You Message */}
        <p 
          className="text-sm text-muted-foreground animate-fade-in"
          style={{ animationDelay: '0.6s', animationFillMode: 'backwards' }}
        >
          {t('donation.thankYou')} ❤️
        </p>
      </div>
    </div>
  );
}
