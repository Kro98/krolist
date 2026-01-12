import { TrendingDown, TrendingUp, Activity, DollarSign } from 'lucide-react';
import { PriceInsight } from '@/types/article';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/lib/currencyConversion';

interface QuickInsightBarProps {
  insight: PriceInsight;
  isSticky?: boolean;
}

export const QuickInsightBar = ({ insight, isSticky = false }: QuickInsightBarProps) => {
  const { language } = useLanguage();
  
  const volatilityLabel = {
    stable: language === 'ar' ? 'مستقر' : 'Stable',
    moderate: language === 'ar' ? 'متوسط' : 'Moderate',
    volatile: language === 'ar' ? 'متقلب' : 'Volatile',
  };
  
  const volatilityColor = {
    stable: 'text-emerald-500',
    moderate: 'text-amber-500',
    volatile: 'text-red-500',
  };
  
  return (
    <div 
      className={`
        w-full bg-card/80 backdrop-blur-lg border-b border-border/50
        ${isSticky ? 'sticky top-0 z-40 shadow-lg' : ''}
      `}
    >
      <div className="container max-w-4xl mx-auto px-4 py-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Price Range */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-muted">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? 'النطاق السعري' : 'Price Range'}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {formatPrice(insight.typical_low, insight.currency as any)} - {formatPrice(insight.typical_high, insight.currency as any)}
              </p>
            </div>
          </div>
          
          {/* Lowest Recorded */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <TrendingDown className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? 'أدنى سعر مسجل' : 'Lowest Recorded'}
              </p>
              <p className="text-sm font-semibold text-emerald-500">
                {formatPrice(insight.lowest_recorded, insight.currency as any)}
              </p>
            </div>
          </div>
          
          {/* Current Lowest */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? 'أدنى سعر حالي' : 'Current Lowest'}
              </p>
              <p className="text-sm font-semibold text-primary">
                {formatPrice(insight.current_lowest, insight.currency as any)}
              </p>
            </div>
          </div>
          
          {/* Volatility */}
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${insight.volatility === 'stable' ? 'bg-emerald-500/10' : insight.volatility === 'moderate' ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
              <Activity className={`w-4 h-4 ${volatilityColor[insight.volatility]}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? 'تقلب الأسعار' : 'Volatility'}
              </p>
              <p className={`text-sm font-semibold ${volatilityColor[insight.volatility]}`}>
                {volatilityLabel[insight.volatility]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
