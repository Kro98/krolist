import { Heart, Coffee, ArrowRight, ExternalLink } from "lucide-react";
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
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF5E5B', '#fcbf47', '#00D4AA']
    });
    
    window.open('https://ko-fi.com/krolist', '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full space-y-12 text-center">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-10 w-10 text-primary" />
              </div>
            </div>
          </div>
          
          {/* Text content */}
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
              {isArabic ? 'ادعم Krolist' : 'Support Krolist'}
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {isArabic 
                ? 'ساعدنا في الحفاظ على Krolist مجاني وسريع للجميع'
                : 'Help us keep Krolist free and fast for everyone.'}
            </p>
          </div>

          {/* CTA Button */}
          <div className="space-y-6">
            <Button 
              onClick={handleDonate}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              size="lg" 
              className="w-full sm:w-auto gap-3 text-lg px-8 py-6 bg-[#FF5E5B] hover:bg-[#e54542] text-white rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Coffee className={`h-5 w-5 transition-transform duration-200 ${isHovering ? 'rotate-6' : ''}`} />
              <span>{isArabic ? 'اشتري لي قهوة' : 'Buy me a coffee'}</span>
              <ArrowRight className={`h-4 w-4 transition-transform duration-200 ${isHovering ? 'translate-x-0.5' : ''}`} />
            </Button>

            {/* Direct link */}
            <a 
              href="https://ko-fi.com/krolist" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>ko-fi.com/krolist</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Footer message */}
      <div className="pb-24 pt-8 text-center">
        <p className="text-sm text-muted-foreground">
          {isArabic 
            ? 'كل قهوة تساعد في تشغيل Krolist. شكراً لك ❤️'
            : 'Every coffee helps keep Krolist running. Thank you ❤️'}
        </p>
      </div>
    </div>
  );
}
