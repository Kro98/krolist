import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Plus, Pencil, Trash2, Upload, Phone, Settings, ImageIcon, Loader2, Maximize2, Shrink } from "lucide-react";
import { getExtensionFromMimeType, formatFileSize, compressImage } from "@/lib/imageCompression";
import { ImageCompressionPreview } from "@/components/ImageCompressionPreview";

interface Sticker {
  id: string;
  name: string;
  name_ar: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  stock_status: string;
  is_featured: boolean | null;
  is_new: boolean | null;
  is_active: boolean | null;
  display_order: number | null;
  sku?: string;
}

interface CompressionSettings {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

const STOCK_STATUS_OPTIONS = [
  { value: 'in_stock', label: 'In Stock', labelAr: 'متوفر' },
  { value: 'low_stock', label: 'Low Stock', labelAr: 'مخزون منخفض' },
  { value: 'out_of_stock', label: 'Out of Stock', labelAr: 'نفذ المخزون' },
];

const generateSKU = (count: number) => `S-${String(count + 1).padStart(3, '0')}`;

const IMAGE_QUALITY_OPTIONS = [
  { value: '100', label: 'Original (100%)', description: 'Full quality, larger file size' },
  { value: '85', label: 'High (85%)', description: 'Recommended - good balance' },
  { value: '70', label: 'Medium (70%)', description: 'Faster loading' },
  { value: '50', label: 'Low (50%)', description: 'Fastest loading, lower quality' },
];

const MAX_DIMENSION_OPTIONS = [
  { value: 800, label: '800px', description: 'Small - fastest loading' },
  { value: 1200, label: '1200px', description: 'Medium - recommended' },
  { value: 1600, label: '1600px', description: 'Large - high quality' },
  { value: 2000, label: '2000px', description: 'Extra large - best quality' },
];

export default function StickersManager() {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [editingSticker, setEditingSticker] = useState<Sticker | null>(null);
  const [uploading, setUploading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [imageQuality, setImageQuality] = useState('85');
  
  // Compression settings
  const [compressionMaxWidth, setCompressionMaxWidth] = useState(1200);
  const [compressionMaxHeight, setCompressionMaxHeight] = useState(1200);
  const [compressionQuality, setCompressionQuality] = useState(85);
  
  // Compression preview state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressionPreviewOpen, setCompressionPreviewOpen] = useState(false);
  const [targetSizeKB, setTargetSizeKB] = useState<number>(100);
  const [compressing, setCompressing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    price: 0,
    currency: 'SAR',
    image_url: '',
    stock_status: 'in_stock',
    is_featured: false,
    is_new: false,
    is_active: true,
    sku: '',
  });

  useEffect(() => {
    fetchStickers();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('sticker_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['whatsapp_number', 'image_quality', 'compression_max_width', 'compression_max_height', 'compression_quality']);

      if (error) throw error;
      
      data?.forEach(setting => {
        if (setting.setting_key === 'whatsapp_number') {
          setWhatsappNumber(setting.setting_value);
        } else if (setting.setting_key === 'image_quality') {
          setImageQuality(setting.setting_value);
        } else if (setting.setting_key === 'compression_max_width') {
          setCompressionMaxWidth(parseInt(setting.setting_value) || 1200);
        } else if (setting.setting_key === 'compression_max_height') {
          setCompressionMaxHeight(parseInt(setting.setting_value) || 1200);
        } else if (setting.setting_key === 'compression_quality') {
          setCompressionQuality(parseInt(setting.setting_value) || 85);
        }
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchStickers = async () => {
    try {
      const { data, error } = await supabase
        .from('stickers')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setStickers(data || []);
    } catch (error) {
      console.error('Error fetching stickers:', error);
      toast({
        title: "Error",
        description: "Failed to load stickers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Open compression preview dialog
    setSelectedFile(file);
    setCompressionPreviewOpen(true);
    
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  const handleCompressionConfirm = async (
    compressedBlob: Blob, 
    stats: { originalSize: number; compressedSize: number }
  ) => {
    setCompressionPreviewOpen(false);
    setSelectedFile(null);
    setUploading(true);
    
    try {
      // Get appropriate file extension
      const fileExt = getExtensionFromMimeType(compressedBlob.type);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `stickers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('sticker-images')
        .upload(filePath, compressedBlob, {
          contentType: compressedBlob.type,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('sticker-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      
      // Show compression stats
      const savedPercent = Math.round((1 - stats.compressedSize / stats.originalSize) * 100);
      toast({
        title: "Image Uploaded & Compressed",
        description: `${formatFileSize(stats.originalSize)} → ${formatFileSize(stats.compressedSize)} (${savedPercent > 0 ? `-${savedPercent}%` : 'optimized'})`,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCompressionCancel = () => {
    setCompressionPreviewOpen(false);
    setSelectedFile(null);
  };

  const handleCompressExisting = async () => {
    if (!formData.image_url) return;
    setCompressing(true);

    try {
      // Fetch the existing image
      const response = await fetch(formData.image_url);
      const blob = await response.blob();
      const originalSize = blob.size;
      const file = new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' });

      const targetBytes = targetSizeKB * 1024;

      // Binary search for the right quality
      let lo = 0.05, hi = 1.0, bestBlob: Blob = blob;
      for (let i = 0; i < 8; i++) {
        const mid = (lo + hi) / 2;
        const compressed = await compressImage(file, 2000, 2000, mid);
        bestBlob = compressed;
        if (compressed.size > targetBytes) {
          hi = mid;
        } else {
          lo = mid;
        }
      }

      // If still too large, reduce dimensions too
      if (bestBlob.size > targetBytes * 1.1) {
        const ratio = Math.sqrt(targetBytes / bestBlob.size);
        const maxDim = Math.round(2000 * ratio);
        bestBlob = await compressImage(file, maxDim, maxDim, lo);
      }

      // Upload the compressed image
      const fileExt = getExtensionFromMimeType(bestBlob.type);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `stickers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('sticker-images')
        .upload(filePath, bestBlob, { contentType: bestBlob.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('sticker-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));

      const savedPercent = Math.round((1 - bestBlob.size / originalSize) * 100);
      toast({
        title: "Image Compressed",
        description: `${formatFileSize(originalSize)} → ${formatFileSize(bestBlob.size)} (${savedPercent > 0 ? `-${savedPercent}%` : 'optimized'})`,
      });
    } catch (error) {
      console.error('Error compressing image:', error);
      toast({
        title: "Error",
        description: "Failed to compress image",
        variant: "destructive",
      });
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const stickerData = {
        name: formData.name,
        name_ar: formData.name_ar || null,
        price: formData.price,
        currency: formData.currency,
        image_url: formData.image_url || null,
        stock_status: formData.stock_status,
        is_featured: formData.is_featured,
        is_new: formData.is_new,
        is_active: formData.is_active,
        display_order: stickers.length,
      };

      if (editingSticker) {
        const { error } = await supabase
          .from('stickers')
          .update(stickerData)
          .eq('id', editingSticker.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Sticker updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('stickers')
          .insert([stickerData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Sticker created successfully",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchStickers();
    } catch (error) {
      console.error('Error saving sticker:', error);
      toast({
        title: "Error",
        description: "Failed to save sticker",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sticker?')) return;

    try {
      const { error } = await supabase
        .from('stickers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Sticker deleted successfully",
      });
      fetchStickers();
    } catch (error) {
      console.error('Error deleting sticker:', error);
      toast({
        title: "Error",
        description: "Failed to delete sticker",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (sticker: Sticker, index: number) => {
    setEditingSticker(sticker);
    setFormData({
      name: sticker.name,
      name_ar: sticker.name_ar || '',
      price: sticker.price,
      currency: sticker.currency,
      image_url: sticker.image_url || '',
      stock_status: sticker.stock_status,
      is_featured: sticker.is_featured || false,
      is_new: sticker.is_new || false,
      is_active: sticker.is_active ?? true,
      sku: generateSKU(index),
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingSticker(null);
    setFormData({
      name: '',
      name_ar: '',
      price: 0,
      currency: 'SAR',
      image_url: '',
      stock_status: 'in_stock',
      is_featured: false,
      is_new: false,
      is_active: true,
      sku: generateSKU(stickers.length),
    });
  };

  const handleSettingsSave = async () => {
    try {
      // Helper to upsert a setting
      const upsertSetting = async (key: string, value: string, description: string) => {
        const { data: existing } = await supabase
          .from('sticker_settings')
          .select('id')
          .eq('setting_key', key)
          .single();

        if (existing) {
          await supabase
            .from('sticker_settings')
            .update({ setting_value: value })
            .eq('setting_key', key);
        } else {
          await supabase
            .from('sticker_settings')
            .insert([{ setting_key: key, setting_value: value, description }]);
        }
      };

      // Save all settings
      await Promise.all([
        upsertSetting('whatsapp_number', whatsappNumber, 'WhatsApp number for sticker orders'),
        upsertSetting('image_quality', imageQuality, 'Image quality for sticker display (1-100)'),
        upsertSetting('compression_max_width', compressionMaxWidth.toString(), 'Max width for image compression during upload'),
        upsertSetting('compression_max_height', compressionMaxHeight.toString(), 'Max height for image compression during upload'),
        upsertSetting('compression_quality', compressionQuality.toString(), 'Quality percentage for image compression during upload'),
      ]);

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
      setSettingsDialogOpen(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const getStockBadge = (status: string) => {
    const statusOption = STOCK_STATUS_OPTIONS.find(opt => opt.value === status);
    const label = language === 'ar' ? statusOption?.labelAr : statusOption?.label;
    
    switch (status) {
      case 'in_stock':
        return <Badge className="bg-green-500">{label}</Badge>;
      case 'low_stock':
        return <Badge className="bg-yellow-500">{label}</Badge>;
      case 'out_of_stock':
        return <Badge className="bg-red-500">{label}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Stickers Manager</h2>
          <p className="text-muted-foreground">Manage your stickers inventory</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sticker Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    WhatsApp Number
                  </Label>
                  <Input
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+966xxxxxxxxx"
                  />
                  <p className="text-sm text-muted-foreground">
                    Include country code (e.g., +966 for Saudi Arabia)
                  </p>
                </div>

                {/* Display Quality Settings */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Display Quality (Frontend)
                  </Label>
                  <Select value={imageQuality} onValueChange={setImageQuality}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {IMAGE_QUALITY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Affects how stickers display on the page for visitors.
                  </p>
                </div>

                {/* Upload Compression Settings */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Maximize2 className="h-4 w-4" />
                    <Label className="font-medium">Upload Compression Defaults</Label>
                  </div>
                  <p className="text-xs text-muted-foreground -mt-2">
                    Default settings for image compression during upload. Can be adjusted per-upload.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Max Width</Label>
                      <Select 
                        value={compressionMaxWidth.toString()} 
                        onValueChange={(v) => setCompressionMaxWidth(parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          {MAX_DIMENSION_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value.toString()}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Max Height</Label>
                      <Select 
                        value={compressionMaxHeight.toString()} 
                        onValueChange={(v) => setCompressionMaxHeight(parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          {MAX_DIMENSION_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value.toString()}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Compression Quality</Label>
                      <span className="text-sm font-mono">{compressionQuality}%</span>
                    </div>
                    <Slider
                      value={[compressionQuality]}
                      onValueChange={([value]) => setCompressionQuality(value)}
                      min={10}
                      max={100}
                      step={5}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Smaller file</span>
                      <span>Higher quality</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg border">
                  <p className="text-sm font-medium mb-1">🔒 Watermark Protection</p>
                  <p className="text-xs text-muted-foreground">
                    When users open sticker images in a new tab, they'll see a "KROLIST" watermark overlay to protect your designs.
                  </p>
                </div>

                <Button onClick={handleSettingsSave} className="w-full">
                  Save Settings
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Sticker
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSticker ? 'Edit Sticker' : 'Add New Sticker'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                {/* Auto-generated SKU display */}
                <div className="bg-muted/50 p-3 rounded-lg border">
                  <Label className="text-xs text-muted-foreground">SKU (Auto-generated)</Label>
                  <p className="font-mono text-lg font-bold">{editingSticker ? formData.sku : generateSKU(stickers.length)}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name (English) *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name (Arabic)</Label>
                    <Input
                      value={formData.name_ar}
                      onChange={(e) => setFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAR">SAR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Stock Status</Label>
                  <Select value={formData.stock_status} onValueChange={(value) => setFormData(prev => ({ ...prev, stock_status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STOCK_STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {language === 'ar' ? opt.labelAr : opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Image</Label>
                  <div className="flex items-center gap-4">
                    {formData.image_url && (
                      <img src={formData.image_url} alt="Preview" className="w-16 h-16 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        disabled={uploading}
                        className="hidden"
                        id="image-upload"
                      />
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted">
                          <Upload className="h-4 w-4" />
                          {uploading ? 'Uploading...' : 'Upload Image'}
                        </div>
                      </Label>
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Or paste image URL"
                        value={formData.image_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Compress existing image to target size */}
                {formData.image_url && (
                  <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <Shrink className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Compress to Target Size</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={10}
                        max={5000}
                        value={targetSizeKB}
                        onChange={(e) => setTargetSizeKB(parseInt(e.target.value) || 100)}
                        className="w-28 font-mono"
                      />
                      <span className="text-sm text-muted-foreground">KB</span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleCompressExisting}
                        disabled={compressing}
                      >
                        {compressing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Shrink className="h-4 w-4 mr-1" />}
                        {compressing ? 'Compressing...' : 'Compress'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter target file size in KB. The image will be re-compressed to approximately this size.
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label>Active</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                    />
                    <Label>Featured</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_new}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_new: checked }))}
                    />
                    <Label>New</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSticker ? 'Update Sticker' : 'Create Sticker'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stickers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No stickers yet. Add your first sticker!
                    </TableCell>
                  </TableRow>
                ) : (
                  stickers.map((sticker, index) => (
                    <TableRow key={sticker.id}>
                      <TableCell>
                        {sticker.image_url ? (
                          <img src={sticker.image_url} alt={sticker.name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm font-bold">{generateSKU(index)}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sticker.name}</div>
                          {sticker.name_ar && (
                            <div className="text-sm text-muted-foreground" dir="rtl">{sticker.name_ar}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{sticker.price} {sticker.currency}</TableCell>
                      <TableCell>{getStockBadge(sticker.stock_status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {sticker.is_active ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 border-red-600">Inactive</Badge>
                          )}
                          {sticker.is_featured && <Badge className="bg-primary">Featured</Badge>}
                          {sticker.is_new && <Badge className="bg-blue-500">New</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(sticker, index)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(sticker.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Compression Preview Dialog */}
      <ImageCompressionPreview
        file={selectedFile}
        open={compressionPreviewOpen}
        onOpenChange={setCompressionPreviewOpen}
        onConfirm={handleCompressionConfirm}
        onCancel={handleCompressionCancel}
        defaultSettings={{
          maxWidth: compressionMaxWidth,
          maxHeight: compressionMaxHeight,
          quality: compressionQuality,
        }}
      />
    </div>
  );
}
