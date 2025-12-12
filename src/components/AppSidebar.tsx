import { BarChart3, Home, Package, Settings, Heart, Gift, PlusCircle, Megaphone, Calendar, ShoppingBag, HelpCircle, X } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { STORES, getAllStores, getStoreById } from "@/config/stores";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import DitherBackground from "@/components/DitherBackground";
import { PersonalizeDialog } from "@/components/PersonalizeDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import sheinGuideGif from "@/assets/shop-guides/shein-guide.gif";

// Shop guides configuration - add more shops here later
interface ShopGuideStep {
  en: string;
  ar: string;
}

interface ShopGuide {
  title: { en: string; ar: string };
  gif: string;
  steps: ShopGuideStep[];
}

const SHOP_GUIDES: Record<string, ShopGuide> = {
  shein: { 
    title: { en: "SHOP GUIDE : SHEIN", ar: "دليل التسوق : شي إن" },
    gif: sheinGuideGif,
    steps: [
      { en: "Open the Shein app or website", ar: "افتح تطبيق شي إن أو الموقع" },
      { en: "Go to the search bar and type R2M6A", ar: "اذهب إلى شريط البحث واكتب R2M6A" },
      { en: "Browse and shop for anything you like!", ar: "تصفح وتسوق أي شيء يعجبك!" }
    ]
  }
};

const mainItems = [{
  title: "nav.products",
  url: "/",
  icon: Package
}, {
  title: "nav.analytics",
  url: "/analytics",
  icon: BarChart3
}, {
  title: "nav.myOrders",
  url: "/my-orders",
  icon: ShoppingBag
}];

const getShopItems = () => {
  const saved = localStorage.getItem('shopOrder');
  if (saved) {
    const shopOrder = JSON.parse(saved);
    return shopOrder
      .filter((shop: any) => {
        const storeConfig = getStoreById(shop.id);
        return shop.enabled && storeConfig && !storeConfig.comingSoon;
      })
      .map((shop: any) => {
        const storeConfig = getStoreById(shop.id);
        return {
          title: `shops.${shop.id}`,
          url: storeConfig?.affiliateUrl || `https://${shop.id}.com`,
          icon: storeConfig?.icon || Package,
          name: shop.name,
          isExternal: true
        };
      });
  }
  // Default active shops only (not coming soon)
  const defaultStores = getAllStores().filter(s => s.enabled && !s.comingSoon);
  return defaultStores.map(store => ({
    title: `shops.${store.id}`,
    url: store.affiliateUrl,
    icon: store.icon,
    name: store.name,
    isExternal: true
  }));
};
const otherItems = [{
  title: "nav.events",
  url: "/events",
  icon: Calendar
}, {
  title: "nav.promoCodes",
  url: "/promo-codes",
  icon: Gift
}, {
  title: "nav.donation",
  url: "/donation",
  icon: Heart
}, {
  title: "nav.settings",
  url: "/settings",
  icon: Settings
}];

