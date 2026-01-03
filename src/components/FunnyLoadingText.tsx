import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const loadingPhrasesEN = [
  "Hunting for deals... 🔍",
  "Asking the price fairies... 🧚",
  "Convincing products to load... 🙏",
  "Teaching hamsters to run faster... 🐹",
  "Bribing the servers... 💰",
  "Making coffee for the data... ☕",
  "Waking up the lazy bytes... 😴",
  "Polishing the pixels... ✨",
  "Summoning the shopping gods... 🛒",
  "Tickling the database... 🤭",
  "Negotiating with the internet... 🤝",
  "Loading... or pretending to... 🎭",
  "Finding the best prices... 📈",
  "Chasing discounts... 🏃",
  "Counting virtual coins... 🪙",
  "Warming up the deal machine... 🔥",
  "Convincing prices to drop... 📉",
  "Fetching awesome stuff... 🎁",
  "Almost there, promise! 🤞",
  "Good things take time... ⏰",
];

const loadingPhrasesAR = [
  "نبحث عن الصفقات... 🔍",
  "نسأل جنيات الأسعار... 🧚",
  "نقنع المنتجات بالتحميل... 🙏",
  "نعلم الهامستر الجري أسرع... 🐹",
  "نرشي الخوادم... 💰",
  "نصنع قهوة للبيانات... ☕",
  "نوقظ البايتات الكسولة... 😴",
  "نلمع البكسلات... ✨",
  "نستدعي آلهة التسوق... 🛒",
  "ندغدغ قاعدة البيانات... 🤭",
  "نتفاوض مع الإنترنت... 🤝",
  "تحميل... أو نتظاهر... 🎭",
  "نبحث عن أفضل الأسعار... 📈",
  "نلاحق التخفيضات... 🏃",
  "نعد العملات الافتراضية... 🪙",
  "نسخن آلة الصفقات... 🔥",
  "نقنع الأسعار بالانخفاض... 📉",
  "نجلب أشياء رائعة... 🎁",
  "تقريباً وصلنا، وعد! 🤞",
  "الأشياء الجيدة تحتاج وقت... ⏰",
];

interface FunnyLoadingTextProps {
  className?: string;
  interval?: number;
}

export function FunnyLoadingText({ className = "", interval = 2000 }: FunnyLoadingTextProps) {
  const { language } = useLanguage();
  const phrases = language === 'ar' ? loadingPhrasesAR : loadingPhrasesEN;
  
  const [currentIndex, setCurrentIndex] = useState(() => 
    Math.floor(Math.random() * phrases.length)
  );
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % phrases.length);
        setIsAnimating(false);
      }, 300);
    }, interval);

    return () => clearInterval(timer);
  }, [phrases.length, interval]);

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {/* Animated dots */}
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      
      {/* Animated text */}
      <p 
        className={`text-muted-foreground text-center transition-all duration-300 ${
          isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
      >
        {phrases[currentIndex]}
      </p>
    </div>
  );
}
