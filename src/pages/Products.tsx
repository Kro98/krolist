import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { Package, Plus, TrendingDown, TrendingUp, Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";

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

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-primary">
        <img
          src={heroImage}
          alt="Price tracking dashboard"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">{t('dashboard.welcome')}</h1>
          <p className="text-lg opacity-90">
            {t('dashboard.subtitle')}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-card hover:shadow-hover transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t(stat.title)}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-price-decrease">{stat.change}</span> from last week
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Alerts */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>{t('dashboard.recentAlerts')}</CardTitle>
          <CardDescription>{t('dashboard.latestChanges')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAlerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border">
                <div className="flex-1">
                  <h4 className="font-medium">{alert.product}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {alert.store}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground line-through">
                      {alert.currency}{alert.oldPrice}
                    </span>
                    <span className={`font-bold ${
                      alert.type === 'decrease' ? 'text-price-decrease' : 'text-price-increase'
                    }`}>
                      {alert.currency}{alert.newPrice}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    alert.type === 'decrease' ? 'text-price-decrease' : 'text-price-increase'
                  }`}>
                    {alert.type === 'decrease' ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )}
                    <span>
                      {alert.currency}{Math.abs(alert.newPrice - alert.oldPrice)} 
                      ({((Math.abs(alert.newPrice - alert.oldPrice) / alert.oldPrice) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      {mockProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
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
    </div>
  );
}