import { Heart, Coffee, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Donation() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [isHovering, setIsHovering] = useState(false);

  const handleDonate = () => {
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.7 },
      colors: ['#FF5E5B', '#fcbf47', '#00D4AA', '#FF9F43', '#A855F7']
    });
    
    window.open('https://ko-fi.com/krolist', '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* Subtle ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-500/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative max-w-lg w-full text-center space-y-16">
        {/* Floating heart icon */}
        <div className="flex justify-center">
          <div 
            className="relative group cursor-default"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Glow ring */}
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/20 to-red-500/20 blur-xl transition-all duration-700 ${isHovering ? 'scale-150 opacity-100' : 'scale-100 opacity-60'}`} />
            
            {/* Heart container */}
            <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br from-pink-500/10 to-red-500/10 backdrop-blur-sm border border-pink-500/20 flex items-center justify-center transition-transform duration-500 ${isHovering ? 'scale-110' : 'scale-100'}`}>
              <Heart 
                className={`h-10 w-10 text-pink-500 transition-all duration-500 ${isHovering ? 'scale-110 fill-pink-500/30' : 'scale-100'}`} 
              />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-6">
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
            {isArabic ? 'شكراً لدعمك' : 'Thank you for your support'}
          </h1>
          
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto font-light">
            {isArabic 
              ? 'دعمك يساعدنا في الحفاظ على Krolist مجاني ومتاح للجميع.'
              : 'Your support helps keep Krolist free and available for everyone.'}
          </p>
        </div>

        {/* Ko-fi Button */}
        <div className="space-y-8">
          <Button 
            onClick={handleDonate}
            size="lg" 
            className="group gap-3 text-base px-8 py-6 bg-[#FF5E5B] hover:bg-[#e54542] text-white rounded-full shadow-lg shadow-[#FF5E5B]/20 hover:shadow-xl hover:shadow-[#FF5E5B]/30 transition-all duration-300 hover:-translate-y-0.5"
          >
            <Coffee className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
            <span>{isArabic ? 'ادعمني على Ko-fi' : 'Support on Ko-fi'}</span>
          </Button>

          {/* Subtle link */}
          <a 
            href="https://ko-fi.com/krolist" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-300"
          >
            <span className="font-light">ko-fi.com/krolist</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Soft footer */}
        <p className="text-sm text-muted-foreground/50 font-light pt-8">
          {isArabic ? '❤️' : '❤️'}
        </p>
      </div>
    </div>
  );
}
