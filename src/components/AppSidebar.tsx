import { 
  BarChart3, 
  Home, 
  Package, 
  Settings, 
  Tag, 
  Heart,
  Gift,
  PlusCircle,
  Megaphone
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

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
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Products", url: "/products", icon: Package },
  { title: "Categories", url: "/categories", icon: Tag },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const otherItems = [
  { title: "Promo Codes", url: "/promo-codes", icon: Gift },
  { title: "Support Dev", url: "/donation", icon: Heart },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-accent";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        {/* Dev Announcement Section */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Dev Update</span>
          </div>
          {!collapsed && (
            <div className="text-xs text-muted-foreground bg-primary/10 p-2 rounded">
              Welcome to PriceTracker! More features coming soon.
            </div>
          )}
        </div>

        {/* Add Product Button */}
        <div className="p-4">
          <NavLink to="/add-product">
            <div className="flex items-center justify-center gap-2 bg-gradient-primary text-white py-2 px-4 rounded-lg hover:shadow-hover transition-all duration-200">
              <PlusCircle className="h-4 w-4" />
              {!collapsed && <span className="font-medium">Add Product</span>}
            </div>
          </NavLink>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Other</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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