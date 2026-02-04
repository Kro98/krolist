import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link as LinkIcon, Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import { detectStoreFromUrl, isValidProductUrl } from "@/lib/storeDetection";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { getAllStores } from "@/config/stores";

const productSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  price: z.number().nonnegative("Price must be 0 or greater"),
  originalPrice: z.number().positive("Original price must be greater than 0"),
  currency: z.string().min(1, "Currency is required"),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  store: z.string().min(1, "Store is required"),
  productUrl: z.string().url("Invalid product URL"),
  category: z.string().optional(),
});

interface ManualProductFormProps {
  onBack: () => void;
}

export function ManualProductForm({ onBack }: ManualProductFormProps) {
  const [productUrl, setProductUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [imageUrl, setImageUrl] = useState("");
  const [store, setStore] = useState("");
  const [category, setCategory] = useState("");
  const [categoryType, setCategoryType] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [imageFit, setImageFit] = useState<"contain" | "cover">("contain");
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFetchDetails = async () => {
    if (!productUrl) {
      toast({
        title: "URL Required",
        description: "Please enter a product URL first",
        variant: "destructive",
      });
      return;
    }

    if (!isValidProductUrl(productUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid product URL",
        variant: "destructive",
      });
      return;
    }

    setIsFetching(true);
    
    try {
      // Auto-detect store and currency
      const storeInfo = detectStoreFromUrl(productUrl);
      setStore(storeInfo.name);
      setCurrency(storeInfo.currency);

      // Try to scrape product details
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to add products",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('scrape-products', {
        body: { url: productUrl, autoFill: true }
      });

      // Handle API eligibility or availability errors gracefully
      if (error || data?.success === false || data?.errorCode) {
        setHasAutoFilled(true);
        const errorMessage = data?.error || error?.message || "Auto-fill unavailable";
        
        // Check for specific error types
        if (data?.errorCode === 'API_NOT_ELIGIBLE' || errorMessage.includes('temporarily unavailable')) {
          toast({
            title: "Auto-Fill Unavailable",
            description: "Amazon API is temporarily unavailable. Please enter product details manually below.",
          });
        } else if (errorMessage.includes('429') || errorMessage.includes('limit')) {
          toast({
            title: "Daily Limit Reached",
            description: "Amazon API limit reached. Please enter product details manually.",
          });
        } else {
          toast({
            title: "Auto-Fill Unavailable",
            description: "Please enter the product details manually below.",
          });
        }
        return;
      }

      if (data?.success && data?.product) {
        const product = data.product;
        
        // Truncate title and description to 60 characters
        const truncatedTitle = product.title ? product.title.substring(0, 60) : "";
        const truncatedDesc = product.title ? product.title.substring(0, 60) : "";
        
        setTitle(truncatedTitle);
        setDescription(truncatedDesc);
        setImageUrl(product.image || "");
        
        // Set current price (discounted/displayed price)
        if (product.price && product.price > 0) {
          setPrice(product.price.toString());
        }
        
        // Set original price (greyed out/strikethrough price, or same as current if no discount)
        if (product.originalPrice && product.originalPrice > 0) {
          setOriginalPrice(product.originalPrice.toString());
        } else if (product.price && product.price > 0) {
          // If no original price, use current price as original
          setOriginalPrice(product.price.toString());
        }
        
        // Auto-set currency and store for Amazon
        setCurrency("SAR");
        setStore("Amazon");
        
        setHasAutoFilled(true);
        toast({
          title: "Details Loaded",
          description: "Product details auto-filled from Amazon. Review and save.",
        });
      } else if (data?.success && data?.results && data.results.length > 0) {
        // Fallback for search results format
        const product = data.results[0];
        
        // Check if it's a fallback result
        if (product.id === 'amazon-fallback' || product.bestPrice === 0) {
          setHasAutoFilled(true);
          toast({
            title: "Auto-Fill Unavailable",
            description: "Please enter the product details manually below.",
          });
          return;
        }
        
        setTitle(product.title || "");
        setDescription(product.description || "");
        setImageUrl(product.image || "");
        
        if (product.sellers && product.sellers.length > 0) {
          const bestPrice = product.sellers[0];
          if (bestPrice.price && bestPrice.price > 0) {
            setPrice(bestPrice.price.toString());
          }
        }
        
        setHasAutoFilled(true);
        toast({
          title: "Details Loaded",
          description: "Product details auto-filled. Review and save.",
        });
      } else {
        setHasAutoFilled(true);
        toast({
          title: "Couldn't Auto-Fill",
          description: "Please enter the product details manually",
        });
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      setHasAutoFilled(true);
      toast({
        title: "Auto-fill Failed",
        description: "Please enter the product details manually",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Determine final category
      const finalCategory = categoryType === 'Custom' ? customCategory : categoryType;
      
      // Validate form data
      const parsedOriginalPrice = parseFloat(originalPrice) || 0;
      const parsedCurrentPrice = parseFloat(price) || 0;
      
      const formData = productSchema.parse({
        title,
        description: description || undefined,
        price: parsedCurrentPrice,
        originalPrice: parsedOriginalPrice > 0 ? parsedOriginalPrice : parsedCurrentPrice,
        currency,
        imageUrl: imageUrl || undefined,
        store,
        productUrl,
        category: finalCategory || undefined,
      });

      setIsSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to add products",
          variant: "destructive",
        });
        return;
      }

      // Insert into products table
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          current_price: formData.price > 0 ? formData.price : formData.originalPrice,
          original_price: formData.originalPrice,
          original_currency: formData.currency,
          currency: formData.currency,
          image_url: formData.imageUrl,
          store: formData.store,
          product_url: formData.productUrl,
          category: formData.category,
          image_fit: imageFit,
          is_active: true,
        })
        .select()
        .single();

      if (productError) throw productError;

      // Insert into price_history table
      const { error: historyError } = await supabase
        .from('price_history')
        .insert({
          product_id: product.id,
          price: formData.price > 0 ? formData.price : formData.originalPrice,
          original_price: formData.originalPrice,
          currency: formData.currency,
        });

      if (historyError) throw historyError;

      toast({
        title: "Product Added Successfully!",
        description: "We'll start tracking this product's price for you.",
      });

      navigate('/products');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error('Error adding product:', error);
        toast({
          title: "Error",
          description: "Failed to add product. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-card">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <CardTitle className="text-center">Add Product Manually</CardTitle>
        <CardDescription className="text-center">
          {!hasAutoFilled 
            ? "Paste a product URL to auto-fill details, then review and edit" 
            : "Review and edit the product details below"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL Input with Fetch Button */}
          <div className="space-y-2">
            <Label htmlFor="productUrl" className="text-sm font-medium">
              Product URL *
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="productUrl"
                  type="url"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="pl-10"
                  placeholder="https://example.com/product"
                  required
                  disabled={hasAutoFilled}
                />
              </div>
              {!hasAutoFilled && (
                <Button
                  type="button"
                  onClick={handleFetchDetails}
                  disabled={isFetching}
                  variant="secondary"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Auto-Fill
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Product Details - Show after auto-fill or immediately if user wants manual entry */}
          {hasAutoFilled && (
            <>
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Product Title *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter product title"
                  required
                  maxLength={200}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter product description (optional)"
                  rows={3}
                  maxLength={1000}
                />
              </div>

              {/* Pricing Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium">
                      Current Price (Discounted)
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text');
                        const numbersOnly = pastedText.replace(/[^\d.]/g, '');
                        const cleanedValue = numbersOnly.replace(/(\..*)\./g, '$1');
                        setPrice(cleanedValue);
                      }}
                      placeholder="0.00 (leave empty if no discount)"
                    />
                    <p className="text-xs text-muted-foreground">The displayed/discounted price</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="originalPrice" className="text-sm font-medium">
                      Original Price *
                    </Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      step="0.01"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text');
                        const numbersOnly = pastedText.replace(/[^\d.]/g, '');
                        const cleanedValue = numbersOnly.replace(/(\..*)\./g, '$1');
                        setOriginalPrice(cleanedValue);
                      }}
                      placeholder="0.00"
                      required
                    />
                    <p className="text-xs text-muted-foreground">The strikethrough/full price</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm font-medium">
                    Currency *
                  </Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                      <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Image URL with Preview */}
              <div className="space-y-2">
                <Label htmlFor="imageUrl" className="text-sm font-medium">
                  Image URL
                </Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                {imageUrl && (
                  <div className="mt-2 border rounded-lg p-2 bg-muted/50">
                    <img 
                      src={imageUrl} 
                      alt="Product preview" 
                      className={`w-32 h-32 rounded mx-auto bg-white ${imageFit === 'cover' ? 'object-cover' : 'object-contain'}`}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                )}
                
                {/* Image Fit Toggle */}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-muted-foreground">Display:</span>
                  <div className="flex gap-1 p-0.5 bg-muted rounded-md">
                    <button
                      type="button"
                      onClick={() => setImageFit("contain")}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        imageFit === "contain" 
                          ? "bg-background text-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Full Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageFit("cover")}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        imageFit === "cover" 
                          ? "bg-background text-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Cropped
                    </button>
                  </div>
                </div>
              </div>

              {/* Store and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="store" className="text-sm font-medium">
                    Store *
                  </Label>
                  <Select value={store} onValueChange={setStore} required>
                   <SelectTrigger>
                      <SelectValue placeholder="Select a store" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {getAllStores().map((store) => (
                        <SelectItem key={store.id} value={store.name}>
                          {store.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category
                  </Label>
                  <Select value={categoryType} onValueChange={setCategoryType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Accessories">Accessories</SelectItem>
                      <SelectItem value="Clothes">Clothes</SelectItem>
                      <SelectItem value="Shoes">Shoes</SelectItem>
                      <SelectItem value="Watches">Watches</SelectItem>
                      <SelectItem value="Home and Kitchen">Home and Kitchen</SelectItem>
                      <SelectItem value="Care products">Care Products</SelectItem>
                      <SelectItem value="Pet products">Pet Products</SelectItem>
                      <SelectItem value="Furniture">Furniture</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Custom Category Input */}
              {categoryType === 'Custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customCategory" className="text-sm font-medium">
                    Custom Category
                  </Label>
                  <Input
                    id="customCategory"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category"
                    maxLength={16}
                  />
                  <p className="text-xs text-muted-foreground">Max 16 characters</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full bg-gradient-primary hover:shadow-hover transition-all duration-200"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding Product...
                  </>
                ) : (
                  "Add Product"
                )}
              </Button>
            </>
          )}

          {/* Manual Entry Button - Show if user doesn't want to auto-fill */}
          {!hasAutoFilled && (
            <div className="text-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setHasAutoFilled(true)}
              >
                Skip Auto-Fill & Enter Manually
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
