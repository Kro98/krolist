import { BarChart3, Home, Package, Settings, Heart, Gift, PlusCircle, Megaphone, Calendar, Newspaper, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

// Import shop brand icons
import sheinIcon from "@/assets/shop-icons/shein-icon.png";
import noonIcon from "@/assets/shop-icons/noon-icon.png";
import amazonIcon from "@/assets/shop-icons/amazon-icon.png";
import ikeaIcon from "@/assets/shop-icons/ikea-icon.png";
import abyatIcon from "@/assets/shop-icons/abyat-icon.png";
import namshiIcon from "@/assets/shop-icons/namshi-icon.png";
import trendyolIcon from "@/assets/shop-icons/trendyol-icon.png";
import asosIcon from "@/assets/shop-icons/asos-icon.png";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
const mainItems = [{
  title: "nav.products",
  url: "/",
  icon: Package
}, {
  title: "nav.analytics",
  url: "/analytics",
  icon: BarChart3
}];
const getShopAffiliateUrl = (shopId: string) => {
  const affiliateUrls: Record<string, string> = {
    shein: "https://onelink.shein.com/17/535mkxhsd9a6",
    noon: "https://s.noon.com/sLVK_sCBGo4",
    amazon: "https://amzn.to/4ny9VLJ",
    ikea: "https://www.ikea.com/ref/affiliate123",
    abyat: "https://www.abyat.com/?ref=affiliate123",
    namshi: "https://www.namshi.com/?ref=affiliate123",
    trendyol: "https://www.trendyol.com/?ref=affiliate123",
    asos: "https://www.asos.com/?ref=affiliate123"
  };
  return affiliateUrls[shopId] || `https://${shopId}.com`;
};
const shopIconMap: Record<string, string> = {
  shein: sheinIcon,
  noon: noonIcon,
  amazon: amazonIcon,
  ikea: ikeaIcon,
  abyat: abyatIcon,
  namshi: namshiIcon,
  trendyol: trendyolIcon,
  asos: asosIcon
};
const getShopItems = () => {
  const saved = localStorage.getItem('shopOrder');
  if (saved) {
    const shopOrder = JSON.parse(saved);
    return shopOrder.filter((shop: any) => shop.enabled).map((shop: any) => ({
      title: `shops.${shop.id}`,
      url: getShopAffiliateUrl(shop.id),
      icon: shopIconMap[shop.id] || Package,
      name: shop.name,
      isExternal: true
    }));
  }
  return [{
    title: "shops.shein",
    url: getShopAffiliateUrl("shein"),
    icon: sheinIcon,
    isExternal: true
  }, {
    title: "shops.noon",
    url: getShopAffiliateUrl("noon"),
    icon: noonIcon,
    isExternal: true
  }, {
    title: "shops.amazon",
    url: getShopAffiliateUrl("amazon"),
    icon: amazonIcon,
    isExternal: true
  }, {
    title: "shops.ikea",
    url: getShopAffiliateUrl("ikea"),
    icon: ikeaIcon,
    isExternal: true
  }, {
    title: "shops.abyat",
    url: getShopAffiliateUrl("abyat"),
    icon: abyatIcon,
    isExternal: true
  }, {
    title: "shops.namshi",
    url: getShopAffiliateUrl("namshi"),
    icon: namshiIcon,
    isExternal: true
  }, {
    title: "shops.trendyol",
    url: getShopAffiliateUrl("trendyol"),
    icon: trendyolIcon,
    isExternal: true
  }, {
    title: "shops.asos",
    url: getShopAffiliateUrl("asos"),
    icon: asosIcon,
    isExternal: true
  }];
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

  useEffect(() => {
    const handleStorageChange = () => {
      setShopItems(getShopItems());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchUsername();
    }
  }, [user]);

  const fetchUsername = async () => {
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
              {!collapsed && <span className="font-medium">Search Products</span>}
            </div>
          </NavLink>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">{t('nav.dashboard') || 'Main'}</SidebarGroupLabel>
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
          <SidebarGroupLabel className="text-sidebar-foreground/70">{t('shops.title') || 'Shops'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {shopItems.map(item => {
              const shopId = item.title.split('.')[1]; // Extract shop id from 'shops.noon'
              const isNoon = shopId === 'noon';
              const isShein = shopId === 'shein';
              const isImageIcon = typeof item.icon === 'string';
              return <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      {item.isExternal ? <button onClick={() => handleShopClick(item.url, true)} className={collapsed ? "flex items-center justify-center w-full p-2 rounded-full hover:bg-sidebar-accent/50 text-sidebar-foreground" : "flex items-center gap-2 w-full p-2 rounded-md hover:bg-sidebar-accent/50 text-sidebar-foreground px-[15px] py-0"}>
                          {isImageIcon ? <img src={item.icon as string} alt={`${shopId} icon`} className={collapsed ? "h-6 w-6 rounded-full object-cover" : "h-5 w-5 rounded-full object-cover shrink-0"} /> : <item.icon className={collapsed ? "h-5 w-5" : "h-4 w-4 shrink-0"} />}
                          {!collapsed && <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                              <span className="shrink-0">{t(item.title)}</span>
                              {isNoon && <>
                                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium rounded border border-emerald-500/30">
                                    KINGDOME
                                  </span>
                                  <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-700 dark:text-orange-400 text-[10px] font-medium rounded border border-orange-500/30">
                                    save 10 rial
                                  </span>
                                </>}
                              {isShein && <>
                                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[10px] font-medium rounded border border-blue-500/30">
                                    search for
                                  </span>
                                  <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-700 dark:text-purple-400 text-[10px] font-medium rounded border border-purple-500/30">
                                    R2M6A
                                  </span>
                                </>}
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
          <SidebarGroupLabel className="text-sidebar-foreground/70">{t('settings.other') || 'Other'}</SidebarGroupLabel>
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
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sidebar-foreground truncate">{username || user?.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </>
        )}
      </SidebarContent>
    </Sidebar>;
}