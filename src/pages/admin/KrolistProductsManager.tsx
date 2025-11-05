import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import { STORES } from '@/config/stores';

interface KrolistProduct {
  id: string;
  title: string;
  description: string | null;
  current_price: number;
  original_price: number;
  currency: string;
  original_currency: string;
  store: string;
  product_url: string;
  image_url: string | null;
  category: string | null;
  is_featured: boolean;
  collection_title: string;
  youtube_url: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  'Electronics', 'Fashion', 'Home & Garden', 'Sports', 
  'Beauty', 'Toys', 'Books', 'Automotive', 'Custom'
];

const CURRENCIES = ['SAR', 'AED', 'USD', 'EUR', 'GBP'];

export default function KrolistProductsManager() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<KrolistProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showNewListDialog, setShowNewListDialog] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<KrolistProduct | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    current_price: '',
    original_price: '',
    currency: 'SAR',
    original_currency: 'SAR',
    store: '',
    product_url: '',
    image_url: '',
    category: '',
    customCategory: '',
    collection_title: 'Featured Products',
    youtube_url: '',
    is_featured: true,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  // No need for this useEffect, we already have collections defined

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('krolist_products')
        .select('*')
        .order('collection_title', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
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

  const handleCreateNewList = async () => {
    if (!newListTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a collection title',
        variant: 'destructive',
      });
      return;
    }

    setFormData({
      ...formData,
      collection_title: newListTitle.trim(),
    });
    setNewListTitle('');
    setShowNewListDialog(false);
    handleOpenDialog();
  };

  // Get unique collections
  const collections = ['all', ...new Set(products.map(p => p.collection_title))];
  
  // Filter products by selected collection
  const filteredProducts = selectedCollection === 'all' 
    ? products 
    : products.filter(p => p.collection_title === selectedCollection);

  // Group products by collection for display
  const productsByCollection = products.reduce((acc, product) => {
    const collection = product.collection_title || 'Featured Products';
    if (!acc[collection]) {
      acc[collection] = [];
    }
    acc[collection].push(product);
    return acc;
  }, {} as Record<string, KrolistProduct[]>);

  const handleRefreshPrices = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('refresh-product-prices');
      
      if (error) throw error;
      
      toast({
        title: 'Prices refreshed',
        description: `Updated ${data.updated} out of ${data.checked} products`,
      });
      
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Error refreshing prices',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenDialog = (product?: KrolistProduct) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        title: product.title,
        description: product.description || '',
        current_price: product.current_price.toString(),
        original_price: product.original_price.toString(),
        currency: product.currency,
        original_currency: product.original_currency,
        store: product.store,
        product_url: product.product_url,
        image_url: product.image_url || '',
        category: CATEGORIES.includes(product.category || '') ? product.category || '' : 'Custom',
        customCategory: CATEGORIES.includes(product.category || '') ? '' : product.category || '',
        collection_title: product.collection_title || 'Featured Products',
        youtube_url: product.youtube_url || '',
        is_featured: product.is_featured,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        title: '',
        description: '',
        current_price: '',
        original_price: '',
        currency: 'SAR',
        original_currency: 'SAR',
        store: '',
        product_url: '',
        image_url: '',
        category: '',
        customCategory: '',
        collection_title: 'Featured Products',
        youtube_url: '',
        is_featured: true,
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    const finalCategory = formData.category === 'Custom' ? formData.customCategory : formData.category;
    
    const productData = {
      title: formData.title,
      description: formData.description || null,
      current_price: parseFloat(formData.current_price),
      original_price: parseFloat(formData.original_price),
      currency: formData.currency,
      original_currency: formData.original_currency,
      store: formData.store,
      product_url: formData.product_url,
      image_url: formData.image_url || null,
      category: finalCategory || null,
      collection_title: formData.collection_title,
      youtube_url: formData.youtube_url || null,
      is_featured: formData.is_featured,
    };

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('krolist_products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast({ title: t('admin.productUpdated') });
      } else {
        const { error } = await supabase
          .from('krolist_products')
          .insert([productData]);

        if (error) throw error;
        toast({ title: t('admin.productAdded') });
      }

      setShowDialog(false);
      fetchProducts();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.confirmDelete'))) return;

    try {
      const { error } = await supabase
        .from('krolist_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: t('admin.productDeleted') });
      fetchProducts();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('admin.krolistProducts')}</h2>
          <p className="text-muted-foreground">{t('admin.krolistProductsDesc')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefreshPrices} disabled={isRefreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Prices
          </Button>
          <Button onClick={() => setShowNewListDialog(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New List
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.addProduct')}
          </Button>
        </div>
      </div>

      {/* Collection filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {collections.map((collection) => (
          <Button
            key={collection}
            variant={selectedCollection === collection ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCollection(collection)}
          >
            {collection}
            {collection !== 'all' && (
              <Badge variant="secondary" className="ml-2">
                {products.filter(p => p.collection_title === collection).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Products grouped by collection */}
      {selectedCollection === 'all' ? (
        Object.entries(productsByCollection).map(([collectionTitle, collectionProducts]) => (
          <div key={collectionTitle} className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {collectionTitle}
              <Badge variant="secondary">{collectionProducts.length}</Badge>
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {collectionProducts.map((product) => (
                <Card key={product.id}>
            <CardHeader>
              {product.image_url && (
                <img 
                  src={product.image_url} 
                  alt={product.title}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
              )}
              <CardTitle className="line-clamp-2">{product.title}</CardTitle>
              <CardDescription className="line-clamp-2">{product.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {product.current_price} {product.currency}
                  </span>
                  {product.is_featured && (
                    <Badge variant="secondary">{t('featured')}</Badge>
                  )}
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{product.store}</Badge>
                  {product.category && (
                    <Badge variant="outline">{product.category}</Badge>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open(product.product_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleOpenDialog(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                {product.image_url && (
                  <img 
                    src={product.image_url} 
                    alt={product.title}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                )}
                <CardTitle className="line-clamp-2">{product.title}</CardTitle>
                <CardDescription className="line-clamp-2">{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {product.current_price} {product.currency}
                    </span>
                    {product.is_featured && (
                      <Badge variant="secondary">{t('featured')}</Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">{product.store}</Badge>
                    {product.category && (
                      <Badge variant="outline">{product.category}</Badge>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(product.product_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleOpenDialog(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? t('admin.editProduct') : t('admin.addProduct')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{t('product.title')}</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label>{t('product.description')}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <Label>{t('product.imageUrl')}</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('product.currentPrice')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.current_price}
                  onChange={(e) => setFormData({ ...formData, current_price: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('product.originalPrice')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('product.currency')}</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(curr => (
                      <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('product.originalCurrency')}</Label>
                <Select 
                  value={formData.original_currency} 
                  onValueChange={(value) => setFormData({ ...formData, original_currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(curr => (
                      <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>{t('product.store')}</Label>
              <Select 
                value={formData.store} 
                onValueChange={(value) => setFormData({ ...formData, store: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(STORES).map(store => (
                    <SelectItem key={store.id} value={store.name}>{store.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('product.productUrl')}</Label>
              <Input
                value={formData.product_url}
                onChange={(e) => setFormData({ ...formData, product_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label>{t('product.category')}</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.category === 'Custom' && (
              <div>
                <Label>{t('product.customCategory')}</Label>
                <Input
                  value={formData.customCategory}
                  onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                  maxLength={16}
                />
              </div>
            )}

            <div>
              <Label>Collection Title</Label>
              <Input
                value={formData.collection_title}
                onChange={(e) => setFormData({ ...formData, collection_title: e.target.value })}
                placeholder="e.g., Summer Sale, Electronics"
              />
            </div>

            <div>
              <Label>YouTube Review URL (Optional)</Label>
              <Input
                value={formData.youtube_url}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                placeholder="https://youtube.com/..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
              />
              <Label>{t('admin.featured')}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave}>{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New List Dialog */}
      <Dialog open={showNewListDialog} onOpenChange={setShowNewListDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Product List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Collection Title</Label>
              <Input
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="e.g., Summer Sale, Electronics Deals"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewListDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNewList}>Create & Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
