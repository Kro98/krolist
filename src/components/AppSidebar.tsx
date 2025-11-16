import { BarChart3, Home, Package, Settings, Heart, Gift, PlusCircle, Megaphone, Calendar, Newspaper, LogOut, User, Shield, Tag, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { STORES, getAllStores, getStoreById } from "@/config/stores";

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
  title: "nav.news",
  url: "/news",
  icon: Newspaper
}, {
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
    setOpenMobile
  } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const {
    t,
    language
  } = useLanguage();
  const { user, signOut } = useAuth();
  const [shopItems, setShopItems] = useState(getShopItems());
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [promotions, setPromotions] = useState<Record<string, any[]>>({});

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
    fetchUsername();
    fetchPromotions();
    checkAdminRole();
  }, [user, t]);

  const checkAdminRole = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

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

  const fetchUsername = async () => {
    // Check if user is in guest mode
    const isGuest = localStorage.getItem('isGuest') === 'true';
    if (isGuest) {
      setUsername(t('user.guest'));
      return;
    }
    
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    
    if (data) {
      setUsername(data.username);
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
  }) => isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50 text-sidebar-foreground";
  return <Sidebar className={`${collapsed ? "w-16" : "w-64"} bg-sidebar border-sidebar-border`} collapsible="icon" side={language === 'ar' ? 'right' : 'left'}>
      <SidebarContent className="bg-sidebar">
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
          <SidebarGroupLabel className="text-sidebar-foreground/70">{t('nav.dashboard')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls} onClick={handleNavClick}>
                      <item.icon className={collapsed ? "h-5 w-5 mx-auto" : "h-4 w-4"} />
                      {!collapsed && <span>{t(item.title)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mx-0 px-0">
          <SidebarGroupLabel className="text-sidebar-foreground/70">{t('shops.title')}</SidebarGroupLabel>
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
          <SidebarGroupLabel className="text-sidebar-foreground/70">{t('settings.other')}</SidebarGroupLabel>
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

        {/* User Profile Section */}
        {!collapsed && (
          <>
            <Separator className="my-2" />
            <div className="p-4 space-y-2">
              {user && (
                <div className="mb-2">
                  <Badge 
                    variant={isAdmin ? "default" : "secondary"} 
                    className={`text-xs flex items-center gap-1 ${isAdmin ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                    onClick={isAdmin ? () => window.location.href = '/admin' : undefined}
                  >
                    {isAdmin && <Shield className="h-3 w-3" />}
                    {isAdmin ? t('user.admin') : t('user.user')}
                  </Badge>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sidebar-foreground truncate">{username || user?.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className={`w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 ${
                  language === 'ar' ? 'justify-start flex-row-reverse' : 'justify-start'
                }`}
              >
                <LogOut className="h-4 w-4" />
                {t('auth.signOut') || 'Sign Out'}
              </Button>
            </div>
          </>
        )}
      </SidebarContent>
    </Sidebar>;
}