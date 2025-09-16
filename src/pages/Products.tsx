import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Plus, Package } from "lucide-react";
import { Link } from "react-router-dom";

// Sample data
const sampleProducts = [
  {
    id: "1",
    title: "Apple iPhone 15 Pro Max 256GB Natural Titanium",
    price: 1199.99,
    previousPrice: 1299.99,
    currency: "$",
    imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&h=300&fit=crop",
    url: "https://apple.com/iphone-15-pro",
    store: "Apple Store",
    category: "Electronics",
    lastUpdated: "2 hours ago",
    priceHistory: [
      { date: "2024-01-01", price: 1299.99 },
      { date: "2024-01-02", price: 1289.99 },
      { date: "2024-01-03", price: 1279.99 },
      { date: "2024-01-04", price: 1249.99 },
      { date: "2024-01-05", price: 1229.99 },
      { date: "2024-01-06", price: 1209.99 },
      { date: "2024-01-07", price: 1199.99 },
    ]
  },
  {
    id: "2",
    title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
    price: 349.99,
    previousPrice: 329.99,
    currency: "$",
    imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop",
    url: "https://sony.com/headphones",
    store: "Best Buy",
    category: "Audio",
    lastUpdated: "1 hour ago",
    priceHistory: [
      { date: "2024-01-01", price: 329.99 },
      { date: "2024-01-02", price: 334.99 },
      { date: "2024-01-03", price: 339.99 },
      { date: "2024-01-04", price: 344.99 },
      { date: "2024-01-05", price: 349.99 },
      { date: "2024-01-06", price: 349.99 },
      { date: "2024-01-07", price: 349.99 },
    ]
  },
  {
    id: "3",
    title: "MacBook Air 13-inch with M3 chip - 8GB RAM, 256GB SSD",
    price: 1099.99,
    previousPrice: 1199.99,
    currency: "$",
    imageUrl: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=300&h=300&fit=crop",
    url: "https://apple.com/macbook-air",
    store: "Amazon",
    category: "Computers",
    lastUpdated: "30 minutes ago",
    priceHistory: [
      { date: "2024-01-01", price: 1199.99 },
      { date: "2024-01-02", price: 1189.99 },
      { date: "2024-01-03", price: 1179.99 },
      { date: "2024-01-04", price: 1149.99 },
      { date: "2024-01-05", price: 1129.99 },
      { date: "2024-01-06", price: 1109.99 },
      { date: "2024-01-07", price: 1099.99 },
    ]
  },
];

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterBy, setFilterBy] = useState("all");

  const filteredProducts = sampleProducts.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.store.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterBy === "all") return matchesSearch;
    if (filterBy === "price-drop") return matchesSearch && product.price < product.previousPrice;
    if (filterBy === "price-increase") return matchesSearch && product.price > product.previousPrice;
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your Products</h1>
          <p className="text-muted-foreground">Track and manage your product watchlist</p>
        </div>
        <Link to="/add-product">
          <Button className="bg-gradient-primary hover:shadow-hover transition-all duration-200">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products, stores, or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="price-drop">Price Drops</SelectItem>
              <SelectItem value="price-increase">Price Increases</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid gap-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Start by adding your first product to track"}
            </p>
            <Link to="/add-product">
              <Button>Add Your First Product</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}