import { useState, useEffect } from "react";
import { History, TrendingDown, TrendingUp, Minus, X, Calendar, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConvertedPrice } from "@/hooks/useConvertedPrice";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface PriceHistoryEntry {
  price: number;
  scraped_at: string;
}

interface PriceHistoryCardProps {
  productId: string;
  productTitle: string;
  originalCurrency?: string;
  isKrolistProduct?: boolean;
  onFlip: () => void;
  className?: string;
  isCompactGrid?: boolean; // True when in 2x2 mobile grid view
}

export function PriceHistoryCard({
  productId,
  productTitle,
  originalCurrency = "SAR",
  isKrolistProduct = false,
  onFlip,
  className = "",
  isCompactGrid = false
}: PriceHistoryCardProps) {
  const { language } = useLanguage();
  const { currency, convertPriceToDisplay } = useConvertedPrice();
  const isArabic = language === 'ar';
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch price history from database
  useEffect(() => {
    const fetchPriceHistory = async () => {
      setIsLoading(true);
      try {
        if (isKrolistProduct) {
          // For Krolist products, fetch from krolist_price_history table
          const { data, error } = await supabase
            .from('krolist_price_history')
            .select('price, scraped_at')
            .eq('product_id', productId)
            .order('scraped_at', { ascending: false })
            .limit(50);
          
          if (error) throw error;
          setPriceHistory(data || []);
        } else {
          // For user products, fetch from price_history table
          const { data, error } = await supabase
            .from('price_history')
            .select('price, scraped_at')
            .eq('product_id', productId)
            .order('scraped_at', { ascending: false })
            .limit(50);
          
          if (error) throw error;
          setPriceHistory(data || []);
        }
      } catch (error) {
        console.error('Error fetching price history:', error);
        setPriceHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPriceHistory();
  }, [productId, isKrolistProduct]);

  // Sort history by date (newest first) and limit to 50
  const sortedHistory = [...priceHistory]
    .sort((a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime())
    .slice(0, 50);

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return formatDistanceToNow(date, { 
      addSuffix: true,
      locale: isArabic ? ar : undefined 
    });
  };

  const getFormattedDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, isArabic ? 'dd/MM/yyyy HH:mm' : 'MMM dd, yyyy h:mm a');
  };

  const getPriceChangeIndicator = (currentPrice: number, previousPrice: number | null) => {
    if (!previousPrice) return null;
    
    const diff = currentPrice - previousPrice;
    const percentChange = ((diff / previousPrice) * 100).toFixed(1);
    
    if (diff < 0) {
      return {
        icon: <TrendingDown className="h-3 w-3" />,
        color: "text-green-500 bg-green-500/10",
        label: `${percentChange}%`
      };
    } else if (diff > 0) {
      return {
        icon: <TrendingUp className="h-3 w-3" />,
        color: "text-red-500 bg-red-500/10",
        label: `+${percentChange}%`
      };
    }
    return {
      icon: <Minus className="h-3 w-3" />,
      color: "text-muted-foreground bg-muted",
      label: "0%"
    };
  };

  return (
    <div className={cn(
      "absolute inset-0 z-10 rounded-2xl overflow-hidden",
      "bg-gradient-to-br from-card via-card to-card/95",
      "border-2 border-primary/20 shadow-xl",
      "animate-in fade-in duration-300",
      className
    )}>
      {/* Header */}
      <div className="relative p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <History className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">
                {isArabic ? 'سجل الأسعار' : 'Price History'}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1 max-w-[150px]">
                {productTitle}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onFlip}
            className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Price History List */}
      <ScrollArea className="h-[calc(100%-70px)]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">
              {isArabic ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        ) : sortedHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <History className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isArabic ? 'لا يوجد سجل أسعار بعد' : 'No price history yet'}
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {sortedHistory.map((entry, index) => {
              const displayPrice = convertPriceToDisplay(entry.price, originalCurrency);
              const previousEntry = sortedHistory[index + 1];
              const priceChange = previousEntry 
                ? getPriceChangeIndicator(entry.price, previousEntry.price) 
                : null;

              return (
                <div
                  key={`${entry.scraped_at}-${index}`}
                  className={cn(
                    "group p-3 rounded-xl border transition-all duration-200",
                    "bg-muted/30 border-border/50 hover:border-primary/30 hover:bg-muted/50",
                    index === 0 && "bg-primary/5 border-primary/20"
                  )}
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    animation: 'fadeInUp 0.3s ease-out forwards'
                  }}
                >
                  <div className={cn(
                    "flex gap-3",
                    isCompactGrid ? "flex-col" : "items-center justify-between",
                    isArabic && !isCompactGrid && "flex-row-reverse"
                  )}>
                    {/* Date & Time */}
                    <div className={cn("flex-1 min-w-0", isArabic && "text-right")}>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                        <Calendar className="h-3 w-3" />
                        <span className="truncate">{getRelativeTime(entry.scraped_at)}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/60">
                        {getFormattedDate(entry.scraped_at)}
                      </p>
                    </div>

                    {/* Price and Change - stack in compact grid */}
                    <div className={cn(
                      "flex items-center gap-2",
                      isCompactGrid && "justify-between",
                      isArabic && "flex-row-reverse"
                    )}>
                      {/* Price Change Badge */}
                      {priceChange && (
                        <div className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium",
                          priceChange.color
                        )}>
                          {priceChange.icon}
                          <span>{priceChange.label}</span>
                        </div>
                      )}

                      {/* Price */}
                      <div className={cn(
                        "flex items-center gap-1 font-bold",
                        index === 0 ? "text-primary" : "text-foreground"
                      )}>
                        <span className="text-sm">{currency}</span>
                        <span className="text-base tabular-nums">{displayPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Current price indicator */}
                  {index === 0 && (
                    <div className={cn(
                      "mt-2 pt-2 border-t border-primary/20",
                      "flex items-center gap-1 text-[10px] text-primary font-medium",
                      isArabic && "flex-row-reverse"
                    )}>
                      <DollarSign className="h-3 w-3" />
                      <span>{isArabic ? 'السعر الحالي' : 'Current Price'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer with count */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-card to-transparent">
        <p className="text-center text-[10px] text-muted-foreground">
          {isArabic 
            ? `${sortedHistory.length} تحديث سعر` 
            : `${sortedHistory.length} price update${sortedHistory.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}