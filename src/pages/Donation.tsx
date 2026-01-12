import { Heart, Coffee, Sparkles, ArrowRight, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
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

// Floating particle component
function FloatingParticle({ delay, duration, size, left }: { delay: number; duration: number; size: number; left: string }) {
  return (
    <div
      className="absolute rounded-full bg-primary/20 animate-pulse"
      style={{
        width: size,
        height: size,
        left,
        bottom: '-20px',
        animation: `floatUp ${duration}s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}

export default function Donation() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [isHovering, setIsHovering] = useState(false);

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
    // Fire confetti burst
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#FF5E5B', '#fcbf47', '#00D4AA', '#7C3AED', '#F472B6']
    });

    // Fire side confetti
    setTimeout(() => {
      confetti({
        particleCount: 75,
        angle: 60,
        spread: 65,
        origin: { x: 0 },
        colors: ['#FF5E5B', '#fcbf47', '#00D4AA']
      });
      confetti({
        particleCount: 75,
        angle: 120,
        spread: 65,
        origin: { x: 1 },
        colors: ['#FF5E5B', '#fcbf47', '#00D4AA']
      });
    }, 150);
    
    window.open('https://ko-fi.com/krolist', '_blank');
  };

  return (
    <div className="min-h-screen pb-20 overflow-hidden">
      {/* Custom keyframes for floating animation */}
      <style>{`
        @keyframes floatUp {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          50% {
            transform: translateY(-50vh) scale(1.2);
            opacity: 0.3;
          }
          100% {
            transform: translateY(-100vh) scale(0.8);
            opacity: 0;
          }
        }
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px hsl(var(--primary) / 0.3), 0 0 40px hsl(var(--primary) / 0.1);
          }
          50% {
            box-shadow: 0 0 30px hsl(var(--primary) / 0.5), 0 0 60px hsl(var(--primary) / 0.2);
          }
        }
        @keyframes heart-beat {
          0%, 100% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.1);
          }
          50% {
            transform: scale(1);
          }
          75% {
            transform: scale(1.05);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>

      {/* Hero Section */}
      <div className="relative min-h-[80vh] flex items-center justify-center">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FloatingParticle delay={0} duration={8} size={12} left="10%" />
          <FloatingParticle delay={2} duration={10} size={8} left="25%" />
          <FloatingParticle delay={4} duration={7} size={16} left="40%" />
          <FloatingParticle delay={1} duration={9} size={10} left="55%" />
          <FloatingParticle delay={3} duration={11} size={14} left="70%" />
          <FloatingParticle delay={5} duration={8} size={12} left="85%" />
          <FloatingParticle delay={2.5} duration={9} size={8} left="15%" />
          <FloatingParticle delay={4.5} duration={10} size={10} left="75%" />
        </div>

        {/* Decorative blurred circles */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full blur-2xl" />

        {/* Content */}
        <div className="relative max-w-2xl mx-auto px-6 text-center space-y-8">
          {/* Animated heart icon */}
          <div 
            className="relative inline-flex items-center justify-center"
            style={{ animation: 'float 3s ease-in-out infinite' }}
          >
            <div 
              className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 blur-xl scale-150"
              style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
            />
            <div 
              className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg flex items-center justify-center"
              style={{ animation: 'heart-beat 2s ease-in-out infinite' }}
            >
              <Heart className="h-12 w-12 text-primary-foreground fill-primary-foreground" />
            </div>
          </div>
          
          {/* Title with gradient text */}
          <div className="space-y-4">
            <h1 
              className="text-5xl md:text-6xl font-bold"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--foreground)), hsl(var(--foreground) / 0.7), hsl(var(--primary)))',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmer 5s linear infinite',
              }}
            >
              {isArabic ? 'ادعم Krolist' : 'Support Krolist'}
            </h1>
            <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
              {isArabic 
                ? 'ساعدنا في الحفاظ على Krolist مجاني وسريع ومليء بالميزات للجميع'
                : 'Help us keep Krolist free, fast, and full of features for everyone.'}
            </p>
          </div>

          {/* Main CTA button */}
          <div className="pt-4">
            <Button 
              onClick={handleDonate}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              size="lg" 
              className="relative group gap-3 text-xl px-10 py-7 bg-[#FF5E5B] hover:bg-[#FF5E5B]/90 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#FF5E5B]/30 rounded-2xl overflow-hidden"
            >
              {/* Shimmer effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
              />
              
              <Coffee className={`h-6 w-6 transition-transform duration-300 ${isHovering ? 'rotate-12 scale-110' : ''}`} />
              <span>{isArabic ? 'اشتري لي قهوة' : 'Buy me a coffee'}</span>
              <ArrowRight className={`h-5 w-5 transition-all duration-300 ${isHovering ? 'translate-x-1' : ''}`} />
            </Button>
          </div>

          {/* Decorative sparkles */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {[...Array(5)].map((_, i) => (
              <Sparkles 
                key={i} 
                className="h-5 w-5 text-primary/40 animate-pulse" 
                style={{ animationDelay: `${i * 200}ms` }} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Ko-fi direct link section */}
      <div className="max-w-lg mx-auto px-6 py-12 text-center">
        <div className="relative group">
          {/* Glow effect behind card */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Card */}
          <div className="relative p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-[#FF5E5B]/10">
                <Coffee className="h-6 w-6 text-[#FF5E5B]" />
              </div>
              <h2 className="text-xl font-semibold">Ko-fi</h2>
            </div>
            
            <p className="text-muted-foreground mb-6 text-sm">
              {isArabic 
                ? 'ادعم التطوير المستمر لـ Krolist'
                : 'Support the ongoing development of Krolist'}
            </p>
            
            <a 
              href="https://ko-fi.com/krolist" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <span>ko-fi.com/krolist</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Thank you message */}
      <div className="text-center py-8 space-y-3">
        <p className="text-muted-foreground text-lg">
          {isArabic 
            ? 'كل قهوة تساعد في تشغيل Krolist. شكراً لك! ❤️'
            : 'Every coffee helps keep Krolist running. Thank you! ❤️'}
        </p>
      </div>
    </div>
  );
}