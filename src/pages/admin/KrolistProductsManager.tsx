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
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ExternalLink, RefreshCw, MoreVertical, Download, Upload, Loader2, Sparkles, XCircle } from 'lucide-react';
import { STORES, getEnabledStores } from '@/config/stores';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { FunnyLoadingText } from '@/components/FunnyLoadingText';

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

const CATEGORIES = ['Electronics', 'Fashion', 'Automotive', 'Watches', 'EDC', 'Kitchen Appliances', 'Custom'];
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
  const { t } = useLanguage();
  const [products, setProducts] = useState<KrolistProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState<number>(0);
  const [showRefreshProgress, setShowRefreshProgress] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showManualPriceDialog, setShowManualPriceDialog] = useState(false);
  const [manualPrices, setManualPrices] = useState<Record<string, string>>({});
  const [manualStatuses, setManualStatuses] = useState<Record<string, string>>({});
  const [clickedTitles, setClickedTitles] = useState<Set<string>>(new Set());
  
  // Auto-fill state
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  
  // Auto-update prices state
  const [isAutoUpdating, setIsAutoUpdating] = useState(false);
  const [autoUpdateProgress, setAutoUpdateProgress] = useState<{
    current: number;
    total: number;
    currentProduct: string;
    status: 'idle' | 'processing' | 'completed' | 'error';
    updated: number;
    failed: number;
    skipped: number;
    message?: string;
  } | null>(null);
  const [autoUpdateSessionId, setAutoUpdateSessionId] = useState<string | null>(null);
  const [scraperUpdatedIds, setScraperUpdatedIds] = useState<Set<string>>(new Set());
  
  // Manual price update progress state
  const [isSavingPrices, setIsSavingPrices] = useState(false);
  const [savePricesProgress, setSavePricesProgress] = useState(0);
  const [savePricesTotal, setSavePricesTotal] = useState(0);
  const [savePricesCompleted, setSavePricesCompleted] = useState(0);
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
    youtube_url: '',
    is_featured: true,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('krolist_products')
        .select('*')
        .order('created_at', { ascending: false });
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

  const handleRefreshPrices = async () => {
    setIsRefreshing(true);
    setShowRefreshProgress(true);
    setRefreshProgress(0);
    try {
      const { data, error } = await supabase.functions.invoke('admin-refresh-krolist-prices', {
        body: {}
      });
      if (error) throw error;
      setRefreshProgress(100);
      toast({
        title: 'Prices refreshed successfully',
        description: `Updated ${data.updated} products. Failed: ${data.failed}`
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

  // Handle auto-update prices using Amazon PA-API + Firecrawl fallback
  const handleAutoUpdatePrices = async () => {
    setIsAutoUpdating(true);
    setScraperUpdatedIds(new Set());
    const sessionId = crypto.randomUUID();
    setAutoUpdateSessionId(sessionId);
    setAutoUpdateProgress({
      current: 0,
      total: 0,
      currentProduct: 'Starting...',
      status: 'processing',
      updated: 0,
      failed: 0,
      skipped: 0
    });
    
    const channel = supabase.channel(`auto-update-${sessionId}`)
      .on('broadcast', { event: 'progress' }, ({ payload }) => {
        console.log('[Auto-Update] Progress update:', payload);
        setAutoUpdateProgress({
          current: payload.current,
          total: payload.total,
          currentProduct: payload.currentProduct,
          status: payload.status,
          updated: payload.updated || 0,
          failed: payload.failed || 0,
          skipped: payload.skipped || 0,
          message: payload.message
        });
        
        if (payload.status === 'completed') {
          // Track scraper-updated product IDs for green highlighting
          if (payload.scraperUpdatedIds && Array.isArray(payload.scraperUpdatedIds)) {
            setScraperUpdatedIds(new Set(payload.scraperUpdatedIds));
          }
          
          toast({
            title: 'Auto-update completed',
            description: payload.message || `Updated: ${payload.updated}, Failed: ${payload.failed}, Skipped: ${payload.skipped}`
          });
          setIsAutoUpdating(false);
          fetchProducts();
          
          setTimeout(() => {
            channel.unsubscribe();
            setAutoUpdateProgress(null);
            setAutoUpdateSessionId(null);
          }, 5000);
        }
      })
      .subscribe();
    
    try {
      const { data, error } = await supabase.functions.invoke('auto-update-prices', {
        body: { session_id: sessionId }
      });
      
      if (error) throw error;
      
      setAutoUpdateProgress(prev => prev ? {
        ...prev,
        total: data.products_count
      } : null);
      
      toast({
        title: 'Auto-update started',
        description: data.message || `Processing ${data.products_count} products`
      });
      
    } catch (error: any) {
      console.error('Auto-update error:', error);
      toast({
        title: 'Auto-update failed',
        description: error.message || 'Could not start auto-update',
        variant: 'destructive'
      });
      setIsAutoUpdating(false);
      setAutoUpdateProgress(null);
      channel.unsubscribe();
    }
  };

  const handleCancelAutoUpdate = async () => {
    if (!autoUpdateSessionId) return;
    try {
      const channel = supabase.channel(`auto-update-cancel-${autoUpdateSessionId}`);
      await channel.send({
        type: 'broadcast',
        event: 'cancel',
        payload: {}
      });
      toast({
        title: 'Cancelling auto-update...',
        description: 'The update will stop after the current product finishes.'
      });
    } catch (error) {
      console.error('Failed to cancel auto-update:', error);
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
        youtube_url: '',
        is_featured: true,
      });
    }
    setShowDialog(true);
  };

  const isAmazonUrl = (url: string): boolean => {
    try {
      const parsedUrl = new URL(url);
      return /amazon\.(com|sa|ae|co\.uk|de|fr|es|it|ca|com\.au|in|jp|com\.mx|com\.br|nl|sg|eg)/i.test(parsedUrl.hostname);
    } catch {
      return false;
    }
  };

  const handleAutoFill = async () => {
    if (!formData.product_url || !isAmazonUrl(formData.product_url)) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid Amazon product URL',
        variant: 'destructive'
      });
      return;
    }

    setIsAutoFilling(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('scrape-products', {
        body: {
          autoFill: true,
          url: formData.product_url
        }
      });

      if (error) throw error;

      if (data?.success === false) {
        toast({
          title: 'Auto-fill Unavailable',
          description: data?.error || 'Could not fetch product details. Please enter manually.',
          variant: 'default'
        });
        return;
      }

      if (data?.success && data?.product) {
        const product = data.product;
        
        let processedTitle = product.title || '';
        if (processedTitle.length > 200) {
          processedTitle = processedTitle.substring(0, 199) + '...';
        }
        
        const hasDiscount = product.originalPrice && product.originalPrice > product.price;
        const currentPrice = product.price ? product.price.toString() : '';
        const originalPrice = hasDiscount ? product.originalPrice.toString() : '';
        
        setFormData(prev => ({
          ...prev,
          title: processedTitle,
          description: product.description || '',
          image_url: product.image || '',
          current_price: currentPrice,
          original_price: originalPrice,
          store: 'Amazon',
          product_url: product.productUrl || prev.product_url,
          currency: 'SAR',
          original_currency: 'SAR'
        }));

        toast({
          title: 'Auto-fill successful',
          description: `Product details loaded${data.source === 'scraper' ? ' via scraper (PA-API unavailable)' : ' from Amazon'}`
        });
      } else {
        toast({
          title: 'Auto-fill Unavailable',
          description: data?.error || 'Could not fetch product details. Please enter manually.',
          variant: 'default'
        });
      }
    } catch (error: any) {
      console.error('Auto-fill error:', error);
      toast({
        title: 'Auto-fill failed',
        description: error.message || 'Could not fetch product details from Amazon',
        variant: 'destructive'
      });
    } finally {
      setIsAutoFilling(false);
    }
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
      collection_title: 'Featured Products',
      youtube_url: formData.youtube_url || null,
      is_featured: formData.is_featured
    };
    try {
      if (editingProduct) {
        const priceChanged = editingProduct.current_price !== parseFloat(formData.current_price);
        
        const { error } = await supabase.from('krolist_products').update(productData).eq('id', editingProduct.id);
        if (error) throw error;

        if (priceChanged) {
          await supabase.from('krolist_price_history').insert({
            product_id: editingProduct.id,
            price: parseFloat(formData.current_price),
            original_price: parseFloat(formData.original_price),
            currency: formData.currency || 'SAR'
          });
        }

        toast({ title: t('admin.productUpdated') });
      } else {
        const { data: insertedProduct, error } = await supabase
          .from('krolist_products')
          .insert([productData])
          .select()
          .single();
        if (error) throw error;
        
        if (insertedProduct) {
          await supabase.from('krolist_price_history').insert({
            product_id: insertedProduct.id,
            price: parseFloat(formData.current_price),
            original_price: parseFloat(formData.original_price),
            currency: formData.currency || 'SAR'
          });
        }
        
        const timestamp = new Date().toISOString();
        await supabase.from('global_notifications').upsert({
          id: 'new_product_notification',
          type: 'new_product',
          title: 'New Product Added',
          title_ar: 'تمت إضافة منتج جديد',
          message: `New products available! Last updated: ${new Date().toLocaleDateString()}`,
          message_ar: `منتجات جديدة متاحة! آخر تحديث: ${new Date().toLocaleDateString('ar')}`,
          data: { productTitle: formData.title, timestamp }
        }, { onConflict: 'id' });
        
        toast({ title: t('admin.productAdded') });
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
      const { error } = await supabase.from('krolist_products').delete().eq('id', id);
      if (error) throw error;
      toast({ title: t('admin.productDeleted') });
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
    const productsByTitle = products.reduce((acc, product) => {
      if (!acc[product.title]) {
        acc[product.title] = [];
      }
      acc[product.title].push(product);
      return acc;
    }, {} as Record<string, KrolistProduct[]>);

    const initialPrices: Record<string, string> = {};
    const initialStatuses: Record<string, string> = {};
    Object.entries(productsByTitle).forEach(([title, prods]) => {
      initialPrices[title] = prods[0].current_price.toString();
      initialStatuses[title] = prods[0].availability_status || 'available';
    });
    setManualPrices(initialPrices);
    setManualStatuses(initialStatuses);
    setClickedTitles(new Set());
    setShowManualPriceDialog(true);
  };

  const handleTitleClick = (title: string) => {
    setClickedTitles(prev => new Set(prev).add(title));
  };

  const handleExportPrices = () => {
    const productsByTitle = products.reduce((acc, product) => {
      if (!acc[product.title]) {
        acc[product.title] = [];
      }
      acc[product.title].push(product);
      return acc;
    }, {} as Record<string, KrolistProduct[]>);

    const BOM = '\uFEFF';
    let csv = BOM + 'Product Title,Store,Current Price,Currency,Product URL,Last Updated,Image URL\n';
    Object.entries(productsByTitle).forEach(([title, prods]) => {
      const productUrl = prods[0].product_url;
      const lastUpdated = prods[0].last_checked_at || prods[0].updated_at;
      const imageUrl = prods[0].image_url || '';
      const escapedTitle = title.replace(/"/g, '""');
      csv += `"${escapedTitle}","${prods[0].store}","${prods[0].current_price}","${prods[0].currency}","${productUrl}","${lastUpdated}","${imageUrl}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }
      const lines = text.split('\n');
      const dataLines = lines.slice(1).filter(line => line.trim());
      const importedPrices: Record<string, string> = {};
      dataLines.forEach(line => {
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
      setManualPrices({ ...manualPrices, ...importedPrices });
      toast({
        title: 'Import successful',
        description: `Imported ${Object.keys(importedPrices).length} prices`
      });
    };
    reader.readAsText(file, 'UTF-8');
    event.target.value = '';
  };

  const handleSaveManualPrices = async () => {
    const productsByTitle = products.reduce((acc, product) => {
      if (!acc[product.title]) {
        acc[product.title] = [];
      }
      acc[product.title].push(product);
      return acc;
    }, {} as Record<string, KrolistProduct[]>);

    const updates: { product: KrolistProduct; price: number; status: string }[] = [];
    for (const [title, priceStr] of Object.entries(manualPrices)) {
      const price = parseFloat(priceStr);
      if (isNaN(price) || price <= 0) continue;
      const productsToUpdate = productsByTitle[title] || [];
      const status = manualStatuses[title] || 'available';
      for (const product of productsToUpdate) {
        updates.push({ product, price, status });
      }
    }

    if (updates.length === 0) {
      toast({
        title: 'No updates',
        description: 'No valid price changes to save',
        variant: 'destructive'
      });
      return;
    }

    setShowManualPriceDialog(false);
    setIsSavingPrices(true);
    setSavePricesProgress(0);
    setSavePricesTotal(updates.length);
    setSavePricesCompleted(0);

    const BATCH_SIZE = 10;
    let updateCount = 0;
    const errors: string[] = [];
    const priceHistoryRecords: { product_id: string; price: number; original_price: number; currency: string }[] = [];

    const processBatch = async (batch: typeof updates) => {
      const results = await Promise.allSettled(
        batch.map(async ({ product, price, status }) => {
          const priceChanged = product.current_price !== price;
          const { error } = await supabase.from('krolist_products').update({
            current_price: price,
            availability_status: status,
            last_checked_at: new Date().toISOString()
          }).eq('id', product.id);
          
          if (error) throw new Error(`Failed to update ${product.title}: ${error.message}`);
          return { product, price, priceChanged };
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          updateCount++;
          if (result.value.priceChanged) {
            priceHistoryRecords.push({
              product_id: result.value.product.id,
              price: result.value.price,
              original_price: result.value.product.original_price,
              currency: result.value.product.currency || 'SAR'
            });
          }
        } else {
          errors.push(result.reason?.message || 'Unknown error');
        }
      }
    };

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      await processBatch(batch);
      
      const completed = Math.min(i + BATCH_SIZE, updates.length);
      setSavePricesCompleted(completed);
      setSavePricesProgress(Math.round((completed / updates.length) * 100));
    }

    if (priceHistoryRecords.length > 0) {
      const { error: historyError } = await supabase
        .from('krolist_price_history')
        .insert(priceHistoryRecords);
      if (historyError) {
        console.error('Error inserting price history:', historyError);
      }
    }
    
    if (updateCount > 0) {
      const timestamp = new Date().toISOString();
      await supabase.from('global_notifications').insert({
        type: 'price_update',
        title: 'Prices Updated',
        title_ar: 'تم تحديث الأسعار',
        message: `Product prices have been updated on ${new Date().toLocaleDateString()}`,
        message_ar: `تم تحديث أسعار المنتجات في ${new Date().toLocaleDateString('ar')}`,
        data: { updatedCount: updateCount, timestamp }
      });
    }
    
    setSavePricesProgress(100);
    
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
    
    fetchProducts();
    setTimeout(() => {
      setIsSavingPrices(false);
      setSavePricesProgress(0);
      setManualPrices({});
      setManualStatuses({});
    }, 2000);
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
          <h2 className="text-2xl font-bold">{t('admin.krolistProducts')}</h2>
          <p className="text-muted-foreground">
            {t('admin.krolistProductsDesc')} · {products.length} products
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleOpenManualPriceDialog} variant="outline" className="flex-1 md:flex-none">
            <Edit className="h-4 w-4 mr-2" />
            {t('admin.manualPrices')}
          </Button>
          <Button onClick={() => handleOpenDialog()} className="flex-1 md:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            {t('admin.addProduct')}
          </Button>
        </div>
      </div>

      {/* All products in a flat grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        {(() => {
          // Calculate discount % for each product
          const withDiscount = products.map(p => ({
            ...p,
            discountPct: p.original_price > 0 && p.original_price > p.current_price
              ? ((p.original_price - p.current_price) / p.original_price) * 100
              : 0,
          }));

          // Sort by discount to find top 5 and best
          const sorted = [...withDiscount].sort((a, b) => b.discountPct - a.discountPct);
          const bestId = sorted[0]?.discountPct > 0 ? sorted[0].id : null;
          const top5Ids = new Set(
            sorted.filter(p => p.discountPct > 0).slice(0, 5).map(p => p.id)
          );

          // Bad = no discount or price >= original
          const getAura = (p: typeof withDiscount[0]) => {
            if (p.id === bestId) return 'golden';
            if (top5Ids.has(p.id)) return 'green';
            if (p.discountPct <= 0) return 'red';
            return 'none';
          };

          const auraStyles: Record<string, string> = {
            red: 'ring-2 ring-red-500/40 shadow-[0_0_20px_-4px_rgba(239,68,68,0.5)]',
            green: 'ring-2 ring-green-500/40 shadow-[0_0_20px_-4px_rgba(34,197,94,0.5)]',
            golden: 'ring-2 ring-amber-400/60 shadow-[0_0_28px_-4px_rgba(251,191,36,0.6)]',
            none: '',
          };

          return withDiscount.map(product => {
            const aura = getAura(product);
            return (
              <Card key={product.id} className={`relative transition-shadow duration-300 ${auraStyles[aura]}`}>
                {/* Golden star particles for best deal */}
                {aura === 'golden' && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-0">
                    {[...Array(6)].map((_, i) => (
                      <span
                        key={i}
                        className="absolute text-amber-400 animate-pulse"
                        style={{
                          fontSize: `${8 + (i % 3) * 4}px`,
                          top: `${10 + (i * 15) % 80}%`,
                          left: `${5 + (i * 18) % 90}%`,
                          animationDelay: `${i * 0.3}s`,
                          animationDuration: `${1.5 + (i % 3) * 0.5}s`,
                          opacity: 0.7,
                        }}
                      >
                        ✦
                      </span>
                    ))}
                  </div>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="absolute top-3 right-3 z-10 h-8 w-8 bg-background shadow-md hover:bg-accent">
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
                <CardContent className="p-4 relative z-[1]">
                  {product.image_url && (
                    <img src={product.image_url} alt={product.title} className="w-full h-32 object-contain rounded mb-2" />
                  )}
                  <h4 className="font-medium text-sm line-clamp-2">{product.title}</h4>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className={`font-bold ${scraperUpdatedIds.has(product.id) ? 'text-green-500' : 'text-primary'}`}>{product.current_price} {product.currency}</p>
                    {scraperUpdatedIds.has(product.id) && (
                      <Badge className="text-[9px] px-1 py-0 bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 animate-pulse">
                        scraped
                      </Badge>
                    )}
                    {product.discountPct > 0 && (
                      <Badge className={`text-[10px] px-1.5 py-0 ${
                        aura === 'golden'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : aura === 'green'
                          ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        {Math.round(product.discountPct)}% OFF
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">{product.store}</Badge>
                    {product.category && <Badge variant="outline" className="text-xs">{product.category}</Badge>}
                  </div>
                </CardContent>
              </Card>
            );
          });
        })()}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No products yet</p>
          <p className="text-sm mt-1">Click "Add Product" to get started</p>
        </div>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0 bg-gradient-to-br from-background via-background to-muted/30 border-muted/50">
          <div className="relative px-6 pt-6 pb-4 border-b border-muted/30">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
            <DialogHeader className="relative">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {editingProduct ? t('admin.editProduct') : t('admin.addProduct')}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {editingProduct ? 'Update product details and pricing' : 'Add a new featured product'}
              </p>
            </DialogHeader>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            <div className="grid md:grid-cols-[280px_1fr] gap-6">
              {/* Left Column - Image Preview */}
              <div className="space-y-4">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted border border-muted/50 group">
                  {formData.image_url ? (
                    <>
                      <img 
                        src={formData.image_url} 
                        alt="Product preview" 
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50">
                      <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">No image</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{t('product.imageUrl')}</Label>
                  <Input 
                    value={formData.image_url} 
                    onChange={e => setFormData({ ...formData, image_url: e.target.value })} 
                    placeholder="https://..."
                    className="bg-muted/30 border-muted/50 focus:border-primary/50 transition-colors"
                  />
                </div>

                {(formData.current_price || formData.original_price) && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                    <p className="text-xs uppercase tracking-wider text-primary/70 font-medium mb-2">Price Preview</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary">
                        {formData.current_price || '0'} {formData.currency}
                      </span>
                      {formData.original_price && parseFloat(formData.original_price) > parseFloat(formData.current_price || '0') && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formData.original_price} {formData.currency}
                        </span>
                      )}
                    </div>
                    {formData.original_price && parseFloat(formData.original_price) > parseFloat(formData.current_price || '0') && (
                      <Badge className="mt-2 bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
                        {Math.round((1 - parseFloat(formData.current_price || '0') / parseFloat(formData.original_price)) * 100)}% OFF
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Form Fields */}
              <div className="space-y-5">
                {/* Product Info Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">1</span>
                    Product Information
                  </h3>
                  
                  <div className="space-y-3 pl-8">
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('product.title')}</Label>
                      <Input 
                        value={formData.title} 
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="mt-1 bg-muted/30 border-muted/50 focus:border-primary/50 transition-colors"
                        placeholder="Enter product title..."
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">{t('product.description')}</Label>
                      <Textarea 
                        value={formData.description} 
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="mt-1 bg-muted/30 border-muted/50 focus:border-primary/50 transition-colors min-h-[80px] resize-none"
                        placeholder="Brief description..."
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">{t('product.productUrl')}</Label>
                      <div className="flex gap-2 mt-1">
                        <Input 
                          value={formData.product_url} 
                          onChange={e => setFormData({ ...formData, product_url: e.target.value })} 
                          placeholder="https://..."
                          className="flex-1 bg-muted/30 border-muted/50 focus:border-primary/50 transition-colors"
                        />
                        {isAmazonUrl(formData.product_url) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAutoFill}
                            disabled={isAutoFilling}
                            className="shrink-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                          >
                            {isAutoFilling ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-1" />
                                Auto-Fill
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      {isAmazonUrl(formData.product_url) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Amazon URL detected - Click Auto-Fill to load product details
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">2</span>
                    Pricing
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-3 pl-8">
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('product.currentPrice')}</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={formData.current_price} 
                        onChange={e => setFormData({ ...formData, current_price: e.target.value })}
                        className="mt-1 bg-muted/30 border-muted/50 focus:border-primary/50 transition-colors"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('product.originalPrice')}</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={formData.original_price} 
                        onChange={e => setFormData({ ...formData, original_price: e.target.value })}
                        className="mt-1 bg-muted/30 border-muted/50 focus:border-primary/50 transition-colors"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('product.currency')}</Label>
                      <Select value={formData.currency} onValueChange={value => setFormData({ ...formData, currency: value })}>
                        <SelectTrigger className="mt-1 bg-muted/30 border-muted/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map(curr => <SelectItem key={curr} value={curr}>{curr}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Classification Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">3</span>
                    Classification
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3 pl-8">
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('product.store')}</Label>
                      <Select value={formData.store} onValueChange={value => setFormData({ ...formData, store: value })}>
                        <SelectTrigger className="mt-1 bg-muted/30 border-muted/50">
                          <SelectValue placeholder="Select store" />
                        </SelectTrigger>
                        <SelectContent>
                          {getEnabledStores().map(store => <SelectItem key={store.id} value={store.name}>{store.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('product.category')}</Label>
                      <Select value={formData.category} onValueChange={value => setFormData({ ...formData, category: value })}>
                        <SelectTrigger className="mt-1 bg-muted/30 border-muted/50">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.category === 'Custom' && (
                    <div className="pl-8">
                      <Label className="text-xs text-muted-foreground">{t('product.customCategory')}</Label>
                      <Input 
                        value={formData.customCategory} 
                        onChange={e => setFormData({ ...formData, customCategory: e.target.value })} 
                        maxLength={16}
                        className="mt-1 bg-muted/30 border-muted/50 focus:border-primary/50 transition-colors"
                        placeholder="Enter custom category..."
                      />
                    </div>
                  )}

                  <div className="pl-8">
                    <Label className="text-xs text-muted-foreground">YouTube URL</Label>
                    <Input 
                      value={formData.youtube_url} 
                      onChange={e => setFormData({ ...formData, youtube_url: e.target.value })} 
                      placeholder="https://youtube.com/..."
                      className="mt-1 bg-muted/30 border-muted/50 focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative px-6 py-4 border-t border-muted/30 bg-muted/20">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
            <DialogFooter className="relative gap-2 sm:gap-2">
              <Button variant="ghost" onClick={() => setShowDialog(false)} className="hover:bg-muted/50">
                {t('cancel')}
              </Button>
              <Button 
                onClick={handleSave}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
              >
                {editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Price Update Dialog */}
      <Dialog open={showManualPriceDialog} onOpenChange={(open) => {
        if (!open && isAutoUpdating) {
          toast({
            title: 'Auto-update in progress',
            description: 'Please wait for the auto-update to complete',
            variant: 'destructive'
          });
          return;
        }
        setShowManualPriceDialog(open);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle>Manual Price Update</DialogTitle>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleAutoUpdatePrices}
                  disabled={isAutoUpdating}
                  className="bg-gradient-to-r from-primary to-primary/80"
                >
                  {isAutoUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span className="ml-2">Auto Update</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPrices} disabled={isAutoUpdating}>
                  <Download className="h-4 w-4" />
                  <span className="hidden md:inline md:ml-2">Export</span>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <label className={`cursor-pointer ${isAutoUpdating ? 'pointer-events-none opacity-50' : ''}`}>
                    <Upload className="h-4 w-4" />
                    <span className="hidden md:inline md:ml-2">Import</span>
                    <input type="file" accept=".csv" className="hidden" onChange={handleImportPrices} disabled={isAutoUpdating} />
                  </label>
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          {/* Auto-update Progress Banner */}
          {autoUpdateProgress && (
            <div className="mx-0 mb-4 p-4 rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {autoUpdateProgress.status === 'processing' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : autoUpdateProgress.status === 'completed' ? (
                    <Sparkles className="h-4 w-4 text-green-500" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-destructive" />
                  )}
                  <span className="font-medium text-sm">
                    {autoUpdateProgress.status === 'completed' 
                      ? 'Auto-update completed!' 
                      : autoUpdateProgress.status === 'error'
                      ? 'Auto-update failed'
                      : 'Auto-updating prices...'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {autoUpdateProgress.current} / {autoUpdateProgress.total}
                  </span>
                  {autoUpdateProgress.status === 'processing' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelAutoUpdate}
                      className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
              
              <Progress 
                value={autoUpdateProgress.total > 0 ? (autoUpdateProgress.current / autoUpdateProgress.total) * 100 : 0} 
                className="h-2 mb-2"
              />
              
              {autoUpdateProgress.currentProduct && autoUpdateProgress.status === 'processing' && (
                <p className="text-xs text-muted-foreground truncate mb-2">
                  Processing: {autoUpdateProgress.currentProduct}
                </p>
              )}
              
              <div className="flex gap-4 text-xs">
                <span className="text-green-600 dark:text-green-400">
                  ✓ Updated: {autoUpdateProgress.updated}
                </span>
                <span className="text-red-600 dark:text-red-400">
                  ✗ Failed: {autoUpdateProgress.failed}
                </span>
                <span className="text-muted-foreground">
                  ○ Skipped: {autoUpdateProgress.skipped}
                </span>
              </div>
              
              {autoUpdateProgress.message && autoUpdateProgress.status === 'completed' && (
                <p className="text-xs text-primary mt-2 font-medium">
                  {autoUpdateProgress.message}
                </p>
              )}
            </div>
          )}
          
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
                return (
                  <Card key={title}>
                    <CardHeader className="pb-3 mx-[5px] px-[5px]">
                      <div className="flex items-start gap-3">
                        {prods[0].image_url && <img src={prods[0].image_url} alt={title} onError={e => {
                          e.currentTarget.style.display = 'none';
                        }} className="w-16 h-16 flex-shrink-0 border-0 rounded-sm opacity-100 object-fill" />}
                        <div className="flex-1 min-w-0">
                          <a 
                            href={prods[0].product_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={`transition-colors ${clickedTitles.has(title) ? 'text-muted-foreground' : 'hover:text-primary'}`}
                            title={title}
                            onClick={() => handleTitleClick(title)}
                          >
                            <CardTitle className="text-sm flex items-center gap-1">
                              {title.length > 25 ? `${title.substring(0, 25)}...` : title}
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </CardTitle>
                          </a>
                          <div className="flex gap-1 flex-wrap mt-1 items-center">
                            <Badge variant="outline" className="text-xs">{prods[0].store}</Badge>
                            <span className="text-[10px] text-muted-foreground">Updated: {formattedDate}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2 px-[5px] mx-[2px]">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className={`flex items-center gap-1 ${scraperUpdatedIds.has(prods[0].id) ? 'text-green-500 font-medium' : ''}`}>
                          Previous: {prods[0].current_price} {prods[0].currency}
                          {scraperUpdatedIds.has(prods[0].id) && (
                            <Badge className="text-[8px] px-1 py-0 bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 animate-pulse">
                              scraped
                            </Badge>
                          )}
                        </span>
                        <span>Original: {prods[0].original_price} {prods[0].currency}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap">New Price:</Label>
                        <Input type="number" step="0.01" value={manualPrices[title] || ''} onChange={e => setManualPrices({
                          ...manualPrices,
                          [title]: e.target.value
                        })} onPaste={e => {
                          e.preventDefault();
                          const pastedText = e.clipboardData.getData('text');
                          const numbersOnly = pastedText.replace(/[^\d.]/g, '');
                          const cleanedValue = numbersOnly.replace(/(\..*)\./g, '$1');
                          setManualPrices({
                            ...manualPrices,
                            [title]: cleanedValue
                          });
                        }} className="h-8 text-sm" placeholder={prods[0].current_price.toString()} />
                        <span className="text-xs text-muted-foreground">{prods[0].currency}</span>
                      </div>
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
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Product</th>
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
                    return (
                      <tr key={title} className="hover:bg-accent/50">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {prods[0].image_url && <img src={prods[0].image_url} alt={title} className="w-12 h-12 object-cover rounded flex-shrink-0" onError={e => {
                              e.currentTarget.style.display = 'none';
                            }} />}
                            <div className="min-w-0">
                              <a 
                                href={prods[0].product_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className={`transition-colors ${clickedTitles.has(title) ? 'text-muted-foreground' : 'hover:text-primary'}`}
                                onClick={() => handleTitleClick(title)}
                              >
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
                          <div>
                            <span className={`font-semibold flex items-center gap-1 ${scraperUpdatedIds.has(prods[0].id) ? 'text-green-500' : ''}`}>
                              {prods[0].current_price} {prods[0].currency}
                              {scraperUpdatedIds.has(prods[0].id) && (
                                <Badge className="text-[9px] px-1 py-0 bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 animate-pulse">
                                  scraped
                                </Badge>
                              )}
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
                          })} onPaste={e => {
                            e.preventDefault();
                            const pastedText = e.clipboardData.getData('text');
                            const numbersOnly = pastedText.replace(/[^\d.]/g, '');
                            const cleanedValue = numbersOnly.replace(/(\..*)\./g, '$1');
                            setManualPrices({
                              ...manualPrices,
                              [title]: cleanedValue
                            });
                          }} className="h-9" placeholder={prods[0].current_price.toString()} />
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
                      </tr>
                    );
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

      {/* Progress indicator for manual price update */}
      {isSavingPrices && (
        <div className="fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 w-80">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className={`h-4 w-4 text-primary ${savePricesProgress < 100 ? 'animate-spin' : ''}`} />
            <span className="font-medium">
              {savePricesProgress < 100 ? 'Updating prices...' : 'Complete!'}
            </span>
          </div>
          <Progress value={savePricesProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {savePricesCompleted} / {savePricesTotal} products ({savePricesProgress}%)
          </p>
        </div>
      )}
    </div>
  );
}
