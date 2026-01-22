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
import { Plus, Pencil, Trash2, Upload, Phone, Settings, ImageIcon } from "lucide-react";

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

const STOCK_STATUS_OPTIONS = [
  { value: 'in_stock', label: 'In Stock', labelAr: 'متوفر' },
  { value: 'low_stock', label: 'Low Stock', labelAr: 'مخزون منخفض' },
  { value: 'out_of_stock', label: 'Out of Stock', labelAr: 'نفذ المخزون' },
];

const generateSKU = (count: number) => `S-${String(count + 1).padStart(3, '0')}`;

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
    fetchWhatsappNumber();
  }, []);

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

  const fetchWhatsappNumber = async () => {
    try {
      const { data, error } = await supabase
        .from('sticker_settings')
        .select('setting_value')
        .eq('setting_key', 'whatsapp_number')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setWhatsappNumber(data.setting_value);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp number:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `stickers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('sticker-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('sticker-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast({
        title: "Success",
        description: "Image uploaded successfully",
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

  const handleWhatsappSave = async () => {
    try {
      const { data: existing } = await supabase
        .from('sticker_settings')
        .select('id')
        .eq('setting_key', 'whatsapp_number')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('sticker_settings')
          .update({ setting_value: whatsappNumber })
          .eq('setting_key', 'whatsapp_number');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sticker_settings')
          .insert([{
            setting_key: 'whatsapp_number',
            setting_value: whatsappNumber,
            description: 'WhatsApp number for sticker orders',
          }]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "WhatsApp number saved successfully",
      });
      setSettingsDialogOpen(false);
    } catch (error) {
      console.error('Error saving WhatsApp number:', error);
      toast({
        title: "Error",
        description: "Failed to save WhatsApp number",
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
              <div className="space-y-4 pt-4">
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
                <Button onClick={handleWhatsappSave} className="w-full">
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
                        onChange={handleImageUpload}
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
    </div>
  );
}
