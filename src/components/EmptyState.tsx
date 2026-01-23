import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Package, 
  Tag, 
  Heart, 
  ShoppingBag, 
  Sparkles,
  FolderOpen,
  Calendar,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

type EmptyStateType = 
  | 'search' 
  | 'products' 
  | 'favorites' 
  | 'promo-codes' 
  | 'cart' 
  | 'category' 
  | 'events' 
  | 'articles'
  | 'custom';

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    to?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    to?: string;
  };
  searchQuery?: string;
}

const emptyStateConfigs: Record<EmptyStateType, {
  icon: typeof Search;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  gradient: string;
}> = {
  search: {
    icon: Search,
    titleEn: 'No results found',
    titleAr: 'لا توجد نتائج',
    descriptionEn: "We couldn't find what you're looking for. Try different keywords or browse our categories.",
    descriptionAr: 'لم نتمكن من العثور على ما تبحث عنه. جرب كلمات مختلفة أو تصفح الفئات.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  products: {
    icon: Package,
    titleEn: 'No products yet',
    titleAr: 'لا توجد منتجات بعد',
    descriptionEn: 'Start tracking products to see them here. Add your first product to get price drop alerts!',
    descriptionAr: 'ابدأ بتتبع المنتجات لرؤيتها هنا. أضف أول منتج للحصول على تنبيهات انخفاض السعر!',
    gradient: 'from-violet-500/20 to-purple-500/20',
  },
  favorites: {
    icon: Heart,
    titleEn: 'No favorites yet',
    titleAr: 'لا توجد مفضلة بعد',
    descriptionEn: 'Products you love will appear here. Start exploring and add items to your favorites!',
    descriptionAr: 'ستظهر المنتجات المفضلة لديك هنا. ابدأ الاستكشاف وأضف عناصر للمفضلة!',
    gradient: 'from-pink-500/20 to-rose-500/20',
  },
  'promo-codes': {
    icon: Tag,
    titleEn: 'No promo codes saved',
    titleAr: 'لا توجد أكواد خصم محفوظة',
    descriptionEn: 'Save promo codes here for easy access. Never miss a discount again!',
    descriptionAr: 'احفظ أكواد الخصم هنا للوصول السهل. لا تفوت أي خصم مرة أخرى!',
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  cart: {
    icon: ShoppingBag,
    titleEn: 'Your cart is empty',
    titleAr: 'سلة التسوق فارغة',
    descriptionEn: 'Looks like you haven\'t added anything yet. Browse our collection!',
    descriptionAr: 'يبدو أنك لم تضف أي شيء بعد. تصفح مجموعتنا!',
    gradient: 'from-emerald-500/20 to-teal-500/20',
  },
  category: {
    icon: FolderOpen,
    titleEn: 'No products in this category',
    titleAr: 'لا توجد منتجات في هذه الفئة',
    descriptionEn: 'This category is empty for now. Check out other categories or come back later!',
    descriptionAr: 'هذه الفئة فارغة حالياً. تصفح فئات أخرى أو عد لاحقاً!',
    gradient: 'from-indigo-500/20 to-blue-500/20',
  },
  events: {
    icon: Calendar,
    titleEn: 'No upcoming events',
    titleAr: 'لا توجد فعاليات قادمة',
    descriptionEn: 'Stay tuned! New sales events and promotions will appear here.',
    descriptionAr: 'ترقب! ستظهر هنا فعاليات التخفيضات والعروض الجديدة.',
    gradient: 'from-fuchsia-500/20 to-pink-500/20',
  },
  articles: {
    icon: FileText,
    titleEn: 'No articles yet',
    titleAr: 'لا توجد مقالات بعد',
    descriptionEn: 'Our latest articles and guides will appear here. Check back soon!',
    descriptionAr: 'ستظهر هنا أحدث المقالات والأدلة. عد قريباً!',
    gradient: 'from-sky-500/20 to-blue-500/20',
  },
  custom: {
    icon: Sparkles,
    titleEn: 'Nothing here',
    titleAr: 'لا يوجد شيء هنا',
    descriptionEn: 'This section is empty.',
    descriptionAr: 'هذا القسم فارغ.',
    gradient: 'from-gray-500/20 to-slate-500/20',
  },
};

export const EmptyState = ({
  type,
  title,
  description,
  icon,
  action,
  secondaryAction,
  searchQuery,
}: EmptyStateProps) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  const config = emptyStateConfigs[type];
  const IconComponent = config.icon;
  
  const displayTitle = title || (isArabic ? config.titleAr : config.titleEn);
  const displayDescription = description || (isArabic ? config.descriptionAr : config.descriptionEn);

  const renderButton = (btnConfig: { label: string; onClick?: () => void; to?: string }, isPrimary: boolean) => {
    const ButtonComponent = (
      <Button
        variant={isPrimary ? 'default' : 'outline'}
        onClick={btnConfig.onClick}
        className="min-w-[120px]"
      >
        {btnConfig.label}
      </Button>
    );

    if (btnConfig.to) {
      return <Link to={btnConfig.to}>{ButtonComponent}</Link>;
    }
    return ButtonComponent;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {/* Animated icon container */}
      <motion.div
        className={`relative mb-6 p-6 rounded-full bg-gradient-to-br ${config.gradient}`}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        {/* Pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {icon || <IconComponent className="w-12 h-12 text-muted-foreground" />}
      </motion.div>

      {/* Title */}
      <motion.h3
        className="text-xl font-semibold text-foreground mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {displayTitle}
      </motion.h3>

      {/* Search query display */}
      {searchQuery && (
        <motion.p
          className="text-sm text-primary font-medium mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          "{searchQuery}"
        </motion.p>
      )}

      {/* Description */}
      <motion.p
        className="text-muted-foreground max-w-md mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {displayDescription}
      </motion.p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          className="flex flex-wrap gap-3 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {action && renderButton(action, true)}
          {secondaryAction && renderButton(secondaryAction, false)}
        </motion.div>
      )}

      {/* Decorative elements */}
      <motion.div
        className="absolute -z-10 opacity-30"
        animate={{
          rotate: [0, 360],
        }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      >
        <div className="w-64 h-64 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 blur-3xl" />
      </motion.div>
    </motion.div>
  );
};
