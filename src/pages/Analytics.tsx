import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingDown, 
  TrendingUp, 
  Package, 
  Eye, 
  DollarSign, 
  Calendar,
  Store,
  Tag,
  Target,
  Clock
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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

export default function Analytics() {
  const { t, getCurrencySymbol } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('nav.analytics')}</h1>
        <p className="text-muted-foreground">Deep insights into your price tracking performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Savings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-price-decrease" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-price-decrease">
              {getCurrencySymbol()}{analyticsData.overview.totalSavings}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-price-decrease">+{getCurrencySymbol()}245</span> this month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Savings/Product
            </CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getCurrencySymbol()}{analyticsData.overview.avgSavingsPerProduct}
            </div>
            <p className="text-xs text-muted-foreground">
              Per tracked product
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Best Deal
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-price-decrease" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-price-decrease">
              {analyticsData.overview.bestDeal.percentage}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.overview.bestDeal.product}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tracking Efficiency
            </CardTitle>
            <Eye className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {analyticsData.overview.trackingEfficiency}%
            </div>
            <p className="text-xs text-muted-foreground">
              Successful captures
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
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

        <TabsContent value="stores" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                Store Performance
              </CardTitle>
              <CardDescription>
                Compare how different stores perform in terms of savings and reliability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analyticsData.storePerformance.map((store, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{store.store}</h4>
                    <Badge variant="secondary">{store.products} products</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
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
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Category Analysis
              </CardTitle>
              <CardDescription>
                Breakdown of your tracked products by category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analyticsData.categoryAnalysis.map((category, index) => (
                <div key={index} className="p-4 border rounded-lg">
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
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Price Drop Patterns
              </CardTitle>
              <CardDescription>
                Identify when and how often price drops occur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analyticsData.pricePatterns.map((pattern, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{pattern.pattern}</h4>
                    <Badge variant="secondary">{pattern.frequency}% frequency</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Average savings when this occurs:</span>
                    <span className="font-medium text-price-decrease">
                      {pattern.avgSavings}%
                    </span>
                  </div>
                  <Progress value={pattern.frequency} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}