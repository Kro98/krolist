import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/toaster";
import krolistLogo from "@/assets/krolist-logo.png";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
interface LayoutProps {
  children: React.ReactNode;
}
export function Layout({ children }: LayoutProps) {
  const { language } = useLanguage();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user && location.pathname !== '/auth') {
      navigate('/auth');
    }
  }, [user, loading, location.pathname, navigate]);

  // Show auth page without layout
  if (location.pathname === '/auth') {
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
        <div className="min-h-screen flex w-full bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <AppSidebar />
          <div className="flex-1 flex flex-col">
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
          </div>

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
      </SidebarProvider>
    </TooltipProvider>
  );
}