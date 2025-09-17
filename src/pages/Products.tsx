import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/ProductCard";
import { Package, Plus, TrendingDown, TrendingUp, Eye, Search, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";
import Analytics from "./Analytics";

const mockProducts = [
  {
    id: "1",
    title: "iPhone 15 Pro",
    price: 899,
    previousPrice: 999,
    currency: "$",
    imageUrl: "https://images.unsplash.com/photo-1696446702061-95bd7bbe7449?w=300&h=300&fit=crop",
    url: "https://apple.com/iphone",
    store: "Amazon",
    category: "Electronics",
    lastUpdated: "2 hours ago",
    priceHistory: [
      { date: "2024-01-01", price: 999 },
      { date: "2024-01-02", price: 949 },
      { date: "2024-01-03", price: 925 },
      { date: "2024-01-04", price: 899 }
    ]
  },
  {
    id: "2",
    title: "Sony WH-1000XM5",
    price: 349,
    previousPrice: 349,
    currency: "$",
    imageUrl: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=300&h=300&fit=crop",
    url: "https://www.sony.com/wh-1000xm5",
    store: "Best Buy",
    category: "Electronics",
    lastUpdated: "1 day ago",
    priceHistory: [
      { date: "2024-01-01", price: 349 },
      { date: "2024-01-02", price: 349 },
      { date: "2024-01-03", price: 349 },
      { date: "2024-01-04", price: 349 }
    ]
  },
  {
    id: "3", 
    title: "MacBook Air M3",
    price: 1199,
    previousPrice: 1299,
    currency: "$",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop",
    url: "https://apple.com/macbook-air-m3",
    store: "Apple Store",
    category: "Electronics", 
    lastUpdated: "5 hours ago",
    priceHistory: [
      { date: "2024-01-01", price: 1299 },
      { date: "2024-01-02", price: 1249 },
      { date: "2024-01-03", price: 1225 },
      { date: "2024-01-04", price: 1199 }
    ]
  }
];

const stats = [
  {
    title: "dashboard.totalProducts",
    value: "24",
    change: "+3",
    icon: Package,
    color: "text-primary"
  },
  {
    title: "dashboard.priceDrops",
    value: "8", 
    change: "+2",
    icon: TrendingDown,
    color: "text-price-decrease"
  },
  {
    title: "dashboard.priceIncreases",
    value: "3",
    change: "+1", 
    icon: TrendingUp,
    color: "text-price-increase"
  },
  {
    title: "dashboard.watching",
    value: "156",
    change: "+12",
    icon: Eye,
    color: "text-muted-foreground"
  },
];

const recentAlerts = [
  {
    product: "iPhone 15 Pro",
    store: "Amazon",
    oldPrice: 999,
    newPrice: 899,
    currency: "$",
    type: "decrease"
  },
  {
    product: "Sony WH-1000XM5",
    store: "Best Buy",
    oldPrice: 349,
    newPrice: 379,
    currency: "$",
    type: "increase"
  },
  {
    product: "MacBook Air M3",
    store: "Apple Store",
    oldPrice: 1299,
    newPrice: 1199,
    currency: "$",
    type: "decrease"
  },
];

export default function Products() {
  const { t } = useLanguage();
  const [showBanner, setShowBanner] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("products");

  // Filter products based on search query
  const filteredProducts = mockProducts.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mini price graph component
  const MiniGraph = ({ alert }: { alert: typeof recentAlerts[0] }) => {
    const change = alert.newPrice - alert.oldPrice;
    const points = [
      { x: 0, y: alert.oldPrice },
      { x: 20, y: alert.oldPrice + (change * 0.3) },
      { x: 40, y: alert.oldPrice + (change * 0.7) },
      { x: 60, y: alert.newPrice }
    ];
    
    const minPrice = Math.min(alert.oldPrice, alert.newPrice);
    const maxPrice = Math.max(alert.oldPrice, alert.newPrice);
    const range = maxPrice - minPrice || 1;
    
    const normalizedPoints = points.map(p => ({
      x: p.x,
      y: 20 - ((p.y - minPrice) / range) * 16
    }));
    
    const pathD = `M ${normalizedPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`;
    
    return (
      <div className="w-16 h-5 mx-3 flex items-center">
        <svg width="60" height="20" className="overflow-visible">
          <path
            d={pathD}
            fill="none"
            stroke={alert.type === 'decrease' ? 'hsl(var(--price-decrease))' : 'hsl(var(--price-increase))'}
            strokeWidth="1.5"
            className="drop-shadow-sm"
          />
          <circle
            cx={normalizedPoints[normalizedPoints.length - 1].x}
            cy={normalizedPoints[normalizedPoints.length - 1].y}
            r="2"
            fill={alert.type === 'decrease' ? 'hsl(var(--price-decrease))' : 'hsl(var(--price-increase))'}
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto md:mx-0">
            <TabsTrigger value="products" className="text-xs md:text-sm">
              {t('nav.products')}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs md:text-sm">
              {t('nav.analytics')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4 md:space-y-6 mt-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('products.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>

            {/* Closeable Banner */}
            {showBanner && (
              <div className="relative overflow-hidden rounded-lg bg-gradient-primary">
                <img
                  src={heroImage}
                  alt="Price tracking dashboard"
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                />
                <div className="relative p-4 md:p-8 text-white">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBanner(false)}
                    className="absolute top-2 right-2 text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <h1 className="text-xl md:text-3xl font-bold mb-2">{t('dashboard.welcome')}</h1>
                  <p className="text-sm md:text-lg opacity-90">
                    {t('dashboard.subtitle')}
                  </p>
                </div>
              </div>
            )}

            {/* Toggleable Stats Grid */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('dashboard.overview')}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStats(!showStats)}
                className="h-8 w-8 p-0"
              >
                <Eye className={`h-4 w-4 ${showStats ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
            </div>

            {showStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                {stats.map((stat) => (
                  <Card key={stat.title} className="shadow-card hover:shadow-hover transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
                      <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                        {t(stat.title)}
                      </CardTitle>
                      <stat.icon className={`h-3 w-3 md:h-4 md:w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent className="p-3 md:p-6 pt-0">
                      <div className="text-lg md:text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-price-decrease">{stat.change}</span> from last week
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Toggleable Recent Alerts */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('dashboard.recentAlerts')}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAlerts(!showAlerts)}
                className="h-8 w-8 p-0"
              >
                <Eye className={`h-4 w-4 ${showAlerts ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
            </div>

            {showAlerts && (
              <Card className="shadow-card">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">{t('dashboard.recentAlerts')}</CardTitle>
                  <CardDescription className="text-sm">{t('dashboard.latestChanges')}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="space-y-3 md:space-y-4">
                    {recentAlerts.map((alert, index) => (
                      <div key={index} className="flex items-center p-3 md:p-4 rounded-lg bg-gradient-card border">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm md:text-base truncate">{alert.product}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {alert.store}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Embedded Mini Graph */}
                        <MiniGraph alert={alert} />
                        
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 md:gap-2 flex-col md:flex-row">
                            <span className="text-xs md:text-sm text-muted-foreground line-through">
                              {alert.currency}{alert.oldPrice}
                            </span>
                            <span className={`font-bold text-xs md:text-sm ${
                              alert.type === 'decrease' ? 'text-price-decrease' : 'text-price-increase'
                            }`}>
                              {alert.currency}{alert.newPrice}
                            </span>
                          </div>
                          <div className={`flex items-center gap-1 text-xs ${
                            alert.type === 'decrease' ? 'text-price-decrease' : 'text-price-increase'
                          }`}>
                            {alert.type === 'decrease' ? (
                              <TrendingDown className="h-3 w-3" />
                            ) : (
                              <TrendingUp className="h-3 w-3" />
                            )}
                            <span>
                              ({((Math.abs(alert.newPrice - alert.oldPrice) / alert.oldPrice) * 100).toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products List */}
            {filteredProducts.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">{t('nav.products')}</h2>
                  <span className="text-sm text-muted-foreground">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            ) : searchQuery ? (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>{t('products.noResults')}</CardTitle>
                  <CardDescription>{t('products.noResultsDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery("")}
                    className="border-border hover:bg-accent"
                  >
                    Clear Search
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>{t('products.noProducts')}</CardTitle>
                  <CardDescription>{t('products.startTracking')}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <NavLink to="/add-product">
                    <Button className="bg-gradient-primary hover:shadow-hover transition-all duration-200">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('nav.addProduct')}
                    </Button>
                  </NavLink>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <Analytics />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}