export function AppSidebar() {
  const {
    state,
    setOpenMobile,
    isMobile
  } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = isMobile ? false : state === "collapsed";
  const {
    t,
    language
  } = useLanguage();
  const { user, isGuest } = useAuth();
  const [shopItems, setShopItems] = useState(getShopItems());
  const [promotions, setPromotions] = useState<Record<string, any[]>>({});
  const [hasFavoriteProducts, setHasFavoriteProducts] = useState(false);
  const [hasActiveOrders, setHasActiveOrders] = useState(false);
  const [ditherSettings, setDitherSettings] = useState<any>(null);
  const [activeGuide, setActiveGuide] = useState<string | null>(null);

  useEffect(() => {
    const handleStorageChange = () => {
      setShopItems(getShopItems());
    };
    const handleShopUpdate = () => {
      setShopItems(getShopItems());
    };
    const handleDitherChange = (e: CustomEvent) => {
      setDitherSettings(e.detail);
    };
    
    // Load initial dither settings
    const saved = localStorage.getItem('ditherSettings');
    if (saved) {
      try {
        setDitherSettings(JSON.parse(saved));
      } catch {
        setDitherSettings({ enabled: true });
      }
    } else {
      setDitherSettings({ enabled: true });
    }
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('shopOrderUpdated', handleShopUpdate);
    window.addEventListener('ditherSettingsChanged', handleDitherChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('shopOrderUpdated', handleShopUpdate);
      window.removeEventListener('ditherSettingsChanged', handleDitherChange as EventListener);
    };
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [t]);

  useEffect(() => {
    const checkFavoriteProducts = async () => {
      if (!user || isGuest) {
        setHasFavoriteProducts(false);
        return;
      }

      try {
        const { count, error } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (error) throw error;
        setHasFavoriteProducts((count || 0) > 0);
      } catch (error) {
        console.error('Error checking favorite products:', error);
        setHasFavoriteProducts(false);
      }
    };

    checkFavoriteProducts();
  }, [user, isGuest]);

  useEffect(() => {
    const checkActiveOrders = async () => {
      if (!user || isGuest) {
        setHasActiveOrders(false);
        return;
      }

      try {
        const { count, error } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (error) throw error;
        setHasActiveOrders((count || 0) > 0);
      } catch (error) {
        console.error('Error checking active orders:', error);
        setHasActiveOrders(false);
      }
    };

    checkActiveOrders();
  }, [user, isGuest]);

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('store_promotions')
        .select('*')
        .eq('active', true);

      if (error) throw error;

      // Group promotions by store_id
      const grouped: Record<string, any[]> = {};
      data?.forEach((promo: any) => {
        if (!grouped[promo.store_id]) {
          grouped[promo.store_id] = [];
        }
        grouped[promo.store_id].push(promo);
      });

      setPromotions(grouped);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    }
  };
  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    setOpenMobile(false);
  };
  const handleShopClick = (url: string, isExternal?: boolean) => {
    setOpenMobile(false);
    if (isExternal) {
      window.open(url, '_blank');
    }
  };
  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({
    isActive
  }: {
    isActive: boolean;
  }) => isActive 
    ? "bg-white/20 text-white font-medium backdrop-blur-md border border-white/30 rounded-lg shadow-lg" 
    : "hover:bg-white/10 text-white/90 backdrop-blur-sm border border-white/10 rounded-lg hover:border-white/25 transition-all duration-200";
  
  // Filter menu items based on authentication and favorite products
  const filteredMainItems = mainItems.filter(item => {
    if (item.url === "/analytics") {
      return user && !isGuest && hasFavoriteProducts;
    }
    if (item.url === "/my-orders") {
      return user && !isGuest && hasActiveOrders;
    }
    return true;
  });

  const showDither = ditherSettings?.enabled !== false;

  return <Sidebar className={`${collapsed ? "w-16" : "w-64"} border-sidebar-border`} collapsible="icon" side={language === 'ar' ? 'right' : 'left'}>
      {/* Dither Background - absolutely positioned within sidebar */}
      {showDither && (
        <div className={`absolute inset-0 z-0 overflow-hidden ${ditherSettings?.enableMouseInteraction ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <Suspense fallback={null}>
            <DitherBackground 
              waveColor={ditherSettings?.waveColor || [0.5, 0.5, 0.5]}
              disableAnimation={false}
              enableMouseInteraction={ditherSettings?.enableMouseInteraction || false}
              mouseRadius={ditherSettings?.mouseRadius || 0.3}
              colorNum={ditherSettings?.colorNum || 4}
              waveAmplitude={ditherSettings?.waveAmplitude || 0.3}
              waveFrequency={ditherSettings?.waveFrequency || 3}
              waveSpeed={ditherSettings?.waveSpeed || 0.05}
            />
          </Suspense>
        </div>
      )}
      
      {/* Search Products Button - positioned at top */}
      <div className="relative z-10 px-2 pt-4 pb-2">
        <NavLink to="/search-products" onClick={handleNavClick}>
          <div className="flex items-center justify-center gap-2 bg-gradient-primary text-white rounded-lg hover:shadow-hover transition-all duration-200 py-2.5 px-3 border border-white/20 backdrop-blur-md">
            <PlusCircle className="h-4 w-4" />
            {!collapsed && <span className="font-medium">{t('products.searchProducts')}</span>}
          </div>
        </NavLink>
      </div>

      <SidebarContent className="relative z-10 bg-transparent px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/80">{t('nav.dashboard')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredMainItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls} onClick={handleNavClick}>
                      <item.icon className={collapsed ? "h-5 w-5 mx-auto" : "h-4 w-4"} />
                      {!collapsed && (
                        <div className="flex items-center gap-2 flex-1">
                          <span>{t(item.title)}</span>
                          {item.url === "/" && user && !isGuest && !hasFavoriteProducts && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-warning/20 text-warning hover:bg-warning/30">
                                    +
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Add favorites to unlock Analytics</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-white/80">{t('shops.title')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {shopItems.map(item => {
              const shopId = item.title.split('.')[1];
              const shopPromotions = promotions[shopId] || [];
              const isImageIcon = typeof item.icon === 'string';
              const hasGuide = SHOP_GUIDES[shopId];
              
              return <SidebarMenuItem key={item.title} className="relative">
                    <div className="flex items-center w-full">
                      <SidebarMenuButton asChild className="flex-1">
                        {item.isExternal ? <button onClick={() => handleShopClick(item.url, true)} className={collapsed ? "flex items-center justify-center w-full p-2 rounded-lg hover:bg-white/10 text-white/90 backdrop-blur-sm border border-white/10 hover:border-white/25 transition-all duration-200" : "flex items-center gap-2 w-full p-2 rounded-lg hover:bg-white/10 text-white/90 backdrop-blur-sm border border-white/10 hover:border-white/25 transition-all duration-200 px-[15px]"}>
                            {isImageIcon ? <img src={item.icon as string} alt={`${shopId} icon`} className={collapsed ? "h-6 w-6 rounded-full object-cover" : "h-5 w-5 rounded-full object-cover shrink-0"} /> : <item.icon className={collapsed ? "h-5 w-5" : "h-4 w-4 shrink-0"} />}
                            {!collapsed && <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                                <span className="shrink-0">{t(item.title)}</span>
                                {shopPromotions.map((promo: any) => (
                                  <span 
                                    key={promo.id}
                                    className={`px-1.5 py-0.5 bg-${promo.badge_color}-500/20 text-${promo.badge_color}-700 dark:text-${promo.badge_color}-400 text-[10px] font-medium rounded border border-${promo.badge_color}-500/30`}
                                  >
                                    {promo.badge_text}
                                  </span>
                                ))}
                              </div>}
                          </button> : <NavLink to={item.url} className={getNavCls} onClick={handleNavClick}>
                            {isImageIcon ? <img src={item.icon as string} alt={`${shopId} icon`} className={collapsed ? "h-6 w-6 rounded-full object-cover mx-auto" : "h-5 w-5 rounded-full object-cover shrink-0"} /> : <item.icon className={collapsed ? "h-5 w-5 mx-auto" : "h-4 w-4"} />}
                            {!collapsed && <span>{t(item.title)}</span>}
                          </NavLink>}
                      </SidebarMenuButton>
                      {!collapsed && hasGuide && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveGuide(shopId);
                                }}
                                className="p-1.5 ml-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white backdrop-blur-sm border border-white/20 hover:border-white/30 transition-all duration-200"
                              >
                                <HelpCircle className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="text-xs">Shop Guide</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </SidebarMenuItem>;
            })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-white/80">{t('settings.other')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {otherItems.filter(item => item.title !== 'nav.settings').map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls} onClick={handleNavClick}>
                      <item.icon className={collapsed ? "h-5 w-5 mx-auto" : "h-4 w-4"} />
                      {!collapsed && <span>{t(item.title)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
              
              {/* Settings Button with Personalize Icon */}
              <SidebarMenuItem>
                <div className="flex items-center w-full">
                  <SidebarMenuButton asChild className="flex-1">
                    <NavLink to="/settings" className={getNavCls} onClick={handleNavClick}>
                      <Settings className={collapsed ? "h-5 w-5 mx-auto" : "h-4 w-4"} />
                      {!collapsed && <span>{t('nav.settings')}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                  {!collapsed && <PersonalizeDialog iconOnly />}
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Shop Guide Dialog */}
      <Dialog open={!!activeGuide} onOpenChange={(open) => !open && setActiveGuide(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center font-bold">
              {activeGuide && SHOP_GUIDES[activeGuide]?.title[language === 'ar' ? 'ar' : 'en']}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 p-2">
            {activeGuide && SHOP_GUIDES[activeGuide] && (
              <>
                <img 
                  src={SHOP_GUIDES[activeGuide].gif} 
                  alt={`${activeGuide} guide`}
                  className="rounded-lg max-w-full h-auto mx-auto"
                  style={{ imageRendering: 'auto' }}
                />
                <ol className={`space-y-2 text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  {SHOP_GUIDES[activeGuide].steps.map((step, index) => (
                    <li key={index} className="flex gap-2 items-start">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-muted-foreground pt-0.5">
                        {step[language === 'ar' ? 'ar' : 'en']}
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>;
}