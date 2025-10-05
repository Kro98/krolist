import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, ExternalLink, Trash2, Package } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface AmazonListing {
  id: string;
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  affiliateUrl: string;
  createdAt: number;
}

export default function Amazon() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [listings, setListings] = useState<AmazonListing[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    imageUrl: "",
    affiliateUrl: ""
  });

  useEffect(() => {
    const saved = localStorage.getItem('amazonListings');
    if (saved) {
      setListings(JSON.parse(saved));
    }
  }, []);

  const saveListings = (newListings: AmazonListing[]) => {
    localStorage.setItem('amazonListings', JSON.stringify(newListings));
    setListings(newListings);
  };

  const handleAddListing = () => {
    if (!formData.title || !formData.affiliateUrl) {
      toast({
        title: "Missing Information",
        description: "Please provide at least a title and affiliate URL",
        variant: "destructive"
      });
      return;
    }

    const newListing: AmazonListing = {
      id: Date.now().toString(),
      ...formData,
      createdAt: Date.now()
    };

    const updatedListings = [newListing, ...listings];
    saveListings(updatedListings);

    setFormData({
      title: "",
      description: "",
      price: "",
      imageUrl: "",
      affiliateUrl: ""
    });
    setShowAddForm(false);

    toast({
      title: "Listing Added",
      description: "Your Amazon listing has been added successfully"
    });
  };

  const handleDeleteListing = (id: string) => {
    const updatedListings = listings.filter(l => l.id !== id);
    saveListings(updatedListings);

    toast({
      title: "Listing Deleted",
      description: "The listing has been removed"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Amazon Affiliate Listings
          </h1>
          <p className="text-muted-foreground">Manage your Amazon affiliate product listings</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-gradient-primary hover:shadow-hover transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          {showAddForm ? "Cancel" : "Add Listing"}
        </Button>
      </div>

      {/* Add Listing Form */}
      {showAddForm && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Add New Listing</CardTitle>
            <CardDescription>Fill in the details for your Amazon affiliate product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter product title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  placeholder="e.g., $29.99"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter product description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="affiliateUrl">Amazon Affiliate URL *</Label>
              <Input
                id="affiliateUrl"
                type="url"
                placeholder="https://amazon.com/... (your affiliate link)"
                value={formData.affiliateUrl}
                onChange={(e) => setFormData({ ...formData, affiliateUrl: e.target.value })}
              />
            </div>

            <Button 
              onClick={handleAddListing}
              className="w-full bg-gradient-primary hover:shadow-hover transition-all duration-200"
            >
              Add Listing
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Listings Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start adding your Amazon affiliate products to earn commissions
            </p>
            <Button 
              onClick={() => setShowAddForm(true)}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Listing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <Card key={listing.id} className="shadow-card overflow-hidden group hover:shadow-lg transition-shadow">
              {listing.imageUrl && (
                <div className="aspect-video bg-muted relative overflow-hidden">
                  <img 
                    src={listing.imageUrl} 
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="line-clamp-2">{listing.title}</CardTitle>
                {listing.price && (
                  <CardDescription className="text-lg font-semibold text-primary">
                    {listing.price}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {listing.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {listing.description}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-gradient-primary hover:shadow-hover transition-all duration-200"
                    onClick={() => window.open(listing.affiliateUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Amazon
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteListing(listing.id)}
                    className="hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
