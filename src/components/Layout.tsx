import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/toaster";
import krolistLogo from "@/assets/krolist-logo.png";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAdBlockDetection } from "@/hooks/use-adblock-detection";
import { AdBlockDialog } from "@/components/AdBlockDialog";

interface LayoutProps {
  children: React.ReactNode;
}
export function Layout({ children }: LayoutProps) {
  const { language } = useLanguage();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { shouldShowDialog, setPreference } = useAdBlockDetection();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth',
    '/auth/privacy-policy',
    '/auth/terms-of-service',
    '/auth/contact-us',
    '/privacy-policy',
    '/terms-of-service',
    '/contact-us'
  ];

  const isPublicRoute = publicRoutes.includes(location.pathname);

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      navigate('/auth');
    }
  }, [user, loading, location.pathname, navigate, isPublicRoute]);

  useEffect(() => {
    if (shouldShowDialog) {
      setDialogOpen(true);
    }
  }, [shouldShowDialog]);

  const handleAllowAds = () => {
    setPreference("allow-ads");
    setDialogOpen(false);
  };

  const handleBlockAds = () => {
    setPreference("block-ads");
    setDialogOpen(false);
  };

  // Show auth pages and public resource pages without layout
  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <div className="min-h-screen flex flex-col w-full bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <header className="h-16 flex items-center border-b border-border bg-card px-4">
            <SidebarTrigger className="mr-4" />
            <img 
              src={krolistLogo} 
              alt="Krolist" 
              className="h-8 object-contain"
            />
          </header>
          
          <main className="flex-1 p-6 overflow-auto mx-0 px-[10px] py-[10px]">
            {children}
          </main>

          {/* Floating Add Button */}
          <Button
            size="icon"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40 bg-gradient-primary hover:shadow-hover"
            onClick={() => navigate('/add-product')}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
        
        <Toaster />
        <Sonner />
        <AdBlockDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onAllowAds={handleAllowAds}
          onBlockAds={handleBlockAds}
        />
      </SidebarProvider>
    </TooltipProvider>
  );
}