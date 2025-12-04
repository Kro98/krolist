import { BarChart3, Home, Package, Settings, Heart, Gift, PlusCircle, Megaphone, Calendar, ShoppingBag } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { STORES, getAllStores, getStoreById } from "@/config/stores";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import DitherBackground from "@/components/DitherBackground";
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

  useEffect(() => {
    const handleStorageChange = () => {
      setShopItems(getShopItems());
    };
    const handleShopUpdate = () => {
      setShopItems(getShopItems());
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('shopOrderUpdated', handleShopUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('shopOrderUpdated', handleShopUpdate);
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
  }) => isActive ? "bg-white/20 text-white font-medium backdrop-blur-sm" : "hover:bg-white/10 text-white/90";
  
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

  return <Sidebar className={`${collapsed ? "w-16" : "w-64"} border-sidebar-border relative overflow-hidden`} collapsible="icon" side={language === 'ar' ? 'right' : 'left'}>
      <Suspense fallback={null}>
        <DitherBackground 
          waveSpeed={0.03}
          waveFrequency={2.5}
          waveAmplitude={0.25}
          waveColor={[0.2, 0.15, 0.3]}
          colorNum={4}
          pixelSize={2}
          enableMouseInteraction={false}
          className="rounded-lg"
        />
      </Suspense>
      <SidebarContent className="relative z-10 bg-transparent">
        {/* Search Products Button */}
        <div className="p-4 px-[5px] py-[5px]">
          <NavLink to="/search-products" onClick={handleNavClick}>
            <div className="flex items-center justify-center gap-2 bg-gradient-primary text-white rounded-lg hover:shadow-hover transition-all duration-200 mx-0 my-[20px] py-[10px] px-[10px]">
              <PlusCircle className="h-4 w-4" />
              {!collapsed && <span className="font-medium">{t('products.searchProducts')}</span>}
            </div>
          </NavLink>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-white/80">{t('nav.dashboard')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
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

        <SidebarGroup className="mx-0 px-0">
          <SidebarGroupLabel className="text-white/80">{t('shops.title')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {shopItems.map(item => {
              const shopId = item.title.split('.')[1];
              const shopPromotions = promotions[shopId] || [];
              const isImageIcon = typeof item.icon === 'string';
              
              return <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      {item.isExternal ? <button onClick={() => handleShopClick(item.url, true)} className={collapsed ? "flex items-center justify-center w-full p-2 rounded-full hover:bg-sidebar-accent/50 text-sidebar-foreground" : "flex items-center gap-2 w-full p-2 rounded-md hover:bg-sidebar-accent/50 text-sidebar-foreground px-[15px] py-0"}>
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
                  </SidebarMenuItem>;
            })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-white/80">{t('settings.other')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls} onClick={handleNavClick}>
                      <item.icon className={collapsed ? "h-5 w-5 mx-auto" : "h-4 w-4"} />
                      {!collapsed && <span>{t(item.title)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>;
}