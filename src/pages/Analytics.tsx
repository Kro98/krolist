import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, TrendingUp, Package, Eye, DollarSign, EyeOff } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
const stats = [{
  title: "dashboard.totalProducts",
  value: "23",
  icon: Package,
  color: "text-primary"
}, {
  title: "dashboard.priceDrops",
  value: "7",
  icon: TrendingDown,
  color: "text-price-decrease"
}, {
  title: "dashboard.priceIncreases",
  value: "3",
  icon: TrendingUp,
  color: "text-price-increase"
}, {
  title: "dashboard.totalAmount",
  value: "1,572$",
  icon: DollarSign,
  color: "text-muted-foreground"
}];
const recentAlerts = [{
  product: "iPhone 15 Pro",
  store: "Amazon",
  oldPrice: 999,
  newPrice: 899,
  currency: "$",
  type: "decrease"
}, {
  product: "Sony WH-1000XM5",
  store: "Best Buy",
  oldPrice: 349,
  newPrice: 379,
  currency: "$",
  type: "increase"
}, {
  product: "MacBook Air M3",
  store: "Apple Store",
  oldPrice: 1299,
  newPrice: 1199,
  currency: "$",
  type: "decrease"
}];
export default function Analytics() {
  const {
    t
  } = useLanguage();
  const [showStats, setShowStats] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);

  // Mini price graph component
  const MiniGraph = ({
    alert
  }: {
    alert: typeof recentAlerts[0];
  }) => {
    const change = alert.newPrice - alert.oldPrice;
    const points = [{
      x: 0,
      y: alert.oldPrice
    }, {
      x: 20,
      y: alert.oldPrice + change * 0.3
    }, {
      x: 40,
      y: alert.oldPrice + change * 0.7
    }, {
      x: 60,
      y: alert.newPrice
    }];
    const minPrice = Math.min(alert.oldPrice, alert.newPrice);
    const maxPrice = Math.max(alert.oldPrice, alert.newPrice);
    const range = maxPrice - minPrice || 1;
    const normalizedPoints = points.map(p => ({
      x: p.x,
      y: 20 - (p.y - minPrice) / range * 16
    }));
    const pathD = `M ${normalizedPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`;
    return <div className="w-16 h-5 mx-3 flex items-center">
        <svg width="60" height="20" className="overflow-visible">
          <path d={pathD} fill="none" stroke={alert.type === 'decrease' ? 'hsl(var(--price-decrease))' : 'hsl(var(--price-increase))'} strokeWidth="1.5" className="drop-shadow-sm" />
          <circle cx={normalizedPoints[normalizedPoints.length - 1].x} cy={normalizedPoints[normalizedPoints.length - 1].y} r="2" fill={alert.type === 'decrease' ? 'hsl(var(--price-decrease))' : 'hsl(var(--price-increase))'} />
        </svg>
      </div>;
  };
  return <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{t('nav.analytics')}</h1>
        <p className="text-muted-foreground">{t('dashboard.latestChanges')}</p>
      </div>

      {/* Recent Price Change and Overview side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Toggleable Recent Price Change */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base md:text-lg font-semibold">{t('dashboard.recentAlerts')}</h2>
            
          </div>

          {showAlerts && <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {recentAlerts.map((alert, index) => <div key={index} className="flex items-center p-3 rounded-lg bg-gradient-card border">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{alert.product}</h4>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {alert.store}
                        </Badge>
                      </div>
                      
                      <MiniGraph alert={alert} />
                      
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 flex-col">
                          <span className="text-xs text-muted-foreground line-through">
                            {alert.currency}{alert.oldPrice}
                          </span>
                          <span className={`font-bold text-sm ${alert.type === 'decrease' ? 'text-price-decrease' : 'text-price-increase'}`}>
                            {alert.currency}{alert.newPrice}
                          </span>
                        </div>
                        <div className={`flex items-center justify-end gap-1 text-xs ${alert.type === 'decrease' ? 'text-price-decrease' : 'text-price-increase'}`}>
                          {alert.type === 'decrease' ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                          <span>
                            ({(Math.abs(alert.newPrice - alert.oldPrice) / alert.oldPrice * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>)}
                </div>
              </CardContent>
            </Card>}
        </div>

        {/* Toggleable Overview Stats Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base md:text-lg font-semibold">{t('dashboard.overview')}</h2>
            
          </div>

          {showStats && <div className="grid grid-cols-2 gap-3">
              {stats.map(stat => <Card key={stat.title} className="shadow-card hover:shadow-hover transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t(stat.title)}
                      </p>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>)}
            </div>}
        </div>
      </div>
    </div>;
}