import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  Target,
  Eye, 
  Store,
  Tag,
  Clock,
  BarChart3,
  Maximize2,
  ChevronRight
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";

const analyticsData = {
  overview: {
    totalSavings: 2847,
    avgSavingsPerProduct: 119,
    bestDeal: {
      product: "iPhone 15 Pro",
      savings: 200,
      percentage: 20
    },
    trackingEfficiency: 87
  },
  priceChanges: [
    { period: "Last 7 days", increases: 5, decreases: 12, stable: 7 },
    { period: "Last 30 days", increases: 18, decreases: 42, stable: 15 },
    { period: "Last 90 days", increases: 45, decreases: 89, stable: 34 }
  ],
  storePerformance: [
    { store: "SHEIN", products: 18, avgSavings: 25.4, reliability: 92 },
    { store: "NOON", products: 15, avgSavings: 18.7, reliability: 96 },
    { store: "Amazon", products: 12, avgSavings: 15.2, reliability: 95 },
    { store: "IKEA", products: 8, avgSavings: 12.3, reliability: 89 },
    { store: "ABYAT", products: 6, avgSavings: 14.8, reliability: 88 },
    { store: "NAMSHI", products: 10, avgSavings: 22.1, reliability: 91 },
    { store: "TRENDYOL", products: 14, avgSavings: 19.6, reliability: 87 },
    { store: "ASOS", products: 9, avgSavings: 16.9, reliability: 93 }
  ],
  categoryAnalysis: [
    { category: "Electronics", products: 15, avgPrice: 485, savings: 23.4 },
    { category: "Fashion", products: 8, avgPrice: 125, savings: 18.7 },
    { category: "Home & Garden", products: 5, avgPrice: 85, savings: 12.3 },
    { category: "Sports", products: 4, avgPrice: 65, savings: 15.8 }
  ],
  pricePatterns: [
    { pattern: "Weekly drops on Sunday", frequency: 67, avgSavings: 8.2 },
    { pattern: "End of month sales", frequency: 45, avgSavings: 15.5 },
    { pattern: "Holiday season drops", frequency: 89, avgSavings: 22.3 },
    { pattern: "Flash sales", frequency: 23, avgSavings: 18.7 }
  ]
};

// Get font and icon sizes from localStorage
const getFontSize = () => localStorage.getItem('fontSize') || 'medium';
const getIconSize = () => localStorage.getItem('iconSize') || 'medium';

// Size mappings
const fontSizes = {
  small: 'text-xs',
  medium: 'text-sm', 
  large: 'text-base'
};

const iconSizes = {
  small: 'h-3 w-3',
  medium: 'h-4 w-4',
  large: 'h-5 w-5'
};

// Compact Analytics Cards for Mobile
const CompactAnalyticsCard = ({ title, value, change, icon: Icon, color }: any) => {
  const [fontSize, setFontSize] = useState(getFontSize());
  const [iconSize, setIconSize] = useState(getIconSize());

  useEffect(() => {
    const handleStorageChange = () => {
      setFontSize(getFontSize());
      setIconSize(getIconSize());
    };
    
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 100);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-gradient-card rounded-lg p-2 border min-h-[70px] w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between mb-1">
        <Icon className={`${iconSizes[iconSize as keyof typeof iconSizes]} ${color} flex-shrink-0`} />
        <span className={`${fontSizes[fontSize as keyof typeof fontSizes]} text-muted-foreground text-right truncate ml-1 max-w-[60%]`}>{title}</span>
      </div>
      <div className={`${fontSize === 'small' ? 'text-sm' : fontSize === 'medium' ? 'text-base' : 'text-lg'} font-bold truncate`}>{value}</div>
      {change && (
        <div className={`${fontSizes[fontSize as keyof typeof fontSizes]} text-price-decrease truncate`}>{change}</div>
      )}
    </div>
  );
};

