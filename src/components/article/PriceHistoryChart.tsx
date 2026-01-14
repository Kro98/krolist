import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingDown, TrendingUp, Minus, X, Loader2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/lib/currencyConversion';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PriceDataPoint {
  date: string;
  price: number;
  formattedDate: string;
}

interface PriceHistoryChartProps {
  productId: string;
  productTitle: string;
  currentPrice: number;
  originalPrice: number;
  currency: string;
  onClose: () => void;
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

export const PriceHistoryChart = ({
  productId,
  productTitle,
  currentPrice,
  originalPrice,
  currency,
  onClose,
}: PriceHistoryChartProps) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [priceData, setPriceData] = useState<PriceDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<{
    lowestPrice: number;
    highestPrice: number;
    avgPrice: number;
    priceChange: number;
    priceChangePercent: number;
  } | null>(null);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      setIsLoading(true);
      try {
        // Calculate date range
        let startDate: Date | null = null;
        const now = new Date();
        
        switch (timeRange) {
          case '7d':
            startDate = subDays(now, 7);
            break;
          case '30d':
            startDate = subDays(now, 30);
            break;
          case '90d':
            startDate = subMonths(now, 3);
            break;
          case 'all':
            startDate = null;
            break;
        }

        // Build query - use krolist_price_history for article products
        let query = supabase
          .from('krolist_price_history')
          .select('price, scraped_at')
          .eq('product_id', productId)
          .order('scraped_at', { ascending: true });

        if (startDate) {
          query = query.gte('scraped_at', startDate.toISOString());
        }

        const { data, error } = await query.limit(100);

        if (error) throw error;

        // Transform data for chart
        const chartData: PriceDataPoint[] = (data || []).map(item => ({
          date: item.scraped_at,
          price: item.price,
          formattedDate: format(new Date(item.scraped_at), isArabic ? 'dd/MM' : 'MMM dd', {
            locale: isArabic ? ar : undefined,
          }),
        }));

        // Add current price if no recent data
        if (chartData.length === 0 || (chartData.length > 0 && 
            new Date(chartData[chartData.length - 1].date).getTime() < now.getTime() - 86400000)) {
          chartData.push({
            date: now.toISOString(),
            price: currentPrice,
            formattedDate: format(now, isArabic ? 'dd/MM' : 'MMM dd', {
              locale: isArabic ? ar : undefined,
            }),
          });
        }

        // Add original price at the start if we have data
        if (chartData.length > 0 && originalPrice !== currentPrice) {
          const firstDate = new Date(chartData[0].date);
          chartData.unshift({
            date: subDays(firstDate, 1).toISOString(),
            price: originalPrice,
            formattedDate: format(subDays(firstDate, 1), isArabic ? 'dd/MM' : 'MMM dd', {
              locale: isArabic ? ar : undefined,
            }),
          });
        }

        setPriceData(chartData);

        // Calculate stats
        if (chartData.length > 0) {
          const prices = chartData.map(d => d.price);
          const lowestPrice = Math.min(...prices);
          const highestPrice = Math.max(...prices);
          const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
          const firstPrice = chartData[0].price;
          const lastPrice = chartData[chartData.length - 1].price;
          const priceChange = lastPrice - firstPrice;
          const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;

          setStats({
            lowestPrice,
            highestPrice,
            avgPrice,
            priceChange,
            priceChangePercent,
          });
        }
      } catch (error) {
        console.error('Error fetching price history:', error);
        // Create minimal chart data with original and current price
        const now = new Date();
        setPriceData([
          {
            date: subDays(now, 30).toISOString(),
            price: originalPrice,
            formattedDate: format(subDays(now, 30), isArabic ? 'dd/MM' : 'MMM dd', {
              locale: isArabic ? ar : undefined,
            }),
          },
          {
            date: now.toISOString(),
            price: currentPrice,
            formattedDate: format(now, isArabic ? 'dd/MM' : 'MMM dd', {
              locale: isArabic ? ar : undefined,
            }),
          },
        ]);
        
        const priceChange = currentPrice - originalPrice;
        const priceChangePercent = originalPrice > 0 ? (priceChange / originalPrice) * 100 : 0;
        
        setStats({
          lowestPrice: Math.min(originalPrice, currentPrice),
          highestPrice: Math.max(originalPrice, currentPrice),
          avgPrice: (originalPrice + currentPrice) / 2,
          priceChange,
          priceChangePercent,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPriceHistory();
  }, [productId, timeRange, currentPrice, originalPrice, isArabic]);

  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: '7d', label: isArabic ? '٧ أيام' : '7D' },
    { value: '30d', label: isArabic ? '٣٠ يوم' : '30D' },
    { value: '90d', label: isArabic ? '٣ أشهر' : '3M' },
    { value: 'all', label: isArabic ? 'الكل' : 'All' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
          <p className="text-xs text-muted-foreground mb-1">
            {format(new Date(data.date), isArabic ? 'dd/MM/yyyy' : 'MMM dd, yyyy', {
              locale: isArabic ? ar : undefined,
            })}
          </p>
          <p className="text-lg font-bold text-primary">
            {formatPrice(data.price, currency as any)}
          </p>
        </div>
      );
    }
    return null;
  };

  const getPriceChangeIcon = () => {
    if (!stats) return null;
    if (stats.priceChange < 0) {
      return <TrendingDown className="w-4 h-4 text-emerald-500" />;
    } else if (stats.priceChange > 0) {
      return <TrendingUp className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getGradientColor = () => {
    if (!stats) return { stroke: 'hsl(var(--primary))', fill: 'hsl(var(--primary))' };
    if (stats.priceChange < 0) {
      return { stroke: '#10b981', fill: '#10b981' }; // emerald
    } else if (stats.priceChange > 0) {
      return { stroke: '#ef4444', fill: '#ef4444' }; // red
    }
    return { stroke: 'hsl(var(--primary))', fill: 'hsl(var(--primary))' };
  };

  const gradientColors = getGradientColor();

  return (
    <Card className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {isArabic ? 'سجل الأسعار' : 'Price History'}
            </CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
              {productTitle}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Time range selector */}
        <div className="flex gap-1 mt-4">
          {timeRanges.map(range => (
            <Button
              key={range.value}
              variant={timeRange === range.value ? 'default' : 'outline'}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setTimeRange(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">
              {isArabic ? 'جاري تحميل البيانات...' : 'Loading price data...'}
            </p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    {isArabic ? 'أدنى سعر' : 'Lowest'}
                  </p>
                  <p className="text-sm font-bold text-emerald-500">
                    {formatPrice(stats.lowestPrice, currency as any)}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    {isArabic ? 'أعلى سعر' : 'Highest'}
                  </p>
                  <p className="text-sm font-bold text-red-500">
                    {formatPrice(stats.highestPrice, currency as any)}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    {isArabic ? 'المتوسط' : 'Average'}
                  </p>
                  <p className="text-sm font-bold">
                    {formatPrice(stats.avgPrice, currency as any)}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    {isArabic ? 'التغيير' : 'Change'}
                  </p>
                  <div className="flex items-center gap-1">
                    {getPriceChangeIcon()}
                    <p className={cn(
                      "text-sm font-bold",
                      stats.priceChange < 0 ? "text-emerald-500" : 
                      stats.priceChange > 0 ? "text-red-500" : "text-muted-foreground"
                    )}>
                      {stats.priceChangePercent.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={priceData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={gradientColors.fill} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={gradientColors.fill} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="formattedDate"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis
                    domain={['dataMin - 10', 'dataMax + 10']}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    dx={-10}
                    tickFormatter={(value) => value.toFixed(0)}
                    width={50}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {stats && (
                    <ReferenceLine
                      y={stats.avgPrice}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="3 3"
                      strokeOpacity={0.5}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={gradientColors.stroke}
                    strokeWidth={2}
                    fill="url(#priceGradient)"
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Current price indicator */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{isArabic ? 'السعر الحالي' : 'Current Price'}</span>
              </div>
              <Badge variant="outline" className="text-lg font-bold px-3 py-1">
                {formatPrice(currentPrice, currency as any)}
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
