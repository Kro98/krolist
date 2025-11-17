import { useState, useEffect } from "react";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Shield, Package, Layers, Tag, Store, MessageSquare, Menu } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import KrolistProductsManager from "./admin/KrolistProductsManager";
import PromoCodesManager from "./admin/PromoCodesManager";
import CategoryManager from "./admin/CategoryManager";
import LoginMessagesManager from "./admin/LoginMessagesManager";
import OrdersManager from "./admin/OrdersManager";
import { ShopManager } from "@/components/ShopManager";
export default function Admin() {
  const {
    isAdmin,
    isLoading: roleLoading
  } = useAdminRole();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    t
  } = useLanguage();
  const [orderCount, setOrderCount] = useState(0);
  const [activeTab, setActiveTab] = useState("products");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tabs = [{
    value: "products",
    label: t('admin.krolistProducts'),
    icon: Package
  }, {
    value: "categories",
    label: t('admin.categories'),
    icon: Layers
  }, {
    value: "promo-codes",
    label: t('admin.promoCodes'),
    icon: Tag
  }, {
    value: "shops",
    label: t('admin.shopManagement'),
    icon: Store
  }, {
    value: "login-messages",
    label: t('admin.loginMessages'),
    icon: MessageSquare
  }, {
    value: "orders",
    label: "Orders",
    icon: Package,
    badge: orderCount
  }];
  useEffect(() => {
    if (isAdmin) {
      fetchOrderCount();
    }
  }, [isAdmin]);
  const fetchOrderCount = async () => {
    try {
      const {
        count,
        error
      } = await supabase.from('orders').select('*', {
        count: 'exact',
        head: true
      }).eq('status', 'pending');
      if (!error && count !== null) {
        setOrderCount(count);
      }
    } catch (error) {
      console.error('Error fetching order count:', error);
    }
  };
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast({
        title: t('admin.accessDenied'),
        description: t('admin.accessDeniedDesc'),
        variant: "destructive"
      });
      navigate('/');
    }
  }, [isAdmin, roleLoading, navigate, toast, t]);
  if (roleLoading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>;
  }
  if (!isAdmin) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">{t('admin.accessDenied')}</h1>
          <p className="text-muted-foreground">{t('admin.accessDeniedDesc')}</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen pb-20 md:pb-6">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">{t('admin.dashboard')}</h1>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {t('admin.dashboard')}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-1">
                {tabs.map(tab => {
                const Icon = tab.icon;
                return <Button key={tab.value} variant={activeTab === tab.value ? "secondary" : "ghost"} className="w-full justify-start relative" onClick={() => {
                  setActiveTab(tab.value);
                  setMobileMenuOpen(false);
                }}>
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.label}
                      {tab.badge && tab.badge > 0 && <span className="ml-auto h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                          {tab.badge}
                        </span>}
                    </Button>;
              })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block container mx-auto py-6 px-4 max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold mx-0">{t('admin.dashboard')}</h1>
            <p className="text-muted-foreground">{t('admin.dashboardDesc')}</p>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-0 px-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop Tabs */}
          <TabsList className="hidden md:inline-flex w-full lg:w-auto gap-2 flex-wrap mb-6">
            {tabs.map(tab => {
            const Icon = tab.icon;
            return <TabsTrigger key={tab.value} value={tab.value} className="relative">
                  <Icon className="h-4 w-4 mr-2" />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 && <span className="ml-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                      {tab.badge}
                    </span>}
                </TabsTrigger>;
          })}
          </TabsList>

          <TabsContent value="products" className="mt-0 md:mt-6">
            <KrolistProductsManager />
          </TabsContent>

          <TabsContent value="categories" className="mt-0 md:mt-6">
            <CategoryManager />
          </TabsContent>

          <TabsContent value="promo-codes" className="mt-0 md:mt-6">
            <PromoCodesManager />
          </TabsContent>

          <TabsContent value="shops" className="mt-0 md:mt-6">
            <ShopManager />
          </TabsContent>

          <TabsContent value="login-messages" className="mt-0 md:mt-6">
            <LoginMessagesManager />
          </TabsContent>

          <TabsContent value="orders" className="mt-0 md:mt-6">
            <OrdersManager />
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="grid grid-cols-6 gap-1 p-2">
          {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          return <button key={tab.value} onClick={() => setActiveTab(tab.value)} className={cn("relative flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200", isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
                <Icon className={cn("h-5 w-5", isActive && "animate-scale-in")} />
                <span className={cn("text-[10px] mt-1 font-medium truncate max-w-full", isActive && "font-semibold")}>
                  {tab.label.split(' ')[0]}
                </span>
                {tab.badge && tab.badge > 0 && <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold">
                    {tab.badge}
                  </span>}
              </button>;
        })}
        </div>
      </div>
    </div>;
}