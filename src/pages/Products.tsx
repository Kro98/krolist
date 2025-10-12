import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import { Package, Plus, TrendingDown, TrendingUp, Eye, Search, EyeOff, DollarSign } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "react-router-dom";
import { mockProducts } from "@/data/mockProducts";

const stats = [
  {
    title: "dashboard.totalProducts",
    value: "23",
    icon: Package,
    color: "text-primary"
  },
  {
    title: "dashboard.priceDrops",
    value: "7", 
    icon: TrendingDown,
    color: "text-price-decrease"
  },
  {
    title: "dashboard.priceIncreases",
    value: "3",
    icon: TrendingUp,
    color: "text-price-increase"
  },
  {
    title: "dashboard.totalAmount",
    value: "1,572$",
    icon: DollarSign,
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
  const [showStats, setShowStats] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

      {/* Products List */}
      {filteredProducts.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold">{t('nav.products')}</h2>
            <span className="text-sm text-muted-foreground">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  );
}