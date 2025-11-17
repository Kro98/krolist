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
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ExternalLink, RefreshCw, ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import { STORES } from '@/config/stores';
import { ProductCarousel } from '@/components/ProductCarousel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

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
  last_checked_at?: string;
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
  const [refreshProgress, setRefreshProgress] = useState<number>(0);
  const [showRefreshProgress, setShowRefreshProgress] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showNewListDialog, setShowNewListDialog] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<KrolistProduct | null>(null);
  
  // Collection management state
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [collectionAction, setCollectionAction] = useState<'rename' | 'migrate' | 'delete' | null>(null);
  const [selectedCollectionTitle, setSelectedCollectionTitle] = useState<string>('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [targetCollection, setTargetCollection] = useState<string>('');
  
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
    copyToCollection: '',
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

  const handleRefreshPrices = async (collectionTitle?: string) => {
    setIsRefreshing(true);
    setShowRefreshProgress(true);
    setRefreshProgress(0);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-refresh-krolist-prices', {
        body: { collection_title: collectionTitle === 'all' ? undefined : collectionTitle }
      });
      
      if (error) throw error;
      
      setRefreshProgress(100);
      
      toast({
        title: 'Prices refreshed successfully',
        description: `Updated ${data.updated} products${collectionTitle && collectionTitle !== 'all' ? ` in ${collectionTitle}` : ''}. Failed: ${data.failed}`,
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
      setTimeout(() => setShowRefreshProgress(false), 2000);
    }
  };

  const handleCollectionAction = (action: 'rename' | 'migrate' | 'delete', collectionTitle: string) => {
    setCollectionAction(action);
    setSelectedCollectionTitle(collectionTitle);
    setNewCollectionName('');
    setTargetCollection('');
    setShowCollectionDialog(true);
  };

  const handleRenameCollection = async () => {
    if (!newCollectionName.trim()) {
      toast({ title: 'Error', description: 'Please enter a new collection name', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('krolist_products')
        .update({ collection_title: newCollectionName.trim() })
        .eq('collection_title', selectedCollectionTitle);

      if (error) throw error;
      
      toast({ title: 'Success', description: 'Collection renamed successfully' });
      setShowCollectionDialog(false);
      fetchProducts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleMigrateCollection = async () => {
    if (!targetCollection) {
      toast({ title: 'Error', description: 'Please select a target collection', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('krolist_products')
        .update({ collection_title: targetCollection })
        .eq('collection_title', selectedCollectionTitle);

      if (error) throw error;
      
      toast({ 
        title: 'Success', 
        description: `All products migrated to ${targetCollection}` 
      });
      setShowCollectionDialog(false);
      fetchProducts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteCollection = async () => {
    const productsInCollection = products.filter(p => p.collection_title === selectedCollectionTitle);
    
    if (!confirm(`Are you sure you want to delete "${selectedCollectionTitle}" and all ${productsInCollection.length} products in it? This action cannot be undone.`)) {
      setShowCollectionDialog(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('krolist_products')
        .delete()
        .eq('collection_title', selectedCollectionTitle);

      if (error) throw error;
      
      toast({ 
        title: 'Success', 
        description: `Collection "${selectedCollectionTitle}" deleted` 
      });
      setShowCollectionDialog(false);
      setSelectedCollection('all');
      fetchProducts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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
        copyToCollection: '',
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
        collection_title: selectedCollection === 'all' ? 'Featured Products' : selectedCollection,
        youtube_url: '',
        is_featured: true,
        copyToCollection: '',
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
        
        // If copyToCollection is selected, create a copy
        if (formData.copyToCollection && formData.copyToCollection !== 'none') {
          const copyData = {
            ...productData,
            collection_title: formData.copyToCollection,
          };
          
          const { error: copyError } = await supabase
            .from('krolist_products')
            .insert([copyData]);
            
          if (copyError) throw copyError;
          
          toast({ 
            title: 'Success', 
            description: `Product updated and copied to ${formData.copyToCollection}` 
          });
        } else {
          toast({ title: t('admin.productUpdated') });
        }
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
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold">{t('admin.krolistProducts')}</h2>
          <p className="text-muted-foreground">{t('admin.krolistProductsDesc')}</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isRefreshing} variant="outline" className="flex-1 md:flex-none">
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline md:ml-2">Refresh Prices</span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleRefreshPrices('all')}>
                Refresh All Collections
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {Object.keys(productsByCollection).map(collection => (
                <DropdownMenuItem 
                  key={collection} 
                  onClick={() => handleRefreshPrices(collection)}
                >
                  Refresh {collection}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setShowNewListDialog(true)} variant="outline" className="flex-1 md:flex-none">
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline md:ml-2">New List</span>
          </Button>
          <Button onClick={() => handleOpenDialog()} className="flex-1 md:flex-none">
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline md:ml-2">{t('admin.addProduct')}</span>
          </Button>
        </div>
      </div>

      {/* Collection filter - Collapsible on mobile */}
      <details className="md:hidden group mb-4">
        <summary className="flex items-center justify-between p-3 border rounded-md cursor-pointer list-none bg-background hover:bg-accent">
          <span className="font-medium">
            {selectedCollection === 'all' ? 'All Collections' : selectedCollection}
          </span>
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="flex gap-2 flex-wrap mt-2 p-2">
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
      </details>
      
      {/* Collection filter - Always visible on desktop */}
      <div className="hidden md:flex gap-2 flex-wrap mb-4">
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
            <div className="flex items-center justify-between mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <span className="text-xl font-bold">{collectionTitle}</span>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => handleCollectionAction('rename', collectionTitle)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Rename Collection
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCollectionAction('migrate', collectionTitle)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Migrate to Another Collection
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => handleCollectionAction('delete', collectionTitle)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Collection
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <ProductCarousel
              title=""
              products={collectionProducts.map(p => ({
                ...p,
                isKrolistProduct: true,
                price_history: [],
                last_checked_at: p.last_checked_at || p.updated_at
              }))}
              onDelete={handleDelete}
              onUpdate={(id, updates) => {
                const product = collectionProducts.find(p => p.id === id);
                if (product) handleOpenDialog(product);
              }}
            />
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
                  
                  {/* Tags - Collapsible on mobile */}
                  <details className="md:hidden group">
                    <summary className="flex items-center gap-2 cursor-pointer py-2 text-sm font-medium list-none">
                      <span>Tags</span>
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="flex gap-2 flex-wrap pt-2">
                      <Badge variant="outline">{product.store}</Badge>
                      {product.category && (
                        <Badge variant="outline">{product.category}</Badge>
                      )}
                    </div>
                  </details>
                  
                  {/* Tags - Always visible on desktop */}
                  <div className="hidden md:flex gap-2 flex-wrap">
                    <Badge variant="outline">{product.store}</Badge>
                    {product.category && (
                      <Badge variant="outline">{product.category}</Badge>
                    )}
                  </div>

                  {/* Action Buttons - Icon only on mobile, with text on desktop */}
                  <div className="flex gap-2 mt-4 justify-between md:justify-start">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(product.product_url, '_blank')}
                      className="flex-1 md:flex-none"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="hidden md:inline md:ml-2">View</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleOpenDialog(product)}
                      className="flex-1 md:flex-none"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="hidden md:inline md:ml-2">Edit</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDelete(product.id)}
                      className="flex-1 md:flex-none"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden md:inline md:ml-2">Delete</span>
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

            {editingProduct && (
              <div>
                <Label>Copy to Collection (Optional)</Label>
                <Select 
                  value={formData.copyToCollection || 'none'} 
                  onValueChange={(value) => setFormData({ ...formData, copyToCollection: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select collection to copy to..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Don't copy</SelectItem>
                    {collections
                      .filter(c => c !== 'all' && c !== formData.collection_title)
                      .map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  This will create a duplicate of this product in the selected collection
                </p>
              </div>
            )}

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

      {/* Collection Management Dialog */}
      <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {collectionAction === 'rename' && 'Rename Collection'}
              {collectionAction === 'migrate' && 'Migrate Collection'}
              {collectionAction === 'delete' && 'Delete Collection'}
            </DialogTitle>
          </DialogHeader>
          
          {collectionAction === 'rename' && (
            <div className="space-y-4">
              <p>Current name: <strong>{selectedCollectionTitle}</strong></p>
              <div>
                <Label>New Collection Name</Label>
                <Input
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Enter new collection name"
                />
              </div>
            </div>
          )}
          
          {collectionAction === 'migrate' && (
            <div className="space-y-4">
              <p>Move all products from <strong>{selectedCollectionTitle}</strong> to:</p>
              <div>
                <Label>Target Collection</Label>
                <Select value={targetCollection} onValueChange={setTargetCollection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections
                      .filter(c => c !== 'all' && c !== selectedCollectionTitle)
                      .map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          {collectionAction === 'delete' && (
            <div className="space-y-4">
              <p className="text-destructive font-semibold">
                Warning: This will delete all products in "{selectedCollectionTitle}"
              </p>
              <p>
                Products to be deleted: {products.filter(p => p.collection_title === selectedCollectionTitle).length}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCollectionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (collectionAction === 'rename') handleRenameCollection();
              if (collectionAction === 'migrate') handleMigrateCollection();
              if (collectionAction === 'delete') handleDeleteCollection();
            }}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress indicator for refresh */}
      {showRefreshProgress && (
        <div className="fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 w-80">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
            <span className="font-medium">Refreshing prices...</span>
          </div>
          <Progress value={refreshProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">{refreshProgress}% complete</p>
        </div>
      )}
    </div>
  );
}
