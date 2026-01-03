import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Image as ImageIcon, Package } from 'lucide-react';
import { FunnyLoadingText } from '@/components/FunnyLoadingText';

interface CategoryCollection {
  id: string;
  title: string;
  icon_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function CategoryManager() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<CategoryCollection[]>([]);
  const [krolistProducts, setKrolistProducts] = useState<any[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showProductsDialog, setShowProductsDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryCollection | null>(null);
  const [selectedCategoryForProducts, setSelectedCategoryForProducts] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productCategories, setProductCategories] = useState<Record<string, string[]>>({});
  const [productSort, setProductSort] = useState<'title' | 'new' | 'shop' | 'tag'>('title');
  
  const [formData, setFormData] = useState({
    title: '',
    icon_url: '',
    is_active: true,
  });

  useEffect(() => {
    fetchCategories();
    fetchKrolistProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      // Fetch categories and product counts in parallel
      const [categoriesResult, countsResult] = await Promise.all([
        supabase
          .from('category_collections')
          .select('*')
          .order('display_order', { ascending: true }),
        supabase
          .from('category_products')
          .select('category_id')
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      setCategories(categoriesResult.data || []);

      // Count products per category
      const counts: Record<string, number> = {};
      if (countsResult.data) {
        for (const item of countsResult.data) {
          counts[item.category_id] = (counts[item.category_id] || 0) + 1;
        }
      }
      setProductCounts(counts);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKrolistProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('krolist_products')
        .select('*')
        .order('title');

      if (error) throw error;
      setKrolistProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategoryProducts = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('category_products')
        .select('product_id')
        .eq('category_id', categoryId);

      if (error) throw error;
      return (data || []).map(cp => cp.product_id);
    } catch (error: any) {
      console.error('Error fetching category products:', error);
      return [];
    }
  };

  const handleOpenDialog = (category?: CategoryCollection) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        title: category.title,
        icon_url: category.icon_url || '',
        is_active: category.is_active,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        title: '',
        icon_url: '',
        is_active: true,
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    const categoryData = {
      title: formData.title,
      icon_url: formData.icon_url || null,
      is_active: formData.is_active,
      display_order: editingCategory?.display_order ?? categories.length,
    };

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('category_collections')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast({ title: 'Category updated' });
      } else {
        const { error } = await supabase
          .from('category_collections')
          .insert([categoryData]);

        if (error) throw error;
        toast({ title: 'Category added' });
      }

      setShowDialog(false);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('category_collections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Category deleted' });
      fetchCategories();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleManageProducts = async (category: CategoryCollection) => {
    setSelectedCategoryForProducts(category.id);
    const productIds = await fetchCategoryProducts(category.id);
    setSelectedProducts(productIds);
    
    // Fetch all product-category associations
    try {
      const { data: allCategoryProducts, error } = await supabase
        .from('category_products')
        .select('product_id, category_id');
      
      if (error) throw error;
      
      // Fetch category titles
      const { data: categoriesData, error: catError } = await supabase
        .from('category_collections')
        .select('id, title');
      
      if (catError) throw catError;
      
      // Create a mapping of category IDs to titles
      const categoryMap = new Map(categoriesData?.map(c => [c.id, c.title]) || []);
      
      // Group categories by product
      const productCatMap: Record<string, string[]> = {};
      allCategoryProducts?.forEach(cp => {
        if (!productCatMap[cp.product_id]) {
          productCatMap[cp.product_id] = [];
        }
        const categoryTitle = categoryMap.get(cp.category_id);
        if (categoryTitle) {
          productCatMap[cp.product_id].push(categoryTitle);
        }
      });
      
      setProductCategories(productCatMap);
    } catch (error) {
      console.error('Error fetching product categories:', error);
    }
    
    setShowProductsDialog(true);
  };

