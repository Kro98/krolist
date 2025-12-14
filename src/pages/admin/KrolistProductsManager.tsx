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
import { Plus, Edit, Trash2, ExternalLink, RefreshCw, ChevronDown, ChevronUp, MoreVertical, Download, Upload } from 'lucide-react';
import { STORES, getEnabledStores } from '@/config/stores';
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
  availability_status?: 'available' | 'currently_unavailable' | 'ran_out';
}
const CATEGORIES = ['Electronics', 'Fashion', 'Automotive', 'Watches', 'EDC', 'Custom'];
const CURRENCIES = ['SAR', 'AED', 'USD', 'EUR', 'GBP'];
const AVAILABILITY_STATUSES = [{
  value: 'available',
  label: 'Available',
  color: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30'
}, {
  value: 'currently_unavailable',
  label: 'Currently Unavailable',
  color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30'
}, {
  value: 'ran_out',
  label: 'Ran Out',
  color: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30'
}];
export default function KrolistProductsManager() {
  const {
    t
  } = useLanguage();
  const [products, setProducts] = useState<KrolistProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState<number>(0);
  const [showRefreshProgress, setShowRefreshProgress] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showNewListDialog, setShowNewListDialog] = useState(false);
  const [showManualPriceDialog, setShowManualPriceDialog] = useState(false);
  const [manualPrices, setManualPrices] = useState<Record<string, string>>({});
  const [manualStatuses, setManualStatuses] = useState<Record<string, string>>({});
  const [newListTitle, setNewListTitle] = useState('');
  const [selectedProductsToCopy, setSelectedProductsToCopy] = useState<string[]>([]);
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
    copyToCollection: ''
  });
  useEffect(() => {
    fetchProducts();
  }, []);

  // No need for this useEffect, we already have collections defined

  const fetchProducts = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('krolist_products').select('*').order('collection_title', {
        ascending: true
      }).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setProducts((data || []) as KrolistProduct[]);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
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
        variant: 'destructive'
      });
      return;
    }
    try {
      // If products are selected to copy, create copies in the new collection
      if (selectedProductsToCopy.length > 0) {
        const productsToCopy = products.filter(p => selectedProductsToCopy.includes(p.id));
        const copiedProducts = productsToCopy.map(({
          id,
          created_at,
          updated_at,
          ...rest
        }) => ({
          ...rest,
          collection_title: newListTitle.trim()
        }));
        const {
          error
        } = await supabase.from('krolist_products').insert(copiedProducts);
        if (error) throw error;
        toast({
          title: 'Success',
          description: `Collection "${newListTitle.trim()}" created with ${selectedProductsToCopy.length} products copied.`
        });
      } else {
        toast({
          title: 'Success',
          description: `Collection "${newListTitle.trim()}" created. You can now add products through the 3-dot menu.`
        });
      }
      setNewListTitle('');
      setSelectedProductsToCopy([]);
      setShowNewListDialog(false);
      setSelectedCollection(newListTitle.trim());
      await fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // Get unique collections
  const collections = ['all', ...new Set(products.map(p => p.collection_title))];

  // Filter products by selected collection
  const filteredProducts = selectedCollection === 'all' ? products : products.filter(p => p.collection_title === selectedCollection);

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
      const {
        data,
        error
      } = await supabase.functions.invoke('admin-refresh-krolist-prices', {
        body: {
          collection_title: collectionTitle === 'all' ? undefined : collectionTitle
        }
      });
      if (error) throw error;
      setRefreshProgress(100);
      toast({
        title: 'Prices refreshed successfully',
        description: `Updated ${data.updated} products${collectionTitle && collectionTitle !== 'all' ? ` in ${collectionTitle}` : ''}. Failed: ${data.failed}`
      });
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Error refreshing prices',
        description: error.message,
        variant: 'destructive'
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
      toast({
        title: 'Error',
        description: 'Please enter a new collection name',
        variant: 'destructive'
      });
      return;
    }
    try {
      const {
        error
      } = await supabase.from('krolist_products').update({
        collection_title: newCollectionName.trim()
      }).eq('collection_title', selectedCollectionTitle);
      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Collection renamed successfully'
      });
      setShowCollectionDialog(false);
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  const handleMigrateCollection = async () => {
    if (!targetCollection) {
      toast({
        title: 'Error',
        description: 'Please select a target collection',
        variant: 'destructive'
      });
      return;
    }
    try {
      const {
        error
      } = await supabase.from('krolist_products').update({
        collection_title: targetCollection
      }).eq('collection_title', selectedCollectionTitle);
      if (error) throw error;
      toast({
        title: 'Success',
        description: `All products migrated to ${targetCollection}`
      });
      setShowCollectionDialog(false);
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  const handleDeleteCollection = async () => {
    const productsInCollection = products.filter(p => p.collection_title === selectedCollectionTitle);
    if (!confirm(`Are you sure you want to delete "${selectedCollectionTitle}" and all ${productsInCollection.length} products in it? This action cannot be undone.`)) {
      setShowCollectionDialog(false);
      return;
    }
    try {
      const {
        error
      } = await supabase.from('krolist_products').delete().eq('collection_title', selectedCollectionTitle);
      if (error) throw error;
      toast({
        title: 'Success',
        description: `Collection "${selectedCollectionTitle}" deleted`
      });
      setShowCollectionDialog(false);
      setSelectedCollection('all');
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
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
        copyToCollection: ''
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
        copyToCollection: ''
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
      is_featured: formData.is_featured
    };
    try {
      if (editingProduct) {
        const {
          error
        } = await supabase.from('krolist_products').update(productData).eq('id', editingProduct.id);
        if (error) throw error;

        // If copyToCollection is selected, create a copy
        if (formData.copyToCollection && formData.copyToCollection !== 'none') {
          const copyData = {
            ...productData,
            collection_title: formData.copyToCollection
          };
          const {
            error: copyError
          } = await supabase.from('krolist_products').insert([copyData]);
          if (copyError) throw copyError;
          toast({
            title: 'Success',
            description: `Product updated and copied to ${formData.copyToCollection}`
          });
        } else {
          toast({
            title: t('admin.productUpdated')
          });
        }
      } else {
        const {
          error
        } = await supabase.from('krolist_products').insert([productData]);
        if (error) throw error;
        toast({
          title: t('admin.productAdded')
        });
      }
      setShowDialog(false);
      fetchProducts();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    try {
      const {
        error
      } = await supabase.from('krolist_products').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: t('admin.productDeleted')
      });
      fetchProducts();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  const handleOpenManualPriceDialog = () => {
    // Group products by title to handle duplicates
    const productsByTitle = products.reduce((acc, product) => {
      if (!acc[product.title]) {
        acc[product.title] = [];
      }
      acc[product.title].push(product);
      return acc;
    }, {} as Record<string, KrolistProduct[]>);

    // Initialize manual prices and statuses with current values (using first product of each group)
    const initialPrices: Record<string, string> = {};
    const initialStatuses: Record<string, string> = {};
    Object.entries(productsByTitle).forEach(([title, prods]) => {
      initialPrices[title] = prods[0].current_price.toString();
      initialStatuses[title] = prods[0].availability_status || 'available';
    });
    setManualPrices(initialPrices);
    setManualStatuses(initialStatuses);
    setShowManualPriceDialog(true);
  };
  const handleExportPrices = () => {
    // Group products by title
    const productsByTitle = products.reduce((acc, product) => {
      if (!acc[product.title]) {
        acc[product.title] = [];
      }
      acc[product.title].push(product);
      return acc;
    }, {} as Record<string, KrolistProduct[]>);

    // Create CSV content with BOM for Excel compatibility
    const BOM = '\uFEFF';
    let csv = BOM + 'Product Title,Store,Current Price,Currency,Product URL,Collections,Number of Copies,Last Updated,Image URL\n';
    Object.entries(productsByTitle).forEach(([title, prods]) => {
      const collections = prods.map(p => p.collection_title).join(' | ');
      const productUrl = prods[0].product_url;
      const lastUpdated = prods[0].last_checked_at || prods[0].updated_at;
      const imageUrl = prods[0].image_url || '';
      // Escape quotes in title and other fields
      const escapedTitle = title.replace(/"/g, '""');
      const escapedCollections = collections.replace(/"/g, '""');
      csv += `"${escapedTitle}","${prods[0].store}","${prods[0].current_price}","${prods[0].currency}","${productUrl}","${escapedCollections}","${prods.length}","${lastUpdated}","${imageUrl}"\n`;
    });

    // Download CSV
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `krolist-prices-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: 'Export successful',
      description: 'Prices exported to CSV file'
    });
  };
  const handleImportPrices = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      let text = e.target?.result as string;
      // Remove BOM if present
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }
      const lines = text.split('\n');

      // Skip header
      const dataLines = lines.slice(1).filter(line => line.trim());
      const importedPrices: Record<string, string> = {};
      dataLines.forEach(line => {
        // Better CSV parsing that handles quoted fields with commas
        const fields: string[] = [];
        let field = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              field += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            fields.push(field.trim());
            field = '';
          } else {
            field += char;
          }
        }
        fields.push(field.trim());
        if (fields.length >= 3) {
          const title = fields[0].replace(/^"|"$/g, '').replace(/""/g, '"').trim();
          const price = fields[2].replace(/^"|"$/g, '').trim();
          if (title && price && !isNaN(parseFloat(price))) {
            importedPrices[title] = price;
          }
        }
      });
      setManualPrices({
        ...manualPrices,
        ...importedPrices
      });
      toast({
        title: 'Import successful',
        description: `Imported ${Object.keys(importedPrices).length} prices`
      });
    };
    reader.readAsText(file, 'UTF-8');
    // Reset input
    event.target.value = '';
  };
  const handleSaveManualPrices = async () => {
    try {
      // Group products by title
      const productsByTitle = products.reduce((acc, product) => {
        if (!acc[product.title]) {
          acc[product.title] = [];
        }
        acc[product.title].push(product);
        return acc;
      }, {} as Record<string, KrolistProduct[]>);
      let updateCount = 0;
      const errors: string[] = [];

      // Update all products with the same title with the same price and status
      for (const [title, priceStr] of Object.entries(manualPrices)) {
        const price = parseFloat(priceStr);
        if (isNaN(price) || price <= 0) continue;
        const productsToUpdate = productsByTitle[title] || [];
        const status = manualStatuses[title] || 'available';
        for (const product of productsToUpdate) {
          try {
            const {
              error
            } = await supabase.from('krolist_products').update({
              current_price: price,
              availability_status: status,
              last_checked_at: new Date().toISOString()
            }).eq('id', product.id);
            if (error) {
              errors.push(`Failed to update ${title}: ${error.message}`);
            } else {
              updateCount++;
            }
          } catch (err: any) {
            errors.push(`Error updating ${title}: ${err.message}`);
          }
        }
      }
      if (errors.length > 0) {
        toast({
          title: 'Partial success',
          description: `Updated ${updateCount} products. ${errors.length} errors occurred.`,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Success',
          description: `Updated ${updateCount} products successfully`
        });
      }
      setShowManualPriceDialog(false);
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  if (isLoading) {
    return <div>{t('loading')}</div>;
  }
  return <div className="space-y-6">
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold">{t('admin.krolistProducts')}</h2>
          <p className="text-muted-foreground">{t('admin.krolistProductsDesc')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
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
              {Object.keys(productsByCollection).map(collection => <DropdownMenuItem key={collection} onClick={() => handleRefreshPrices(collection)}>
                  Refresh {collection}
                </DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleOpenManualPriceDialog} variant="outline" className="flex-1 md:flex-none">
            <Edit className="h-4 w-4" />
            <span className="hidden md:inline md:ml-2">Manual Prices</span>
          </Button>
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
          {collections.map(collection => <Button key={collection} variant={selectedCollection === collection ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCollection(collection)}>
              {collection}
              {collection !== 'all' && <Badge variant="secondary" className="ml-2">
                  {products.filter(p => p.collection_title === collection).length}
                </Badge>}
            </Button>)}
        </div>
      </details>
      
      {/* Collection filter - Always visible on desktop */}
      <div className="hidden md:flex gap-2 flex-wrap mb-4">
        {collections.map(collection => <Button key={collection} variant={selectedCollection === collection ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCollection(collection)}>
            {collection}
            {collection !== 'all' && <Badge variant="secondary" className="ml-2">
                {products.filter(p => p.collection_title === collection).length}
              </Badge>}
          </Button>)}
      </div>

      {/* Products grouped by collection */}
      {selectedCollection === 'all' ? Object.entries(productsByCollection).map(([collectionTitle, collectionProducts]) => <div key={collectionTitle} className="mb-8">
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
                  <DropdownMenuItem className="text-destructive" onClick={() => handleCollectionAction('delete', collectionTitle)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Collection
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <ProductCarousel title="" products={collectionProducts.map(p => ({
        ...p,
        isKrolistProduct: true,
        price_history: [],
        last_checked_at: p.last_checked_at || p.updated_at
      }))} onDelete={handleDelete} onUpdate={(id, updates) => {
        const product = collectionProducts.find(p => p.id === id);
        if (product) handleOpenDialog(product);
      }} />
          </div>) : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map(product => <Card key={product.id} className="relative">
              {/* Three-dot menu for admin actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleOpenDialog(product)}>
                    <Edit className="h-4 w-4 mr-2" />
                    {t('admin.editProduct')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('admin.deleteProduct')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <CardHeader>
                {product.image_url && <img src={product.image_url} alt={product.title} className="w-full h-48 object-cover rounded-md mb-4" />}
                <CardTitle className="line-clamp-2">{product.title}</CardTitle>
                <CardDescription className="line-clamp-2">{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {product.current_price} {product.currency}
                    </span>
                    {product.is_featured && <Badge variant="secondary">{t('featured')}</Badge>}
                  </div>
                  
                  {/* Tags - Collapsible on mobile */}
                  <details className="md:hidden group">
                    <summary className="flex items-center gap-2 cursor-pointer py-2 text-sm font-medium list-none">
                      <span>Tags</span>
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="flex gap-2 flex-wrap pt-2">
                      <Badge variant="outline">{product.store}</Badge>
                      {product.category && <Badge variant="outline">{product.category}</Badge>}
                    </div>
                  </details>
                  
                  {/* Tags - Always visible on desktop */}
                  <div className="hidden md:flex gap-2 flex-wrap">
                    <Badge variant="outline">{product.store}</Badge>
                    {product.category && <Badge variant="outline">{product.category}</Badge>}
                  </div>

                </div>
              </CardContent>
            </Card>)}
        </div>}

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
              <Input value={formData.title} onChange={e => setFormData({
              ...formData,
              title: e.target.value
            })} />
            </div>

            <div>
              <Label>{t('product.description')}</Label>
              <Textarea value={formData.description} onChange={e => setFormData({
              ...formData,
              description: e.target.value
            })} />
            </div>

            <div>
              <Label>{t('product.imageUrl')}</Label>
              <Input value={formData.image_url} onChange={e => setFormData({
              ...formData,
              image_url: e.target.value
            })} placeholder="https://..." />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>{t('product.currentPrice')}</Label>
                <Input type="number" step="0.01" value={formData.current_price} onChange={e => setFormData({
                ...formData,
                current_price: e.target.value
              })} />
              </div>
              <div>
                <Label>{t('product.originalPrice')}</Label>
                <Input type="number" step="0.01" value={formData.original_price} onChange={e => setFormData({
                ...formData,
                original_price: e.target.value
              })} />
              </div>
              <div>
                <Label>{t('product.currency')}</Label>
                <Select value={formData.currency} onValueChange={value => setFormData({
                ...formData,
                currency: value
              })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(curr => <SelectItem key={curr} value={curr}>{curr}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('product.store')}</Label>
                <Select value={formData.store} onValueChange={value => setFormData({
                ...formData,
                store: value
              })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getEnabledStores().map(store => <SelectItem key={store.id} value={store.name}>{store.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('product.category')}</Label>
                <Select value={formData.category} onValueChange={value => setFormData({
                ...formData,
                category: value
              })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.category === 'Custom' && <div>
                <Label>{t('product.customCategory')}</Label>
                <Input value={formData.customCategory} onChange={e => setFormData({
              ...formData,
              customCategory: e.target.value
            })} maxLength={16} />
              </div>}

            <div>
              <Label>{t('product.productUrl')}</Label>
              <Input value={formData.product_url} onChange={e => setFormData({
              ...formData,
              product_url: e.target.value
            })} placeholder="https://..." />
            </div>

            <div>
              <Label>Collection Title</Label>
              <Select value={formData.collection_title} onValueChange={value => setFormData({
              ...formData,
              collection_title: value
            })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select collection..." />
                </SelectTrigger>
                <SelectContent>
                  {collections.filter(c => c !== 'all').map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>YouTube Review URL (Optional)</Label>
              <Input value={formData.youtube_url} onChange={e => setFormData({
              ...formData,
              youtube_url: e.target.value
            })} placeholder="https://youtube.com/..." />
            </div>

            {editingProduct && <div>
                <Label>Copy to Collection (Optional)</Label>
                <Select value={formData.copyToCollection || 'none'} onValueChange={value => setFormData({
              ...formData,
              copyToCollection: value
            })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select collection to copy to..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Don't copy</SelectItem>
                    {collections.filter(c => c !== 'all' && c !== formData.collection_title).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  This will create a duplicate of this product in the selected collection
                </p>
              </div>}

            
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Create New Product List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-y-auto">
            <div>
              <Label>Collection Title</Label>
              <Input value={newListTitle} onChange={e => setNewListTitle(e.target.value)} placeholder="e.g., Summer Sale, Electronics Deals" />
            </div>
            
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Select Products to Copy (Optional)
              </Label>
              <p className="text-sm text-muted-foreground mb-4">
                Select products from existing collections to add them to your new list as copies.
              </p>
              
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {Object.entries(productsByCollection).map(([collectionTitle, collectionProducts]) => <div key={collectionTitle} className="border-b last:border-b-0">
                    <div className="bg-muted/50 px-4 py-2 font-medium sticky top-0">
                      {collectionTitle}
                    </div>
                    <div className="divide-y">
                      {collectionProducts.map(product => <label key={product.id} className="flex items-start gap-3 p-3 hover:bg-accent/50 cursor-pointer transition-colors">
                          <input type="checkbox" className="mt-1" checked={selectedProductsToCopy.includes(product.id)} onChange={e => {
                      if (e.target.checked) {
                        setSelectedProductsToCopy([...selectedProductsToCopy, product.id]);
                      } else {
                        setSelectedProductsToCopy(selectedProductsToCopy.filter(id => id !== product.id));
                      }
                    }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3">
                              {product.image_url && <img src={product.image_url} alt={product.title} className="w-16 h-16 object-cover rounded flex-shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm line-clamp-2">{product.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">{product.store}</Badge>
                                  <span className="text-sm font-semibold text-primary">
                                    {product.current_price} {product.currency}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </label>)}
                    </div>
                  </div>)}
              </div>
              
              {selectedProductsToCopy.length > 0 && <p className="text-sm text-primary font-medium mt-2">
                  {selectedProductsToCopy.length} product{selectedProductsToCopy.length !== 1 ? 's' : ''} selected
                </p>}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => {
            setShowNewListDialog(false);
            setSelectedProductsToCopy([]);
            setNewListTitle('');
          }}>
              Cancel
            </Button>
            <Button onClick={handleCreateNewList}>Create</Button>
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
          
          {collectionAction === 'rename' && <div className="space-y-4">
              <p>Current name: <strong>{selectedCollectionTitle}</strong></p>
              <div>
                <Label>New Collection Name</Label>
                <Input value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} placeholder="Enter new collection name" />
              </div>
            </div>}
          
          {collectionAction === 'migrate' && <div className="space-y-4">
              <p>Move all products from <strong>{selectedCollectionTitle}</strong> to:</p>
              <div>
                <Label>Target Collection</Label>
                <Select value={targetCollection} onValueChange={setTargetCollection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.filter(c => c !== 'all' && c !== selectedCollectionTitle).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>}
          
          {collectionAction === 'delete' && <div className="space-y-4">
              <p className="text-destructive font-semibold">
                Warning: This will delete all products in "{selectedCollectionTitle}"
              </p>
              <p>
                Products to be deleted: {products.filter(p => p.collection_title === selectedCollectionTitle).length}
              </p>
            </div>}
          
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

      {/* Manual Price Update Dialog */}
      <Dialog open={showManualPriceDialog} onOpenChange={setShowManualPriceDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle>Manual Price Update</DialogTitle>
                
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportPrices}>
                  <Download className="h-4 w-4" />
                  <span className="hidden md:inline md:ml-2">Export</span>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <label className="cursor-pointer">
                    <Upload className="h-4 w-4" />
                    <span className="hidden md:inline md:ml-2">Import</span>
                    <input type="file" accept=".csv" className="hidden" onChange={handleImportPrices} />
                  </label>
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-3">
              {Object.entries(products.reduce((acc, product) => {
              if (!acc[product.title]) {
                acc[product.title] = [];
              }
              acc[product.title].push(product);
              return acc;
            }, {} as Record<string, KrolistProduct[]>)).map(([title, prods]) => {
              const lastUpdated = prods[0].last_checked_at || prods[0].updated_at;
              const formattedDate = lastUpdated ? new Date(lastUpdated).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
              }) : 'N/A';
              const currentStatus = manualStatuses[title] || prods[0].availability_status || 'available';
              const statusConfig = AVAILABILITY_STATUSES.find(s => s.value === currentStatus);
              return <Card key={title}>
                  <CardHeader className="pb-3 mx-[5px] px-[5px]">
                    <div className="flex items-start gap-3">
                      {prods[0].image_url && <img src={prods[0].image_url} alt={title} onError={e => {
                      e.currentTarget.style.display = 'none';
                    }} className="w-16 h-16 flex-shrink-0 border-0 rounded-sm opacity-100 object-fill" />}
                       <div className="flex-1 min-w-0">
                        <a href={prods[0].product_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" title={title}>
                          <CardTitle className="text-sm flex items-center gap-1">
                            {title.length > 30 ? `${title.substring(0, 30)}...` : title}
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </CardTitle>
                        </a>
                        <div className="flex gap-1 flex-wrap mt-1 items-center">
                          <Badge variant="outline" className="text-xs">{prods[0].store}</Badge>
                          <span className="text-[10px] text-muted-foreground">Updated: {formattedDate}</span>
                        </div>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {prods.map(p => <Badge key={p.id} variant="secondary" className="text-[10px]">
                              {p.collection_title}
                            </Badge>)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2 px-[5px] mx-[2px]">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Previous: {prods[0].current_price} {prods[0].currency}</span>
                      <span>Original: {prods[0].original_price} {prods[0].currency}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs whitespace-nowrap">New Price:</Label>
                      <Input type="number" step="0.01" value={manualPrices[title] || ''} onChange={e => setManualPrices({
                      ...manualPrices,
                      [title]: e.target.value
                    })} className="h-8 text-sm" placeholder={prods[0].current_price.toString()} />
                      <span className="text-xs text-muted-foreground">{prods[0].currency}</span>
                    </div>
                    {/* Status Selector */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs whitespace-nowrap">Status:</Label>
                      <Select value={currentStatus} onValueChange={value => setManualStatuses({
                      ...manualStatuses,
                      [title]: value
                    })}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABILITY_STATUSES.map(status => <SelectItem key={status.value} value={status.value}>
                              <span className={`px-1.5 py-0.5 rounded text-xs border ${status.color}`}>
                                {status.label}
                              </span>
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {prods.length > 1 && <p className="text-xs text-muted-foreground">
                        Updates {prods.length} copies
                      </p>}
                  </CardContent>
                </Card>;
            })}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Product</th>
                    <th className="text-left p-3 text-sm font-medium">Collections</th>
                    <th className="text-left p-3 text-sm font-medium">Previous Price</th>
                    <th className="text-left p-3 text-sm font-medium w-40">New Price</th>
                    <th className="text-left p-3 text-sm font-medium w-44">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {Object.entries(products.reduce((acc, product) => {
                  if (!acc[product.title]) {
                    acc[product.title] = [];
                  }
                  acc[product.title].push(product);
                  return acc;
                }, {} as Record<string, KrolistProduct[]>)).map(([title, prods]) => {
                  const lastUpdated = prods[0].last_checked_at || prods[0].updated_at;
                  const formattedDate = lastUpdated ? new Date(lastUpdated).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                  }) : 'N/A';
                  const currentStatus = manualStatuses[title] || prods[0].availability_status || 'available';
                  return <tr key={title} className="hover:bg-accent/50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {prods[0].image_url && <img src={prods[0].image_url} alt={title} className="w-12 h-12 object-cover rounded flex-shrink-0" onError={e => {
                          e.currentTarget.style.display = 'none';
                        }} />}
                          <div className="min-w-0">
                            <a href={prods[0].product_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                              <p className="font-medium text-sm line-clamp-2 flex items-center gap-1">
                                {title}
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              </p>
                            </a>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {prods[0].store}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                Updated: {formattedDate}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1 flex-wrap">
                          {prods.map(p => <Badge key={p.id} variant="secondary" className="text-xs">
                              {p.collection_title}
                            </Badge>)}
                        </div>
                        {prods.length > 1 && <p className="text-xs text-muted-foreground mt-1">
                            {prods.length} copies
                          </p>}
                      </td>
                      <td className="p-3">
                        <div>
                          <span className="font-semibold">
                            {prods[0].current_price} {prods[0].currency}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Original: {prods[0].original_price} {prods[0].currency}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <Input type="number" step="0.01" value={manualPrices[title] || ''} onChange={e => setManualPrices({
                        ...manualPrices,
                        [title]: e.target.value
                      })} className="h-9" placeholder={prods[0].current_price.toString()} />
                      </td>
                      <td className="p-3">
                        <Select value={currentStatus} onValueChange={value => setManualStatuses({
                        ...manualStatuses,
                        [title]: value
                      })}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABILITY_STATUSES.map(status => <SelectItem key={status.value} value={status.value}>
                                <span className={`px-1.5 py-0.5 rounded text-xs border ${status.color}`}>
                                  {status.label}
                                </span>
                              </SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>;
                })}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowManualPriceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveManualPrices}>
              Update Prices
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress indicator for refresh */}
      {showRefreshProgress && <div className="fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 w-80">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
            <span className="font-medium">Refreshing prices...</span>
          </div>
          <Progress value={refreshProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">{refreshProgress}% complete</p>
        </div>}
    </div>;
}