// Mini Chart Component for Mobile
const MiniChart = ({ data, type = "bar" }: { data: any[], type?: "bar" | "progress" }) => {
  if (type === "progress") {
    return (
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="truncate">{item.store || item.category}</span>
              <span className="text-price-decrease">{item.avgSavings || item.savings}%</span>
            </div>
            <Progress value={item.reliability || item.avgSavings || item.savings} className="h-1.5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-end justify-between h-16 gap-1">
      {data.slice(0, 4).map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div 
            className="w-full bg-primary/20 rounded-t"
            style={{ 
              height: `${Math.max((item.decreases || item.savings || 20) / 2, 8)}px` 
            }}
          >
            <div 
              className="w-full bg-primary rounded-t"
              style={{ 
                height: `${Math.max((item.decreases || item.savings || 20) / 3, 4)}px` 
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground mt-1 truncate w-full text-center">
            {item.period?.split(' ')[1] || item.pattern?.split(' ')[0] || index + 1}
          </span>
        </div>
      ))}
    </div>
  );
};

export function MobileAnalytics() {
  const { t, getCurrencySymbol } = useLanguage();
  const isMobile = useIsMobile();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const quickStats = [
    {
      title: "Savings",
      value: `${getCurrencySymbol()}${analyticsData.overview.totalSavings}`,
      change: `+${getCurrencySymbol()}245`,
      icon: DollarSign,
      color: "text-price-decrease"
    },
    {
      title: "Avg/Product",
      value: `${getCurrencySymbol()}${analyticsData.overview.avgSavingsPerProduct}`,
      icon: Target,
      color: "text-primary"
    },
    {
      title: "Best Deal",
      value: `${analyticsData.overview.bestDeal.percentage}%`,
      icon: TrendingDown,
      color: "text-price-decrease"
    },
    {
      title: "Efficiency",
      value: `${analyticsData.overview.trackingEfficiency}%`,
      icon: Eye,
      color: "text-success"
    }
  ];

  const sections = [
    {
      id: "trends",
      title: "Price Trends",
      icon: TrendingUp,
      data: analyticsData.priceChanges,
      description: "Track price movements over time"
    },
    {
      id: "stores",
      title: "Store Performance",
      icon: Store,
      data: analyticsData.storePerformance,
      description: "Compare store savings and reliability"
    },
    {
      id: "categories",
      title: "Categories",
      icon: Tag,
      data: analyticsData.categoryAnalysis,
      description: "Analyze products by category"
    },
    {
      id: "patterns",
      title: "Price Patterns",
      icon: Clock,
      data: analyticsData.pricePatterns,
      description: "Discover when prices drop most"
    }
  ];

  if (!isMobile) {
    // Desktop view - return full analytics
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('nav.analytics')}</h1>
          <p className="text-muted-foreground">Deep insights into your price tracking performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => (
            <Card key={index} className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                {stat.change && (
                  <p className="text-xs text-muted-foreground">
                    <span className="text-price-decrease">{stat.change}</span> this month
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop Analytics Tabs */}
        <Tabs defaultValue="price-trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="price-trends">Price Trends</TabsTrigger>
            <TabsTrigger value="stores">Store Analysis</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
          </TabsList>

          <TabsContent value="price-trends" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Price Movement Analysis
                </CardTitle>
                <CardDescription>
                  Track how prices have changed over different time periods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {analyticsData.priceChanges.map((period, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{period.period}</h4>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-price-increase">
                          <TrendingUp className="h-3 w-3" />
                          {period.increases} increases
                        </span>
                        <span className="flex items-center gap-1 text-price-decrease">
                          <TrendingDown className="h-3 w-3" />
                          {period.decreases} decreases
                        </span>
                        <span className="text-muted-foreground">
                          {period.stable} stable
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-price-increase/20 h-2 rounded-full">
                        <div 
                          className="bg-price-increase h-full rounded-full"
                          style={{ 
                            width: `${(period.increases / (period.increases + period.decreases + period.stable)) * 100}%` 
                          }}
                        />
                      </div>
                      <div className="bg-price-decrease/20 h-2 rounded-full">
                        <div 
                          className="bg-price-decrease h-full rounded-full"
                          style={{ 
                            width: `${(period.decreases / (period.increases + period.decreases + period.stable)) * 100}%` 
                          }}
                        />
                      </div>
                      <div className="bg-muted h-2 rounded-full">
                        <div 
                          className="bg-muted-foreground h-full rounded-full"
                          style={{ 
                            width: `${(period.stable / (period.increases + period.decreases + period.stable)) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs content omitted for brevity */}
        </Tabs>
      </div>
    );
  }

  // Mobile view with card swiping pattern
  return (
    <div className="space-y-4">
      {/* Quick Stats Carousel - Mobile */}
      <div className="px-1">
        <Carousel className="w-full max-w-full">
          <CarouselContent className="-ml-2">
            {quickStats.map((stat, index) => (
              <CarouselItem key={index} className="pl-2 basis-1/2">
                <CompactAnalyticsCard {...stat} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-1 h-6 w-6" />
          <CarouselNext className="right-1 h-6 w-6" />
        </Carousel>
      </div>

      {/* Analytics Sections - Mobile */}
      <div className="space-y-3 px-1">
        <h3 className="text-lg font-semibold mb-3">{t('dashboard.overview')}</h3>
        
        <div className="grid grid-cols-2 gap-2">
          {sections.map((section) => (
            <Sheet key={section.id}>
              <SheetTrigger asChild>
                <Card className="shadow-card hover:shadow-hover transition-all duration-200 cursor-pointer h-full bg-gradient-card">
                  <CardContent className="p-3">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="p-2 rounded-full bg-primary/10">
                        <section.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-xs leading-tight">{t(`analytics.${section.id}`)}</h4>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-1">{t(`analytics.${section.id}Desc`)}</p>
                      </div>
                      
                      {/* Compact Chart */}
                      <div className="h-6 w-full">
                        <MiniChart 
                          data={section.data} 
                          type={section.id === "stores" || section.id === "categories" ? "progress" : "bar"} 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </SheetTrigger>
            
            <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <section.icon className="h-5 w-5 text-primary" />
                  {section.title}
                </SheetTitle>
                <SheetDescription>{section.description}</SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-4 overflow-y-auto h-full pb-6">
                {section.id === "trends" && (
                  <div className="space-y-4">
                    {analyticsData.priceChanges.map((period, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <h4 className="font-medium">{period.period}</h4>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="p-2 rounded bg-price-increase/10">
                              <div className="text-price-increase font-bold">{period.increases}</div>
                              <div className="text-xs text-muted-foreground">Increases</div>
                            </div>
                            <div className="p-2 rounded bg-price-decrease/10">
                              <div className="text-price-decrease font-bold">{period.decreases}</div>
                              <div className="text-xs text-muted-foreground">Decreases</div>
                            </div>
                            <div className="p-2 rounded bg-muted/20">
                              <div className="font-bold">{period.stable}</div>
                              <div className="text-xs text-muted-foreground">Stable</div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                
                 {section.id === "stores" && (
                   <div className="space-y-3">
                     {analyticsData.storePerformance.map((store, index) => (
                       <Card key={index} className="p-3">
                         <div className="space-y-3">
                           <div className="flex items-center justify-between">
                             <h4 className="font-medium text-sm">{store.store}</h4>
                             <Badge variant="secondary" className="text-xs">{store.products} products</Badge>
                           </div>
                           <div className="grid grid-cols-2 gap-3 text-sm">
                             <div className="space-y-1">
                               <span className="text-muted-foreground text-xs">{t('analytics.avgSavings')}:</span>
                               <div className="font-medium text-price-decrease text-sm">
                                 {store.avgSavings}%
                               </div>
                             </div>
                             <div className="space-y-1">
                               <span className="text-muted-foreground text-xs">{t('analytics.reliability')}:</span>
                               <div className="font-medium text-sm">{store.reliability}%</div>
                             </div>
                           </div>
                           <div className="space-y-1">
                             <div className="flex justify-between text-xs">
                               <span>{t('analytics.reliability')}</span>
                               <span>{store.reliability}%</span>
                             </div>
                             <Progress value={store.reliability} className="h-1.5" />
                           </div>
                         </div>
                       </Card>
                     ))}
                   </div>
                 )}
                
                {section.id === "categories" && (
                  <div className="space-y-3">
                    {analyticsData.categoryAnalysis.map((category, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{category.category}</h4>
                          <Badge variant="outline">{category.products} products</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Avg Price:</span>
                            <span className="ml-2 font-medium">
                              {getCurrencySymbol()}{category.avgPrice}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Avg Savings:</span>
                            <span className="ml-2 font-medium text-price-decrease">
                              {category.savings}%
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                
                {section.id === "patterns" && (
                  <div className="space-y-3">
                    {analyticsData.pricePatterns.map((pattern, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{pattern.pattern}</h4>
                            <Badge variant="secondary">{pattern.frequency}% frequency</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Average savings:</span>
                            <span className="font-medium text-price-decrease">
                              {pattern.avgSavings}%
                            </span>
                          </div>
                          <Progress value={pattern.frequency} className="h-2" />
                        </div>
                      </Card>
                    ))}
                  </div>
                 )}
               </div>
             </SheetContent>
            </Sheet>
          ))}
        </div>
      </div>
    </div>
  );
}