  const handleSaveCategoryProducts = async () => {
    if (!selectedCategoryForProducts) return;

    try {
      // Delete existing associations
      await supabase
        .from('category_products')
        .delete()
        .eq('category_id', selectedCategoryForProducts);

      // Insert new associations
      if (selectedProducts.length > 0) {
        const inserts = selectedProducts.map((productId, index) => ({
          category_id: selectedCategoryForProducts,
          product_id: productId,
          display_order: index
        }));

        const { error } = await supabase
          .from('category_products')
          .insert(inserts);

        if (error) throw error;
      }

      toast({ title: 'Category products updated' });
      setShowProductsDialog(false);
      setSelectedCategoryForProducts(null);
      setSelectedProducts([]);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <FunnyLoadingText />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Category Collections</h2>
          <p className="text-muted-foreground">Manage category buttons that link to product collections</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((category) => (
          <Card key={category.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 hover:border-primary/30">
            <div className="flex h-full">
              {/* Image Section - Left Side */}
              <div className="relative w-32 sm:w-40 flex-shrink-0 bg-muted/30">
                {category.icon_url ? (
                  <img 
                    src={category.icon_url} 
                    alt={category.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
                {/* Active Status Indicator */}
                <div className={`absolute top-2 left-2 w-3 h-3 rounded-full ${category.is_active ? 'bg-success' : 'bg-muted-foreground'} ring-2 ring-background`} />
              </div>

              {/* Content Section - Right Side */}
              <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                {/* Title & Product Count */}
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg truncate">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{productCounts[category.id] || 0}</span> products
                  </p>
                </div>

                {/* Actions - Vertical Stack */}
                <div className="flex items-center gap-2 mt-4">
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => handleManageProducts(category)}
                    className="flex-1 h-9"
                  >
                    <Package className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Products</span>
                  </Button>
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => handleOpenDialog(category)}
                    className="h-9 w-9"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => handleDelete(category.id)}
                    className="h-9 w-9 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Switch
                    checked={category.is_active}
                    onCheckedChange={async (checked) => {
                      await supabase
                        .from('category_collections')
                        .update({ is_active: checked })
                        .eq('id', category.id);
                      fetchCategories();
                    }}
                    className="ml-auto"
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              Create category buttons that organize featured products
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Category Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Watch Selection"
              />
            </div>

            <div>
              <Label>Icon/Logo Image</Label>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({ ...formData, icon_url: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <Input
                  value={formData.icon_url}
                  onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                  placeholder="Or paste image URL: https://..."
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Upload from your computer or paste an image URL
              </p>
              {formData.icon_url && (
                <div className="mt-2">
                  <img src={formData.icon_url} alt="Preview" className="w-20 h-20 rounded-full object-cover" />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active (visible to users)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingCategory ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProductsDialog} onOpenChange={setShowProductsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Assign Products to Category</DialogTitle>
            <DialogDescription>
              Select which Krolist products should appear in this category
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Label className="text-sm">Sort by:</Label>
            <Select value={productSort} onValueChange={(v) => setProductSort(v as typeof productSort)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="new">Newest</SelectItem>
                <SelectItem value="shop">Shop</SelectItem>
                <SelectItem value="tag">Tag</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-y-auto max-h-96 space-y-2">
            {[...krolistProducts]
              .sort((a, b) => {
                switch (productSort) {
                  case 'new':
                    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                  case 'shop':
                    return (a.store || '').localeCompare(b.store || '');
                  case 'tag':
                    return (a.category || '').localeCompare(b.category || '');
                  default:
                    return (a.title || '').localeCompare(b.title || '');
                }
              })
              .map((product) => {
              const categories = productCategories[product.id] || [];
              const categoriesText = categories.length > 0 ? ` - ${categories.join(' & ')}` : '';
              const truncatedTitle = product.title.length > 50 
                ? product.title.substring(0, 50) + '...' 
                : product.title;
              
              return (
                <div key={product.id} className="flex items-center space-x-2 p-2 border rounded">
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProducts([...selectedProducts, product.id]);
                      } else {
                        setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{truncatedTitle}</p>
                    <p className="text-xs text-muted-foreground">{product.store}{categoriesText}</p>
                  </div>
                  {product.image_url && (
                    <img src={product.image_url} alt="" className="w-12 h-12 object-cover rounded" />
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategoryProducts}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}