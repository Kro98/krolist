import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
    { store: "Amazon", products: 12, avgSavings: 15.2, reliability: 95 },
    { store: "Best Buy", products: 8, avgSavings: 12.8, reliability: 89 },
    { store: "Apple Store", products: 4, avgSavings: 8.5, reliability: 98 },
    { store: "Walmart", products: 6, avgSavings: 18.3, reliability: 82 }
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

// Compact Analytics Cards for Mobile
const CompactAnalyticsCard = ({ title, value, change, icon: Icon, color }: any) => (
  <div className="bg-gradient-card rounded-lg p-3 border">
    <div className="flex items-center justify-between mb-2">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="text-xs text-muted-foreground">{title}</span>
    </div>
    <div className="text-lg font-bold">{value}</div>
    {change && (
      <div className="text-xs text-price-decrease">{change}</div>
    )}
  </div>
);

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

  // Mobile view with window pattern
  return (
    <div className="space-y-4">
      {/* Quick Stats Grid - Mobile */}
      <div className="grid grid-cols-2 gap-3">
        {quickStats.map((stat, index) => (
          <CompactAnalyticsCard key={index} {...stat} />
        ))}
      </div>

      {/* Analytics Sections - Mobile Window Pattern */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold mb-3">Detailed Analytics</h3>
        {sections.map((section) => (
          <Sheet key={section.id}>
            <SheetTrigger asChild>
              <Card className="shadow-card hover:shadow-hover transition-all duration-200 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <section.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{section.title}</h4>
                        <p className="text-xs text-muted-foreground">{section.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  {/* Mini Preview Chart */}
                  <div className="h-12">
                    <MiniChart 
                      data={section.data} 
                      type={section.id === "stores" || section.id === "categories" ? "progress" : "bar"} 
                    />
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
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{store.store}</h4>
                          <Badge variant="secondary">{store.products} products</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">Avg Savings:</span>
                            <span className="ml-2 font-medium text-price-decrease">
                              {store.avgSavings}%
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Reliability:</span>
                            <span className="ml-2 font-medium">{store.reliability}%</span>
                          </div>
                        </div>
                        <Progress value={store.reliability} className="h-2" />
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
  );
}
