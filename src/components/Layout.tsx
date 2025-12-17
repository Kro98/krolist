import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/toaster";
import { LoginMessageDialog } from "@/components/LoginMessageDialog";
import { AuthModal } from "@/components/AuthModal";
import { ShoppingCart } from "@/components/ShoppingCart";
import { UserAccountControl } from "@/components/UserAccountControl";
import { useNavigate, useLocation, Link } from "react-router-dom";
import krolistLogo from "@/assets/krolist-logo.png";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestAuth } from "@/contexts/GuestAuthContext";
import { useEffect, useState, useRef } from "react";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useIsMobile } from "@/hooks/use-mobile";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { NotificationCenter } from "@/components/NotificationCenter";
import { NotificationPopup } from "@/components/NotificationPopup";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdSpace } from "@/components/AdSpace";
import { InterstitialAd } from "@/components/InterstitialAd";
import { useAdTrigger } from "@/contexts/AdTriggerContext";
interface LayoutProps {
  children: React.ReactNode;
}
function LayoutContent({
  children
}: LayoutProps) {
  const {
    language
  } = useLanguage();
  const {
    user,
    loading,
    isGuest
  } = useAuth();
  const {
    showAuthModal,
    closeAuthModal
  } = useGuestAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    open,
    setOpen
  } = useSidebar();
  const isMobile = useIsMobile();
  const {
    toast
  } = useToast();
  const [updateToastShown, setUpdateToastShown] = useState(false);
  const {
    triggerPageOpen,
    triggerLoadScreen,
    triggerAuthEvent
  } = useAdTrigger();
  const previousPath = useRef(location.pathname);
  const previousUser = useRef(user);
  const loadingTriggered = useRef(false);

  // Trigger ad on page navigation
  useEffect(() => {
    if (previousPath.current !== location.pathname) {
      triggerPageOpen();
      previousPath.current = location.pathname;
    }
  }, [location.pathname, triggerPageOpen]);

  // Trigger ad on auth state change (login/logout)
  useEffect(() => {
    const wasLoggedIn = previousUser.current !== null;
    const isLoggedIn = user !== null;

    // Only trigger if auth state actually changed (not on initial load)
    if (previousUser.current !== undefined && wasLoggedIn !== isLoggedIn) {
      triggerAuthEvent();
    }
    previousUser.current = user;
  }, [user, triggerAuthEvent]);

  // Trigger ad on loading screen (every 5 times)
  useEffect(() => {
    if (loading && !loadingTriggered.current) {
      triggerLoadScreen();
      loadingTriggered.current = true;
    }
    if (!loading) {
      loadingTriggered.current = false;
    }
  }, [loading, triggerLoadScreen]);

  // Check for service worker updates and show toast
  useEffect(() => {
    if ('serviceWorker' in navigator && !updateToastShown) {
      const checkForUpdates = async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          showUpdateToast();
        }
        registration?.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateToast();
            }
          });
        });
      };
      const showUpdateToast = () => {
        if (updateToastShown) return;
        setUpdateToastShown(true);
        toast({
          title: language === 'ar' ? 'تحديث متاح!' : 'Update Available!',
          description: language === 'ar' ? 'يتوفر إصدار جديد من التطبيق. قم بالتحديث للحصول على أحدث الميزات.' : 'A new version is available. Update to get the latest features.',
          duration: 10000,
          action: <Button size="sm" onClick={async () => {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration?.waiting) {
              registration.waiting.postMessage({
                type: 'SKIP_WAITING'
              });
              window.location.reload();
            } else {
              window.location.reload();
            }
          }} className="bg-primary hover:bg-primary/90">
              <RefreshCw className="h-3 w-3 mr-1" />
              {language === 'ar' ? 'تحديث' : 'Update'}
            </Button>
        });
      };
      checkForUpdates();
    }
  }, [language, toast, updateToastShown]);

  // Add swipe gesture support for mobile/tablet
  useSwipeGesture({
    onSwipeRight: () => {
      if (isMobile && !open) {
        setOpen(true);
      }
    },
    onSwipeLeft: () => {
      if (isMobile && open) {
        setOpen(false);
      }
    },
    threshold: 100,
    edgeThreshold: 50
  });
  const handleAddClick = () => {
    navigate('/');
    // Trigger select mode on Products page
    window.dispatchEvent(new CustomEvent('triggerSelectMode'));
  };

  // Public routes that don't require authentication
  const publicRoutes = ['/auth', '/auth/privacy-policy', '/auth/terms-of-service', '/auth/contact-us', '/privacy-policy', '/terms-of-service', '/contact-us'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // Show auth pages and public resource pages without layout
  if (isPublicRoute) {
    return <>{children}</>;
  }
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>;
  }
  return <div className="flex min-h-screen w-full max-w-full overflow-x-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Interstitial Ad */}
      <InterstitialAd />
      {/* Desktop Ad Spaces - Customize width/height as needed */}
      <AdSpace position="left" width="160px" height="calc(100vh - 100px)" topOffset="72px" />
      <AdSpace position="right" width="160px" height="calc(100vh - 100px)" topOffset="72px" />
      
      <NotificationPopup />
      <LoginMessageDialog />
      <AuthModal open={showAuthModal} onOpenChange={closeAuthModal} />
      <AppSidebar />
      <div className="flex-1 flex flex-col bg-background min-w-0 max-w-full">
        <header className="h-16 flex items-center justify-between border-b border-border bg-card px-4 flex-shrink-0">
          <div className="flex items-center">
            <SidebarTrigger className={language === 'ar' ? 'ml-4' : 'mr-4'} />
            <Link to="/products">
              <img src={krolistLogo} alt="Krolist" className="h-8 object-contain cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <PWAInstallButton />
            <NotificationCenter />
            <UserAccountControl />
            {/* Cart hidden for now - will be enabled later */}
            {/* <ShoppingCart /> */}
          </div>
        </header>
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="w-full max-w-7xl mx-auto sm:px-6 lg:px-8 py-5 px-[5px]">
            <PageBreadcrumbs />
            {children}
          </div>
        </main>
      </div>
      
      <Toaster />
      <Sonner />
    </div>;
}
export function Layout({
  children
}: LayoutProps) {
  return <TooltipProvider>
      <SidebarProvider>
        <LayoutContent>{children}</LayoutContent>
      </SidebarProvider>
    </TooltipProvider>;
}