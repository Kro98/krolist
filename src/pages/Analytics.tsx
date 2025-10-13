import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, TrendingDown, TrendingUp, Package, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface AnalyticsStats {
  total_products: number;
  price_drops: number;
  price_increases: number;
  total_value: number;
}

interface RecentChange {
  id: string;
  price: number;
  scraped_at: string;
  products: {
    title: string;
    store: string;
    current_price: number;
    currency: string;
  };
}

export default function Analytics() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [showStats, setShowStats] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [recentChanges, setRecentChanges] = useState<RecentChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

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
        setStats(data.stats);
        setRecentChanges(data.recentChanges || []);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const statsDisplay = stats ? [
    {
      title: "dashboard.totalProducts",
      value: stats.total_products.toString(),
      icon: Package,
      color: "text-primary"
    },
    {
      title: "dashboard.priceDrops",
      value: stats.price_drops.toString(),
      icon: TrendingDown,
      color: "text-price-decrease"
    },
    {
      title: "dashboard.priceIncreases",
      value: stats.price_increases.toString(),
      icon: TrendingUp,
      color: "text-price-increase"
    },
    {
      title: "dashboard.totalAmount",
      value: `${stats.total_value.toFixed(2)} SAR`,
      icon: DollarSign,
      color: "text-muted-foreground"
    }
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (stats && stats.total_products === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Package className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-xl font-medium">No Products Yet</h3>
        <p className="text-muted-foreground">Add products to view their analytics</p>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('dashboard.recentAlerts')}</CardTitle>
              <CardDescription>{t('dashboard.latestPriceChanges')}</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowAlerts(!showAlerts)}
            >
              {showAlerts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </CardHeader>
          {showAlerts && (
            <CardContent>
              <div className="space-y-3">
                {recentChanges.length > 0 ? (
                  recentChanges.slice(0, 5).map((change) => {
                    const product = change.products;
                    const priceChange = product.current_price - change.price;
                    const isDecrease = priceChange < 0;

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
                          <div className={`text-sm font-medium ${isDecrease ? 'text-price-decrease' : 'text-price-increase'}`}>
                            {product.currency} {product.current_price.toFixed(2)}
                          </div>
                          {isDecrease ? (
                            <TrendingDown className="h-4 w-4 text-price-decrease" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-price-increase" />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent price changes
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('dashboard.overview')}</CardTitle>
              <CardDescription>{t('dashboard.keyMetrics')}</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </CardHeader>
          {showStats && (
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {statsDisplay.map((stat) => {
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
          )}
        </Card>
      </div>
    </div>
  );
}
