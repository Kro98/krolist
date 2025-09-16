import { 
  BarChart3, 
  Home, 
  Package, 
  Settings, 
  Heart,
  Gift,
  PlusCircle,
  Megaphone
} from "lucide-react";
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
  { title: "nav.products", url: "/products", icon: Package },
  { title: "nav.analytics", url: "/analytics", icon: BarChart3 },
];

const otherItems = [
  { title: "nav.promoCodes", url: "/promo-codes", icon: Gift },
  { title: "nav.donation", url: "/donation", icon: Heart },
  { title: "nav.settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { t, language } = useLanguage();

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50 text-sidebar-foreground";

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} bg-sidebar border-sidebar-border`} collapsible="icon">
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
          <NavLink to="/add-product">
            <div className="flex items-center justify-center gap-2 bg-gradient-primary text-white py-2 px-4 rounded-lg hover:shadow-hover transition-all duration-200">
              <PlusCircle className="h-4 w-4" />
              {!collapsed && <span className="font-medium">{t('nav.addProduct')}</span>}
            </div>
          </NavLink>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
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
          <SidebarGroupLabel className="text-sidebar-foreground/70">Other</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
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