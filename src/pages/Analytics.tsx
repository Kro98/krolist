import { useState, useEffect } from "react";
import { 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Tag, 
  Store, 
  ExternalLink, 
  ChevronDown,
  Sparkles,
  BarChart3,
  Activity
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConvertedPrice } from "@/hooks/useConvertedPrice";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import emptyStateIcon from "@/assets/empty-state-icon.png";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine, AreaChart, Area } from "recharts";

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
  original_price: number;
  scraped_at: string;
  discount_percentage: number;
  products: {
    id: string;
    title: string;
    store: string;
    current_price: number;
    currency: string;
    image_url: string | null;
  };
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color = "primary",
  delay = 0,
  trend,
  sublabel
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
  color?: string;
  delay?: number;
  trend?: "up" | "down";
  sublabel?: string;
}) {
  const colorClasses: Record<string, string> = {
    primary: "from-primary/20 to-primary/5 border-primary/20",
    success: "from-success/20 to-success/5 border-success/20", 
    warning: "from-warning/20 to-warning/5 border-warning/20",
    destructive: "from-destructive/20 to-destructive/5 border-destructive/20",
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/20",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/20",
  };

  const iconColorClasses: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10", 
    destructive: "text-destructive bg-destructive/10",
    blue: "text-blue-500 bg-blue-500/10",
    purple: "text-purple-500 bg-purple-500/10",
  };

  return (
    <div 
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${colorClasses[color]} 
        p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg backdrop-blur-sm`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-transparent pointer-events-none" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {trend && (
              <span className={`text-xs font-medium ${trend === "up" ? "text-success" : "text-destructive"}`}>
                {trend === "up" ? "↑" : "↓"}
              </span>
            )}
          </div>
          {sublabel && (
            <p className="text-xs text-muted-foreground">{sublabel}</p>
          )}
        </div>
        
        <div className={`p-2.5 rounded-xl ${iconColorClasses[color]} transition-transform group-hover:scale-110`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// Hero Value Card Component
function HeroValueCard({ value, currency, label }: { value: number; currency: string; label: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 text-primary-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(255,255,255,0.15),transparent_50%)]" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10" />
      
      <div className="relative space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
            <DollarSign className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium opacity-90">{label}</span>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium opacity-75">{currency}</span>
            <span className="text-4xl font-bold tracking-tight">{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs opacity-75">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Total value of tracked items</span>
        </div>
      </div>
    </div>
  );
}

// Deal Card Component
function DealCard({ change, index, navigate }: { change: RecentChange; index: number; navigate: (path: string) => void }) {
  const product = change.products;
  
  const chartData = [
    { name: 'Original', price: change.original_price },
    { name: 'Current', price: product.current_price },
  ];

  return (
    <Collapsible>
      <div 
        className="group rounded-2xl bg-card border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-border"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-4 p-4 cursor-pointer">
            <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-muted flex-shrink-0 ring-1 ring-border/50">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-muted">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="absolute -top-1 -right-1 bg-success text-success-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                #{index + 1}
              </div>
            </div>
            
            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                {product.title}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {product.store}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-lg font-bold text-success">
                    {product.currency} {product.current_price.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <TrendingDown className="h-3 w-3 text-success" />
                  <span className="text-xs font-semibold text-success">
                    -{change.discount_percentage}%
                  </span>
                </div>
              </div>
              <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 border-t border-border/50">
            <div className="h-28 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id={`gradient-${change.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip 
                    formatter={(value: number) => [`${product.currency} ${value.toFixed(2)}`, 'Price']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  />
                  <ReferenceLine 
                    y={change.original_price} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    fill={`url(#gradient-${change.id})`}
                    dot={{ fill: 'hsl(var(--success))', strokeWidth: 0, r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                Was: <span className="line-through">{product.currency} {change.original_price.toFixed(2)}</span>
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/products?highlight=${product.id}`);
                }}
                className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors"
              >
                View Product <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Store Card Component
function StoreCard({ store, count, maxCount, index, totalProducts }: { 
  store: string; 
  count: number; 
  maxCount: number; 
  index: number;
  totalProducts: number;
}) {
  const percentage = Math.round((count / totalProducts) * 100);
  const isTop = index === 0;
  
  // Generate a consistent color based on store name
  const colors = [
    { bg: "from-primary/15 to-primary/5", border: "border-primary/20", text: "text-primary", bar: "from-primary to-primary/60" },
    { bg: "from-blue-500/15 to-blue-500/5", border: "border-blue-500/20", text: "text-blue-500", bar: "from-blue-500 to-blue-500/60" },
    { bg: "from-purple-500/15 to-purple-500/5", border: "border-purple-500/20", text: "text-purple-500", bar: "from-purple-500 to-purple-500/60" },
    { bg: "from-emerald-500/15 to-emerald-500/5", border: "border-emerald-500/20", text: "text-emerald-500", bar: "from-emerald-500 to-emerald-500/60" },
    { bg: "from-rose-500/15 to-rose-500/5", border: "border-rose-500/20", text: "text-rose-500", bar: "from-rose-500 to-rose-500/60" },
    { bg: "from-amber-500/15 to-amber-500/5", border: "border-amber-500/20", text: "text-amber-500", bar: "from-amber-500 to-amber-500/60" },
  ];
  const color = colors[index % colors.length];

  return (
    <div 
      className={`group relative overflow-hidden rounded-2xl border ${color.border} bg-gradient-to-br ${color.bg} 
        p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {isTop && (
        <div className="absolute top-2 right-2">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
            Top
          </span>
        </div>
      )}
      
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-xl bg-background/80 backdrop-blur-sm shadow-sm`}>
          <Store className={`h-5 w-5 ${color.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{store}</p>
          <p className="text-xs text-muted-foreground">{percentage}% of favorites</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <span className={`text-3xl font-bold ${color.text}`}>{count}</span>
          <span className="text-xs text-muted-foreground mb-1">products</span>
        </div>
        
        <div className="h-1.5 bg-background/60 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${color.bar} rounded-full transition-all duration-700 ease-out`}
            style={{ width: `${(count / maxCount) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { t, language } = useLanguage();
  const { currency, convertPriceToDisplay } = useConvertedPrice();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [recentChanges, setRecentChanges] = useState<RecentChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, currency]);

  // Real-time subscription for admin changes
  useEffect(() => {
    const channel = supabase
      .channel('analytics-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          if (user) loadAnalytics();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          if (user) loadAnalytics();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'krolist_products' },
        () => {
          if (user) loadAnalytics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        const { data: products } = await supabase
          .from('products')
          .select('original_price, original_currency')
          .eq('user_id', user!.id)
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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-muted rounded-2xl" />
          <div className="h-80 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  if (stats && stats.favoriteProducts === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />
          <img src={emptyStateIcon} alt="No favorite products" className="relative h-32 w-32 opacity-80" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold">No Analytics Yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Start tracking products to see your personalized analytics dashboard
          </p>
        </div>
        <button 
          onClick={() => navigate('/products')}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
        >
          Browse Products
        </button>
      </div>
    );
  }

  const maxStoreCount = Math.max(...Object.values(stats?.storeBreakdown || { default: 1 }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('dashboard.description')}</p>
          </div>
        </div>
      </div>

      {/* Hero Value Card */}
      {stats && (
        <HeroValueCard 
          value={stats.total_value} 
          currency={currency} 
          label="Total Favorites Value" 
        />
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Package} 
          label="Favorite Products" 
          value={stats?.favoriteProducts.toString() || "0"} 
          color="primary"
          delay={0}
        />
        <StatCard 
          icon={ShoppingCart} 
          label="Total Orders" 
          value={stats?.totalOrders.toString() || "0"} 
          color="blue"
          delay={100}
        />
        <StatCard 
          icon={DollarSign} 
          label="Total Spent" 
          value={`${stats?.currency || 'SAR'} ${stats?.totalSpent.toFixed(2) || '0.00'}`} 
          color="success"
          delay={200}
        />
        <StatCard 
          icon={Tag} 
          label="Promo Codes Used" 
          value={stats?.promoCodesUsed.toString() || "0"} 
          color="purple"
          delay={300}
        />
      </div>

      {/* Price Trends */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-success/20 bg-gradient-to-br from-success/10 to-success/5 p-5">
          <div className="absolute top-3 right-3">
            <TrendingDown className="h-8 w-8 text-success/20" />
          </div>
          <div className="relative space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Avg. Price Drops</p>
            <p className="text-3xl font-bold text-success">{stats?.price_drops || 0}%</p>
            <p className="text-xs text-muted-foreground">across tracked items</p>
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-2xl border border-destructive/20 bg-gradient-to-br from-destructive/10 to-destructive/5 p-5">
          <div className="absolute top-3 right-3">
            <TrendingUp className="h-8 w-8 text-destructive/20" />
          </div>
          <div className="relative space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Avg. Price Increases</p>
            <p className="text-3xl font-bold text-destructive">{stats?.price_increases || 0}%</p>
            <p className="text-xs text-muted-foreground">across tracked items</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Deals */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Top Krolist Deals</h2>
          </div>
          
          <div className="space-y-3">
            {recentChanges.length > 0 ? (
              recentChanges.map((change, index) => (
                <DealCard key={change.id} change={change} index={index} navigate={navigate} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-border">
                <Package className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No deals available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Store Breakdown */}
        {stats && Object.keys(stats.storeBreakdown).length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Products by Store</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(stats.storeBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([store, count], index) => (
                  <StoreCard 
                    key={store} 
                    store={store} 
                    count={count} 
                    maxCount={maxStoreCount}
                    index={index}
                    totalProducts={stats.favoriteProducts}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
