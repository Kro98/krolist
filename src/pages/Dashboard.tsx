import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Package, Eye } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const stats = [
  {
    title: "Total Products",
    value: "24",
    change: "+3",
    icon: Package,
    color: "text-primary"
  },
  {
    title: "Price Drops",
    value: "8",
    change: "+2",
    icon: TrendingDown,
    color: "text-price-decrease"
  },
  {
    title: "Price Increases",
    value: "3",
    change: "+1",
    icon: TrendingUp,
    color: "text-price-increase"
  },
  {
    title: "Watching",
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

export default function Dashboard() {
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
          <h1 className="text-3xl font-bold mb-2">Welcome to PriceTracker</h1>
          <p className="text-lg opacity-90">
            Track your favorite products and never miss a deal again
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-card hover:shadow-hover transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
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
          <CardTitle>Recent Price Alerts</CardTitle>
          <CardDescription>Latest price changes on your tracked products</CardDescription>
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
    </div>
  );
}