import { useEffect } from "react";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KrolistProductsManager from "./admin/KrolistProductsManager";
import PromoCodesManager from "./admin/PromoCodesManager";
import CategoryManager from "./admin/CategoryManager";
import LoginMessagesManager from "./admin/LoginMessagesManager";
import { ShopManager } from "@/components/ShopManager";

export default function Admin() {
  const { isAdmin, isLoading: roleLoading } = useAdminRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">{t('admin.accessDenied')}</h1>
          <p className="text-muted-foreground">{t('admin.accessDeniedDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{t('admin.dashboard')}</h1>
          <p className="text-muted-foreground">{t('admin.dashboardDesc')}</p>
        </div>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="products">{t('admin.krolistProducts')}</TabsTrigger>
          <TabsTrigger value="categories">{t('admin.categories')}</TabsTrigger>
          <TabsTrigger value="promo-codes">{t('admin.promoCodes')}</TabsTrigger>
          <TabsTrigger value="shops">{t('admin.shopManagement')}</TabsTrigger>
          <TabsTrigger value="login-messages">{t('admin.loginMessages')}</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <KrolistProductsManager />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoryManager />
        </TabsContent>

        <TabsContent value="promo-codes" className="mt-6">
          <PromoCodesManager />
        </TabsContent>


        <TabsContent value="shops" className="mt-6">
          <ShopManager />
        </TabsContent>

        <TabsContent value="login-messages" className="mt-6">
          <LoginMessagesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
