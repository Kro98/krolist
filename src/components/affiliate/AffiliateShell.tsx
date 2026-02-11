import { ArrowLeft, Lock as LockIcon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import krolistLogo from "@/assets/krolist-logo.png";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Helmet } from "react-helmet-async";
import { useSectionLocks } from "@/hooks/useSectionLocks";
import { motion } from "framer-motion";

interface AffiliateShellProps {
  children: React.ReactNode;
  title?: string;
}

export function AffiliateShell({ children, title }: AffiliateShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const locks = useSectionLocks();

  // Determine if current section is locked
  const isArticlesRoute = location.pathname.startsWith('/articles');
  const isStickersRoute = location.pathname.startsWith('/stickers');
  const isLocked = (isArticlesRoute && locks.articles) || (isStickersRoute && locks.stickers);

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isArabic ? 'rtl' : 'ltr'}>
      {title && (
        <Helmet>
          <title>{title}</title>
        </Helmet>
      )}
      
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm px-4">
        <button
          onClick={() => navigate('/')}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl",
            "bg-muted/50 hover:bg-muted transition-colors",
            "text-sm font-medium text-muted-foreground hover:text-foreground"
          )}
        >
          <ArrowLeft className={cn("w-4 h-4", isArabic && "rotate-180")} />
          <span>{isArabic ? 'رجوع' : 'Back'}</span>
        </button>
        
        <Link to="/" className="flex items-center gap-2">
          <img src={krolistLogo} alt="Krolist" className="h-8 object-contain cursor-pointer hover:opacity-80 transition-opacity" />
        </Link>
        
        <div className="w-20" /> {/* Spacer for centering */}
      </header>

      {/* Content with smooth transition */}
      <motion.main
        className="flex-1"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        key={location.pathname}
      >
        {!locks.loading && isLocked ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <LockIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">
              {isArabic ? 'هذا القسم مغلق حالياً' : 'This section is currently locked'}
            </h2>
            <p className="text-muted-foreground max-w-md">
              {isArabic 
                ? 'هذه الصفحة غير متاحة حالياً. يرجى العودة لاحقاً.'
                : 'This page is currently unavailable. Please check back later.'}
            </p>
          </div>
        ) : (
          children
        )}
      </motion.main>
    </div>
  );
}
