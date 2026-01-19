import { useState, useEffect, useRef } from "react";
import { History, TrendingDown, TrendingUp, Minus, X, Calendar, DollarSign, Loader2, BarChart3 } from "lucide-react";
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
  isCompactGrid?: boolean;
}

type CardSize = 'compact' | 'medium' | 'large';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardSize, setCardSize] = useState<CardSize>('medium');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Detect card dimensions and determine size category
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        setDimensions({ width: offsetWidth, height: offsetHeight });
        
        // Determine card size based on dimensions
        if (offsetWidth < 180 || offsetHeight < 200) {
          setCardSize('compact');
        } else if (offsetWidth < 280 || offsetHeight < 320) {
          setCardSize('medium');
        } else {
          setCardSize('large');
        }
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  // Override to compact if isCompactGrid is true
  const effectiveSize = isCompactGrid ? 'compact' : cardSize;

  // Fetch price history from database
  useEffect(() => {
    const fetchPriceHistory = async () => {
      setIsLoading(true);
      try {
        const table = isKrolistProduct ? 'krolist_price_history' : 'price_history';
        const { data, error } = await supabase
          .from(table)
          .select('price, scraped_at')
          .eq('product_id', productId)
          .order('scraped_at', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        setPriceHistory(data || []);
      } catch (error) {
        console.error('Error fetching price history:', error);
        setPriceHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPriceHistory();
  }, [productId, isKrolistProduct]);

  // Sort history by date (newest first)
  const sortedHistory = [...priceHistory]
    .sort((a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime())
    .slice(0, 50);

  // Calculate stats for mini visualization
  const prices = sortedHistory.map(h => h.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const currentPrice = prices[0] || 0;

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return formatDistanceToNow(date, { 
      addSuffix: true,
      locale: isArabic ? ar : undefined 
    });
  };

  const getFormattedDate = (dateStr: string, short = false) => {
    const date = new Date(dateStr);
    if (short) {
      return format(date, isArabic ? 'dd/MM' : 'MMM dd');
    }
    return format(date, isArabic ? 'dd/MM/yyyy HH:mm' : 'MMM dd, yyyy h:mm a');
  };

  const getPriceChangeIndicator = (currentPrice: number, previousPrice: number | null) => {
    if (!previousPrice) return null;
    
    const diff = currentPrice - previousPrice;
    const percentChange = ((diff / previousPrice) * 100).toFixed(1);
    
    if (diff < 0) {
      return {
        icon: <TrendingDown className={cn(
          effectiveSize === 'compact' ? 'h-2.5 w-2.5' : 'h-3 w-3'
        )} />,
        color: "text-green-500 bg-green-500/10",
        label: `${percentChange}%`
      };
    } else if (diff > 0) {
      return {
        icon: <TrendingUp className={cn(
          effectiveSize === 'compact' ? 'h-2.5 w-2.5' : 'h-3 w-3'
        )} />,
        color: "text-red-500 bg-red-500/10",
        label: `+${percentChange}%`
      };
    }
    return {
      icon: <Minus className={cn(
        effectiveSize === 'compact' ? 'h-2.5 w-2.5' : 'h-3 w-3'
      )} />,
      color: "text-muted-foreground bg-muted",
      label: "0%"
    };
  };

  // Size-based styling configurations
  const sizeConfig = {
    compact: {
      headerPadding: 'p-2',
      iconSize: 'h-3 w-3',
      iconContainer: 'p-1 rounded-lg',
      titleSize: 'text-[10px] font-medium',
      subtitleSize: 'text-[8px]',
      closeButtonSize: 'h-6 w-6',
      listPadding: 'p-2',
      listGap: 'space-y-1',
      entryPadding: 'p-1.5',
      entryRadius: 'rounded-lg',
      dateTextSize: 'text-[9px]',
      priceTextSize: 'text-[11px]',
      currencySize: 'text-[9px]',
      badgeSize: 'text-[8px] px-1 py-0.5',
      calendarSize: 'h-2 w-2',
      footerPadding: 'p-1.5',
      footerTextSize: 'text-[8px]',
      headerHeight: '50px',
    },
    medium: {
      headerPadding: 'p-3',
      iconSize: 'h-4 w-4',
      iconContainer: 'p-1.5 rounded-xl',
      titleSize: 'text-xs font-semibold',
      subtitleSize: 'text-[10px]',
      closeButtonSize: 'h-7 w-7',
      listPadding: 'p-2.5',
      listGap: 'space-y-1.5',
      entryPadding: 'p-2',
      entryRadius: 'rounded-xl',
      dateTextSize: 'text-[10px]',
      priceTextSize: 'text-sm',
      currencySize: 'text-[10px]',
      badgeSize: 'text-[9px] px-1.5 py-0.5',
      calendarSize: 'h-2.5 w-2.5',
      footerPadding: 'p-2',
      footerTextSize: 'text-[9px]',
      headerHeight: '60px',
    },
    large: {
      headerPadding: 'p-4',
      iconSize: 'h-5 w-5',
      iconContainer: 'p-2 rounded-xl',
      titleSize: 'text-sm font-semibold',
      subtitleSize: 'text-xs',
      closeButtonSize: 'h-8 w-8',
      listPadding: 'p-3',
      listGap: 'space-y-2',
      entryPadding: 'p-3',
      entryRadius: 'rounded-xl',
      dateTextSize: 'text-xs',
      priceTextSize: 'text-base',
      currencySize: 'text-sm',
      badgeSize: 'text-[10px] px-2 py-1',
      calendarSize: 'h-3 w-3',
      footerPadding: 'p-2.5',
      footerTextSize: 'text-[10px]',
      headerHeight: '70px',
    }
  };

  const config = sizeConfig[effectiveSize];

  // Mini price chart visualization for compact view
  const renderMiniChart = () => {
    if (sortedHistory.length < 2) return null;
    
    const recentPrices = sortedHistory.slice(0, Math.min(7, sortedHistory.length)).reverse();
    const range = maxPrice - minPrice || 1;
    
    return (
      <div className="flex items-end gap-0.5 h-6">
        {recentPrices.map((entry, i) => {
          const height = ((entry.price - minPrice) / range) * 100;
          const isLatest = i === recentPrices.length - 1;
          return (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-t-sm transition-all duration-200",
                isLatest ? "bg-primary" : "bg-primary/30"
              )}
              style={{ height: `${Math.max(15, height)}%` }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 z-10 overflow-hidden flex flex-col",
        "bg-gradient-to-br from-card via-card to-card/95",
        "border border-primary/20 shadow-xl",
        "animate-in fade-in duration-300",
        effectiveSize === 'compact' ? 'rounded-xl' : 'rounded-2xl',
        className
      )}
    >
      {/* Header - Responsive */}
      <div className={cn(
        "relative flex-shrink-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50",
        config.headerPadding
      )}>
        <div className={cn(
          "flex items-center justify-between gap-2",
          isArabic && "flex-row-reverse"
        )}>
          <div className={cn(
            "flex items-center gap-2 flex-1 min-w-0",
            isArabic && "flex-row-reverse"
          )}>
            <div className={cn(
              "bg-primary/10 border border-primary/20 flex-shrink-0",
              config.iconContainer
            )}>
              <History className={cn("text-primary", config.iconSize)} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={cn(config.titleSize, "truncate")}>
                {isArabic ? 'سجل الأسعار' : 'Price History'}
              </h3>
              {effectiveSize !== 'compact' && (
                <p className={cn(
                  "text-muted-foreground truncate",
                  config.subtitleSize
                )}>
                  {productTitle}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onFlip}
            className={cn(
              "p-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0",
              config.closeButtonSize
            )}
          >
            <X className={config.iconSize} />
          </Button>
        </div>

        {/* Mini Stats Bar for compact view */}
        {effectiveSize === 'compact' && prices.length > 0 && (
          <div className={cn(
            "flex items-center gap-2 mt-1.5 text-[8px]",
            isArabic && "flex-row-reverse"
          )}>
            <div className="flex items-center gap-1 text-green-500">
              <TrendingDown className="h-2 w-2" />
              <span>{currency}{convertPriceToDisplay(minPrice, originalCurrency).toFixed(0)}</span>
            </div>
            <div className="flex-1">
              {renderMiniChart()}
            </div>
            <div className="flex items-center gap-1 text-red-500">
              <TrendingUp className="h-2 w-2" />
              <span>{currency}{convertPriceToDisplay(maxPrice, originalCurrency).toFixed(0)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Price History List */}
      <ScrollArea className="flex-1 min-h-0">
        {isLoading ? (
          <div className={cn(
            "flex flex-col items-center justify-center h-full text-center",
            effectiveSize === 'compact' ? 'p-3' : 'p-6'
          )}>
            <Loader2 className={cn(
              "text-primary animate-spin mb-2",
              effectiveSize === 'compact' ? 'h-5 w-5' : 'h-8 w-8'
            )} />
            <p className={cn("text-muted-foreground", config.dateTextSize)}>
              {isArabic ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        ) : sortedHistory.length === 0 ? (
          <div className={cn(
            "flex flex-col items-center justify-center h-full text-center",
            effectiveSize === 'compact' ? 'p-3' : 'p-6'
          )}>
            <div className={cn(
              "rounded-full bg-muted/50 mb-2",
              effectiveSize === 'compact' ? 'p-2' : 'p-4'
            )}>
              <BarChart3 className={cn(
                "text-muted-foreground/50",
                effectiveSize === 'compact' ? 'h-4 w-4' : 'h-8 w-8'
              )} />
            </div>
            <p className={cn("text-muted-foreground", config.dateTextSize)}>
              {isArabic ? 'لا يوجد سجل' : 'No history'}
            </p>
          </div>
        ) : (
          <div className={cn(config.listPadding, config.listGap)}>
            {sortedHistory.map((entry, index) => {
              const displayPrice = convertPriceToDisplay(entry.price, originalCurrency);
              const previousEntry = sortedHistory[index + 1];
              const priceChange = previousEntry 
                ? getPriceChangeIndicator(entry.price, previousEntry.price) 
                : null;
              const isFirst = index === 0;

              return (
                <div
                  key={`${entry.scraped_at}-${index}`}
                  className={cn(
                    "group border transition-all duration-200",
                    "bg-muted/30 border-border/50 hover:border-primary/30 hover:bg-muted/50",
                    isFirst && "bg-primary/5 border-primary/20",
                    config.entryPadding,
                    config.entryRadius
                  )}
                  style={{ 
                    animationDelay: `${index * 30}ms`,
                    animation: 'fadeInUp 0.2s ease-out forwards'
                  }}
                >
                  {/* Compact layout - vertical stack */}
                  {effectiveSize === 'compact' ? (
                    <div className="flex flex-col gap-1">
                      {/* Date Row */}
                      <div className={cn(
                        "flex items-center justify-between gap-1",
                        isArabic && "flex-row-reverse"
                      )}>
                        <div className={cn(
                          "flex items-center gap-1 text-muted-foreground",
                          isArabic && "flex-row-reverse"
                        )}>
                          <Calendar className={config.calendarSize} />
                          <span className={config.dateTextSize}>
                            {getFormattedDate(entry.scraped_at, true)}
                          </span>
                        </div>
                        {isFirst && (
                          <div className="flex items-center gap-0.5 text-[7px] text-primary font-medium">
                            <DollarSign className="h-2 w-2" />
                          </div>
                        )}
                      </div>
                      {/* Price Row */}
                      <div className={cn(
                        "flex items-center justify-between gap-1",
                        isArabic && "flex-row-reverse"
                      )}>
                        <div className={cn(
                          "flex items-center gap-0.5 font-bold",
                          isFirst ? "text-primary" : "text-foreground"
                        )}>
                          <span className={config.currencySize}>{currency}</span>
                          <span className={cn(config.priceTextSize, "tabular-nums")}>
                            {displayPrice.toFixed(2)}
                          </span>
                        </div>
                        {priceChange && (
                          <div className={cn(
                            "flex items-center gap-0.5 rounded-full font-medium",
                            config.badgeSize,
                            priceChange.color
                          )}>
                            {priceChange.icon}
                            <span>{priceChange.label}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Medium/Large layout - horizontal with better spacing */
                    <div className={cn(
                      "flex items-center gap-2",
                      isArabic && "flex-row-reverse"
                    )}>
                      {/* Date & Time */}
                      <div className={cn("flex-1 min-w-0", isArabic && "text-right")}>
                        <div className={cn(
                          "flex items-center gap-1 text-muted-foreground",
                          isArabic && "flex-row-reverse",
                          config.dateTextSize
                        )}>
                          <Calendar className={config.calendarSize} />
                          <span className="truncate">
                            {getRelativeTime(entry.scraped_at)}
                          </span>
                        </div>
                        {effectiveSize === 'large' && (
                          <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                            {getFormattedDate(entry.scraped_at)}
                          </p>
                        )}
                      </div>

                      {/* Price Change Badge */}
                      {priceChange && (
                        <div className={cn(
                          "flex items-center gap-0.5 rounded-full font-medium flex-shrink-0",
                          config.badgeSize,
                          priceChange.color
                        )}>
                          {priceChange.icon}
                          <span>{priceChange.label}</span>
                        </div>
                      )}

                      {/* Price */}
                      <div className={cn(
                        "flex items-center gap-0.5 font-bold flex-shrink-0",
                        isFirst ? "text-primary" : "text-foreground"
                      )}>
                        <span className={config.currencySize}>{currency}</span>
                        <span className={cn(config.priceTextSize, "tabular-nums")}>
                          {displayPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Current price indicator for non-compact */}
                  {isFirst && effectiveSize !== 'compact' && (
                    <div className={cn(
                      "mt-1.5 pt-1.5 border-t border-primary/20",
                      "flex items-center gap-1 text-primary font-medium",
                      isArabic && "flex-row-reverse",
                      effectiveSize === 'medium' ? 'text-[9px]' : 'text-[10px]'
                    )}>
                      <DollarSign className={config.calendarSize} />
                      <span>{isArabic ? 'السعر الحالي' : 'Current'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer with count */}
      <div className={cn(
        "flex-shrink-0 bg-gradient-to-t from-card via-card/80 to-transparent border-t border-border/30",
        config.footerPadding
      )}>
        <p className={cn("text-center text-muted-foreground", config.footerTextSize)}>
          {isArabic 
            ? `${sortedHistory.length} تحديث` 
            : `${sortedHistory.length} update${sortedHistory.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(6px);
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
