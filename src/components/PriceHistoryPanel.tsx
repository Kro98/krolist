import { useState, useEffect } from "react";
import { History, TrendingDown, TrendingUp, Minus, ChevronLeft, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConvertedPrice } from "@/hooks/useConvertedPrice";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface PriceHistoryEntry {
  id: string;
  price: number;
  currency: string;
  original_price: number | null;
  scraped_at: string;
}

interface PriceHistoryPanelProps {
  productId: string;
  productTitle: string;
  originalCurrency: string;
  onBack: () => void;
  isKrolistProduct?: boolean;
}

export function PriceHistoryPanel({
  productId,
  productTitle,
  originalCurrency,
  onBack,
  isKrolistProduct = false
}: PriceHistoryPanelProps) {
  const { t, language } = useLanguage();
  const { currency, convertPriceToDisplay } = useConvertedPrice();
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('price_history')
          .select('*')
          .eq('product_id', productId)
          .order('scraped_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching price history:', error);
        } else {
          setHistory(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [productId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriceChange = (currentEntry: PriceHistoryEntry, index: number) => {
    if (index >= history.length - 1) return null;
    const previousEntry = history[index + 1];
    const change = currentEntry.price - previousEntry.price;
    const percentChange = previousEntry.price > 0 
      ? ((change / previousEntry.price) * 100).toFixed(1)
      : '0';
    return { change, percentChange };
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-br from-card via-card to-muted/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 w-8 p-0 hover:bg-background/50 transition-transform hover:scale-105"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="p-1.5 rounded-lg bg-primary/20">
            <History className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate">
              {language === 'ar' ? 'سجل الأسعار' : 'Price History'}
            </h3>
            <p className="text-xs text-muted-foreground truncate">{productTitle}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-3 py-2">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-muted-foreground">
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </span>
            </div>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <History className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'لا يوجد سجل أسعار بعد' : 'No price history yet'}
            </p>
            <p className="text-xs text-muted-foreground/70">
              {language === 'ar' ? 'سيتم تتبع تغييرات الأسعار هنا' : 'Price changes will be tracked here'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((entry, index) => {
              const priceChange = getPriceChange(entry, index);
              const displayPrice = convertPriceToDisplay(entry.price, originalCurrency);
              const isFirst = index === 0;
              const isLast = index === history.length - 1;

              return (
                <div
                  key={entry.id}
                  className={cn(
                    "relative p-3 rounded-xl border transition-all duration-300",
                    "hover:shadow-md hover:border-primary/30",
                    isFirst 
                      ? "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30" 
                      : "bg-muted/30 border-border/40",
                    "animate-fade-in"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Timeline connector */}
                  {!isLast && (
                    <div className="absolute left-6 top-full h-2 w-px bg-border/50" />
                  )}

                  <div className="flex items-start justify-between gap-3">
                    {/* Left side - Date/Time */}
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(entry.scraped_at)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(entry.scraped_at)}</span>
                      </div>
                      {isFirst && (
                        <Badge variant="secondary" className="w-fit text-[0.6rem] px-1.5 py-0 mt-1 bg-primary/20 text-primary border-0">
                          {language === 'ar' ? 'الأحدث' : 'Latest'}
                        </Badge>
                      )}
                    </div>

                    {/* Right side - Price */}
                    <div className="flex flex-col items-end gap-1">
                      <span className={cn(
                        "font-bold text-base",
                        isFirst ? "text-primary" : "text-foreground"
                      )}>
                        {currency} {displayPrice.toFixed(2)}
                      </span>
                      {priceChange && (
                        <div className={cn(
                          "flex items-center gap-1 text-xs font-medium",
                          priceChange.change < 0 
                            ? "text-emerald-500" 
                            : priceChange.change > 0 
                              ? "text-red-500" 
                              : "text-muted-foreground"
                        )}>
                          {priceChange.change < 0 ? (
                            <TrendingDown className="h-3 w-3" />
                          ) : priceChange.change > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <Minus className="h-3 w-3" />
                          )}
                          <span>
                            {priceChange.change > 0 ? '+' : ''}
                            {priceChange.percentChange}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t border-border/30 bg-muted/20">
        <p className="text-[0.6rem] text-center text-muted-foreground">
          {language === 'ar' 
            ? `يتم تتبع آخر 50 تحديث للسعر` 
            : `Tracking last 50 price updates`}
        </p>
      </div>
    </div>
  );
}
