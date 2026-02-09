import { useState } from "react";
import { ArrowLeft, ShoppingBag, Shield, Clock, Tag, HelpCircle, ChevronDown, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import krolistLogo from "@/assets/krolist-logo.png";

interface AffiliateInfoPageProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FAQItem {
  id: string;
  icon: React.ElementType;
  colorClass: string;
  glowClass: string;
  question: { en: string; ar: string };
  answer: { en: string; ar: string };
}

const faqItems: FAQItem[] = [
  {
    id: 'how-to-use',
    icon: ShoppingBag,
    colorClass: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    glowClass: 'shadow-blue-500/20',
    question: {
      en: 'How do I use the product links?',
      ar: 'كيف أستخدم روابط المنتجات؟'
    },
    answer: {
      en: "It's super simple! Just tap on any product you like, and you'll be taken directly to the store (like Amazon). From there, you can view the product, check reviews, and make your purchase as normal. We just help you discover great deals!",
      ar: "الأمر بسيط جداً! فقط اضغط على أي منتج يعجبك، وسيتم نقلك مباشرة إلى المتجر (مثل أمازون). من هناك، يمكنك عرض المنتج، التحقق من التقييمات، وإتمام الشراء كالمعتاد. نحن فقط نساعدك في اكتشاف العروض الرائعة!"
    }
  },
  {
    id: 'cookie-duration',
    icon: Clock,
    colorClass: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
    glowClass: 'shadow-purple-500/20',
    question: {
      en: 'How long does the affiliate link last?',
      ar: 'ما مدة صلاحية رابط العمولة؟'
    },
    answer: {
      en: "When you click one of our links, you have 24 hours to make a purchase for us to receive credit. Think of it like a temporary connection! If you come back later and buy something, just click through our link again to keep supporting us.",
      ar: "عند النقر على أحد روابطنا، لديك 24 ساعة لإجراء عملية شراء حتى نحصل على العمولة. فكر في الأمر كاتصال مؤقت! إذا عدت لاحقاً واشتريت شيئاً، فقط انقر على رابطنا مرة أخرى لمواصلة دعمنا."
    }
  },
  {
    id: 'different-product',
    icon: HelpCircle,
    colorClass: 'bg-green-500/20 text-green-500 border-green-500/30',
    glowClass: 'shadow-green-500/20',
    question: {
      en: 'What if I buy something different?',
      ar: 'ماذا لو اشتريت منتجاً مختلفاً؟'
    },
    answer: {
      en: "Great news! If you click our link and then buy ANYTHING from that store within 24 hours, it still supports us. So if you see a phone on our list but end up buying headphones instead, we still get a small thank you from the store. Win-win!",
      ar: "خبر رائع! إذا نقرت على رابطنا ثم اشتريت أي شيء من ذلك المتجر خلال 24 ساعة، فهذا لا يزال يدعمنا. لذا إذا رأيت هاتفاً في قائمتنا لكن انتهى بك الأمر بشراء سماعات، فإننا لا نزال نحصل على شكر صغير من المتجر. الكل يربح!"
    }
  },
  {
    id: 'discount-codes',
    icon: Tag,
    colorClass: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
    glowClass: 'shadow-orange-500/20',
    question: {
      en: 'Can I use discount codes?',
      ar: 'هل يمكنني استخدام أكواد الخصم؟'
    },
    answer: {
      en: "Absolutely! Using discount codes won't break our affiliate link. Feel free to grab any coupon codes you find - you save money, and we still get credited. It's the best of both worlds!",
      ar: "بالتأكيد! استخدام أكواد الخصم لن يكسر رابط العمولة الخاص بنا. لا تتردد في استخدام أي كوبونات تجدها - أنت توفر المال، ونحن لا نزال نحصل على العمولة. إنه الأفضل من كلا العالمين!"
    }
  },
  {
    id: 'security',
    icon: Shield,
    colorClass: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30',
    glowClass: 'shadow-cyan-500/20',
    question: {
      en: 'Is it safe to buy through these links?',
      ar: 'هل الشراء من خلال هذه الروابط آمن؟'
    },
    answer: {
      en: "100% safe! We never handle any payments or personal information. You're always buying directly from trusted stores like Amazon. Our links just let the store know you came from us - that's it! Your payment and data stay with the secure original shop.",
      ar: "آمن 100%! نحن لا نتعامل أبداً مع أي مدفوعات أو معلومات شخصية. أنت دائماً تشتري مباشرة من متاجر موثوقة مثل أمازون. روابطنا فقط تُعلم المتجر أنك جئت من عندنا - هذا كل شيء! دفعتك وبياناتك تبقى مع المتجر الأصلي الآمن."
    }
  }
];

export function AffiliateInfoPage({ isOpen, onClose }: AffiliateInfoPageProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-background overflow-auto"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 h-14 flex items-center justify-between px-4 border-b border-border bg-background/95 backdrop-blur-sm">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className={cn("w-5 h-5", isArabic && "rotate-180")} />
          <span>{isArabic ? 'رجوع' : 'Back'}</span>
        </button>
        <img src={krolistLogo} alt="Krolist" className="h-7" />
        <div className="w-16" /> {/* Spacer for centering */}
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">
            {isArabic ? 'ما هو Krolist؟' : 'What is Krolist?'}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {isArabic 
              ? 'Krolist هو دليلك لاكتشاف المنتجات الرائعة والعروض المميزة. نجمع روابط من متاجر موثوقة مثل أمازون لمساعدتك في العثور على ما تحتاجه.'
              : 'Krolist is your guide to discovering amazing products and deals. We gather links from trusted stores like Amazon to help you find what you need.'
            }
          </p>
        </div>

        {/* Key Points */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
            <Shield className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <p className="text-xs font-medium text-green-600 dark:text-green-400">
              {isArabic ? 'لا نخزن بيانات الدفع' : 'No payment data stored'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
            <ShoppingBag className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {isArabic ? 'الشراء من المتجر الأصلي' : 'Buy from original store'}
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {isArabic ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
          </h2>
          
          <div className="space-y-2">
            {faqItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedId === item.id;
              
              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-xl border overflow-hidden transition-all duration-300",
                    item.colorClass,
                    isExpanded && `shadow-lg ${item.glowClass}`
                  )}
                >
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="w-full flex items-center gap-3 p-3 text-left"
                  >
                    <div className={cn(
                      "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
                      item.colorClass.replace('/20', '/30')
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {isArabic ? item.question.ar : item.question.en}
                    </span>
                    <ChevronDown className={cn(
                      "w-4 h-4 shrink-0 transition-transform duration-300 text-muted-foreground",
                      isExpanded && "rotate-180"
                    )} />
                  </button>
                  
                  <div className={cn(
                    "overflow-hidden transition-all duration-300",
                    isExpanded ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <div className="px-3 pb-3 pt-0">
                      <div className="p-3 rounded-lg bg-background/60 backdrop-blur-sm">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {isArabic ? item.answer.ar : item.answer.en}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Support Note */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center space-y-2">
          <Heart className="w-5 h-5 mx-auto text-primary" />
          <p className="text-xs text-muted-foreground">
            {isArabic 
              ? 'إذا أردت دعمنا أكثر، يمكنك التبرع عبر Ko-fi. كل الدعم يذهب مباشرة لتحسين Krolist!'
              : 'Want to support us more? You can donate via Ko-fi. All support goes directly to improving Krolist!'
            }
          </p>
        </div>
      </main>
    </div>
  );
}
