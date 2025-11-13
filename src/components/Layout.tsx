import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/toaster";
import { LoginMessageDialog } from "@/components/LoginMessageDialog";
import { ShoppingCart } from "@/components/ShoppingCart";
import { useNavigate, useLocation, Link } from "react-router-dom";
import krolistLogo from "@/assets/krolist-logo.png";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { language } = useLanguage();
  const { user, loading, isGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAddClick = () => {
    navigate('/');
    // Trigger select mode on Products page
    window.dispatchEvent(new CustomEvent('triggerSelectMode'));
  };

  // Public routes that don't require authentication
  const publicRoutes = ['/auth', '/auth/privacy-policy', '/auth/terms-of-service', '/auth/contact-us', '/privacy-policy', '/terms-of-service', '/contact-us'];
  const isPublicRoute = publicRoutes.includes(location.pathname);
  useEffect(() => {
    if (!loading && !user && !isGuest && !isPublicRoute) {
      navigate('/auth');
    }
  }, [user, loading, isGuest, location.pathname, navigate, isPublicRoute]);

  // Show auth pages and public resource pages without layout
  if (isPublicRoute) {
    return <>{children}</>;
  }
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>;
  }
  return <TooltipProvider>
      <SidebarProvider>
        <LoginMessageDialog />
        <AppSidebar />
        <div className="min-h-screen flex flex-col w-full bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <header className="h-16 flex items-center justify-between border-b border-border bg-card px-4">
            <div className="flex items-center">
              <SidebarTrigger className={language === 'ar' ? 'ml-4' : 'mr-4'} />
              <Link to="/products">
                <img src={krolistLogo} alt="Krolist" className="h-8 object-contain cursor-pointer hover:opacity-80 transition-opacity" />
              </Link>
            </div>
            <ShoppingCart onAddClick={
              <Button 
                onClick={handleAddClick}
                size="icon" 
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <Plus className="h-5 w-5" />
              </Button>
            } />
          </header>
          
          <main className="flex-1 overflow-auto">
            <div className="container max-w-7xl mx-auto sm:px-6 lg:px-8 py-[20px] px-[10px]">
              <PageBreadcrumbs />
              {children}
            </div>
          </main>

          {/* Floating Add Button */}
          <Button size="icon" className={`fixed bottom-6 h-14 w-14 rounded-full shadow-lg z-40 bg-gradient-primary hover:shadow-hover ${language === 'ar' ? 'left-6' : 'right-6'}`} onClick={() => navigate('/add-product')}>
            <Plus className="h-6 w-6" />
          </Button>
        </div>
        
        <Toaster />
        <Sonner />
      </SidebarProvider>
    </TooltipProvider>;
}