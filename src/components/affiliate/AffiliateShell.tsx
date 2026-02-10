import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import krolistLogo from "@/assets/krolist-logo.png";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Helmet } from "react-helmet-async";

interface AffiliateShellProps {
  children: React.ReactNode;
  title?: string;
}

export function AffiliateShell({ children, title }: AffiliateShellProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isArabic = language === 'ar';

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

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
