import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, DollarSign, Package, ShoppingCart, Tag, Store } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConvertedPrice } from "@/hooks/useConvertedPrice";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import emptyStateIcon from "@/assets/empty-state-icon.png";

interface AnalyticsStats {
  total_products: number;
  price_drops: number;
  price_increases: number;
  total_value: number;
  favoriteProducts: number;
  storeBreakdown: Record<string, number>;
  totalOrders: number;
  totalSpent: number;
  promoCodesUsed: number;
  currency: string;
}

interface RecentChange {
  id: string;
  price: number;
  scraped_at: string;
  discount_percentage: number;
  products: {
    title: string;
    store: string;
    current_price: number;
    currency: string;
  };
}

export default function Analytics() {
  const { t, language } = useLanguage();
  const { currency, convertPriceToDisplay } = useConvertedPrice();
  const { user } = useAuth();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [recentChanges, setRecentChanges] = useState<RecentChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, currency]);

  const loadAnalytics = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please login to view analytics");
        return;
      }

      const { data, error } = await supabase.functions.invoke('get-analytics', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data) {
        // Calculate total value with currency conversion
        const { data: products } = await supabase
          .from('products')
          .select('original_price, original_currency')
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        let totalValueConverted = 0;
        products?.forEach(product => {
          const converted = convertPriceToDisplay(
            product.original_price,
            product.original_currency
          );
          totalValueConverted += converted;
        });
        
        setStats({
          ...data.stats,
          total_value: totalValueConverted,
          favoriteProducts: data.favoriteProducts || 0,
          storeBreakdown: data.storeBreakdown || {},
          totalOrders: data.totalOrders || 0,
          totalSpent: data.totalSpent || 0,
          promoCodesUsed: data.promoCodesUsed || 0,
          currency: data.currency || 'SAR'
        });
        setRecentChanges(data.recentChanges || []);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const priceStatsDisplay = stats ? [
    {
      title: "dashboard.priceDrops",
      value: `${stats.price_drops}%`,
      icon: TrendingDown,
      color: "text-price-decrease"
    },
    {
      title: "dashboard.priceIncreases",
      value: `${stats.price_increases}%`,
      icon: TrendingUp,
      color: "text-price-increase"
    }
  ] : [];

  const generalStatsDisplay = stats ? [
    {
      title: "Favorite Products",
      value: stats.favoriteProducts.toString(),
      icon: Package,
      color: "text-primary"
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: "text-blue-500"
    },
    {
      title: "Total Spent",
      value: `${stats.currency} ${stats.totalSpent.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-500"
    },
    {
      title: "Promo Codes Used",
      value: stats.promoCodesUsed.toString(),
      icon: Tag,
      color: "text-purple-500"
    }
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  if (stats && stats.total_products === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <img src={emptyStateIcon} alt={t('products.noProducts')} className="h-24 w-24 opacity-70" />
        <h3 className="text-xl font-medium">{t('products.noProducts')}</h3>
        <p className="text-muted-foreground">{t('analytics.addProductsPrompt')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.description')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Top Price Changes</CardTitle>
            <CardDescription>Top 3 Krolist Deals by Discount %</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentChanges.length > 0 ? (
                recentChanges.map((change) => {
                  const product = change.products;

                  return (
                    <div
                      key={change.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm line-clamp-1">{product.title}</div>
                        <div className="text-xs text-muted-foreground">{product.store}</div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end">
                          <div className="text-sm font-medium text-price-decrease">
                            {product.currency} {product.current_price.toFixed(2)}
                          </div>
                          <div className="text-xs text-price-decrease font-semibold">
                            -{change.discount_percentage}%
                          </div>
                        </div>
                        <TrendingDown className="h-4 w-4 text-price-decrease" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('analytics.noRecentChanges')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Price Statistics</CardTitle>
            <CardDescription>Average price change percentages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {priceStatsDisplay.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.title}
                    className="p-4 rounded-lg bg-muted/50 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                      <span className="text-sm text-muted-foreground">
                        {t(stat.title)}
                      </span>
                    </div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>General Statistics</CardTitle>
            <CardDescription>Overview of your activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {generalStatsDisplay.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.title}
                    className="p-4 rounded-lg bg-muted/50 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                      <span className="text-sm text-muted-foreground">
                        {stat.title}
                      </span>
                    </div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {stats && Object.keys(stats.storeBreakdown).length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Products by Store</CardTitle>
              <CardDescription>Breakdown of favorite products by store</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.storeBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([store, count]) => (
                    <div
                      key={store}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{store}</span>
                      </div>
                      <span className="text-lg font-bold">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
