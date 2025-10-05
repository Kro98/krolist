import { 
  BarChart3, 
  Home, 
  Package, 
  Settings, 
  Heart,
  Gift,
  PlusCircle,
  Megaphone,
  Calendar
} from "lucide-react";
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "nav.dashboard", url: "/", icon: Home },
];

const getShopAffiliateUrl = (shopId: string) => {
  const affiliateUrls: Record<string, string> = {
    shein: "https://s.click.aliexpress.com/e/_DCyUaLh",
    noon: "https://www.noon.com/?ref=affiliate123",
    amazon: "https://amazon.com/ref=affiliate123",
    ikea: "https://www.ikea.com/ref/affiliate123",
    abyat: "https://www.abyat.com/?ref=affiliate123",
    namshi: "https://www.namshi.com/?ref=affiliate123", 
    trendyol: "https://www.trendyol.com/?ref=affiliate123",
    asos: "https://www.asos.com/?ref=affiliate123"
  };
  return affiliateUrls[shopId] || `https://${shopId}.com`;
};

const getShopItems = () => {
  const saved = localStorage.getItem('shopOrder');
  if (saved) {
    const shopOrder = JSON.parse(saved);
    return shopOrder
      .filter((shop: any) => shop.enabled)
      .map((shop: any) => ({
        title: `shops.${shop.id}`,
        url: shop.id === 'amazon' ? '/amazon' : getShopAffiliateUrl(shop.id),
        icon: Package,
        name: shop.name,
        isExternal: shop.id !== 'amazon'
      }));
  }
  
  return [
    { title: "shops.shein", url: getShopAffiliateUrl("shein"), icon: Package, isExternal: true },
    { title: "shops.noon", url: getShopAffiliateUrl("noon"), icon: Package, isExternal: true },
    { title: "shops.amazon", url: "/amazon", icon: Package, isExternal: false },
    { title: "shops.ikea", url: getShopAffiliateUrl("ikea"), icon: Package, isExternal: true },
    { title: "shops.abyat", url: getShopAffiliateUrl("abyat"), icon: Package, isExternal: true },
    { title: "shops.namshi", url: getShopAffiliateUrl("namshi"), icon: Package, isExternal: true },
    { title: "shops.trendyol", url: getShopAffiliateUrl("trendyol"), icon: Package, isExternal: true },
    { title: "shops.asos", url: getShopAffiliateUrl("asos"), icon: Package, isExternal: true },
  ];
};

const otherItems = [
  { title: "nav.events", url: "/events", icon: Calendar },
  { title: "nav.promoCodes", url: "/promo-codes", icon: Gift },
  { title: "nav.donation", url: "/donation", icon: Heart },
  { title: "nav.settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { t, language } = useLanguage();
  const [shopItems, setShopItems] = useState(getShopItems());

  useEffect(() => {
    const handleStorageChange = () => {
      setShopItems(getShopItems());
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
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
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50 text-sidebar-foreground";

  return (
    <Sidebar 
      className={`${collapsed ? "w-16" : "w-64"} bg-sidebar border-sidebar-border`} 
      collapsible="icon"
      side={language === 'ar' ? 'right' : 'left'}
    >
      <SidebarContent className="bg-sidebar">
        {/* Dev Announcement Section */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="h-4 w-4 text-sidebar-primary" />
            <span className="text-sm font-medium text-sidebar-foreground">Dev Update</span>
          </div>
          {!collapsed && (
            <div className="text-xs text-sidebar-foreground/70 bg-sidebar-primary/10 p-2 rounded">
              Welcome to PriceTracker! More features coming soon.
            </div>
          )}
        </div>

        {/* Add Product Button */}
        <div className="p-4">
          <NavLink to="/add-product" onClick={handleNavClick}>
            <div className="flex items-center justify-center gap-2 bg-gradient-primary text-white py-2 px-4 rounded-lg hover:shadow-hover transition-all duration-200">
              <PlusCircle className="h-4 w-4" />
              {!collapsed && <span className="font-medium">{t('nav.addProduct')}</span>}
            </div>
          </NavLink>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">{t('nav.dashboard')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls} onClick={handleNavClick}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{t(item.title)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">{t('shops.title') || 'Shops'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {shopItems.map((item) => {
                const shopId = item.title.split('.')[1]; // Extract shop id from 'shops.noon'
                const isNoon = shopId === 'noon';
                const isShein = shopId === 'shein';
                const isAmazon = shopId === 'amazon';
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      {isAmazon ? (
                        <NavLink to="/amazon" className={getNavCls} onClick={handleNavClick}>
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && (
                            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                              <span className="shrink-0">{t(item.title)}</span>
                            </div>
                          )}
                        </NavLink>
                      ) : item.isExternal ? (
                        <button 
                          onClick={() => handleShopClick(item.url, true)}
                          className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-sidebar-accent/50 text-sidebar-foreground"
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && (
                            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                              <span className="shrink-0">{t(item.title)}</span>
                              {isNoon && (
                                <>
                                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium rounded border border-emerald-500/30">
                                    KINGDOME
                                  </span>
                                  <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-700 dark:text-orange-400 text-[10px] font-medium rounded border border-orange-500/30">
                                    save 10 rial
                                  </span>
                                </>
                              )}
                              {isShein && (
                                <>
                                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[10px] font-medium rounded border border-blue-500/30">
                                    search for
                                  </span>
                                  <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-700 dark:text-purple-400 text-[10px] font-medium rounded border border-purple-500/30">
                                    R2M6A
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </button>
                      ) : (
                        <NavLink to={item.url} className={getNavCls} onClick={handleNavClick}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{t(item.title)}</span>}
                        </NavLink>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">{t('settings.other') || 'Other'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls} onClick={handleNavClick}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{t(item.title)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}