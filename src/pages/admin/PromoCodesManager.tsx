import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Copy, GripVertical, ImagePlus, X, Loader2, Palette, Save, Calendar, Check, Type, Store } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { STORES } from "@/config/stores";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { FunnyLoadingText } from "@/components/FunnyLoadingText";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import ImageCropper from "@/components/ImageCropper";

interface KrolistPromoCode {
  id: string;
  code: string;
  store: string;
  description: string;
  expires: string;
  used: boolean;
  reusable: boolean;
  is_krolist: boolean;
  custom_shop_name?: string;
  custom_icon_url?: string;
  card_color?: string;
  card_background?: string;
  display_order?: number;
}

const predefinedColors = [
  '#7c3aed', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4',
  '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308',
  '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#d946ef',
  '#8b5cf6', '#1e293b', '#374151', '#525252', '#78716c'
];

export default function PromoCodesManager() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [promoCodes, setPromoCodes] = useState<KrolistPromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    store: '',
    custom_shop_name: '',
    description: '',
    expires: '',
    reusable: true,
    card_color: '#7c3aed',
    custom_icon_url: '',
    card_background: ''
  });

  // Image upload states
  const [iconImageSrc, setIconImageSrc] = useState<string | null>(null);
  const [isIconCropperOpen, setIsIconCropperOpen] = useState(false);
  const [iconBlob, setIconBlob] = useState<Blob | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  const [bgImageSrc, setBgImageSrc] = useState<string | null>(null);
  const [isBgCropperOpen, setIsBgCropperOpen] = useState(false);
  const [bgBlob, setBgBlob] = useState<Blob | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchKrolistPromoCodes();
  }, []);

  const fetchKrolistPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('is_krolist', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error('Error fetching Krolist promo codes:', error);
      toast({
        title: t('error'),
        description: t('admin.failedToLoadPromoCodes'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'icon' | 'background') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: t('error'), description: 'Please select an image file', variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (type === 'icon') {
        setIconImageSrc(reader.result as string);
        setIsIconCropperOpen(true);
      } else {
        setBgImageSrc(reader.result as string);
        setIsBgCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (blob: Blob, type: 'icon' | 'background') => {
    const previewUrl = URL.createObjectURL(blob);
    if (type === 'icon') {
      setIconBlob(blob);
      setIconPreview(previewUrl);
    } else {
      setBgBlob(blob);
      setBgPreview(previewUrl);
    }
  };

  const uploadImage = async (blob: Blob, folder: string): Promise<string> => {
    const fileName = `${folder}/${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from('promo-code-images')
      .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

    if (error) throw error;
    const { data: publicUrlData } = supabase.storage.from('promo-code-images').getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  };

  const resetForm = () => {
    setFormData({
      code: '',
      store: '',
      custom_shop_name: '',
      description: '',
      expires: '',
      reusable: true,
      card_color: '#7c3aed',
      custom_icon_url: '',
      card_background: ''
    });
    setIconBlob(null);
    setIconPreview(null);
    setBgBlob(null);
    setBgPreview(null);
    setEditingId(null);
  };

  const handleOpenEditDialog = (code: KrolistPromoCode) => {
    setEditingId(code.id);
    setFormData({
      code: code.code,
      store: code.store,
      custom_shop_name: code.custom_shop_name || '',
      description: code.description,
      expires: code.expires,
      reusable: code.reusable,
      card_color: code.card_color || '#7c3aed',
      custom_icon_url: code.custom_icon_url || '',
      card_background: code.card_background || ''
    });
    setIconPreview(code.custom_icon_url || null);
    setBgPreview(code.card_background || null);
    setShowAddDialog(true);
  };

  const handleSave = async () => {
    if (!user) {
      toast({ title: t('error'), description: t('admin.mustBeLoggedIn'), variant: "destructive" });
      return;
    }

    if (!formData.code || (!formData.store && !formData.custom_shop_name)) {
      toast({ title: t('error'), description: 'Please fill in required fields', variant: "destructive" });
      return;
    }

    setIsSaving(true);

    try {
      let iconUrl = formData.custom_icon_url;
      let bgUrl = formData.card_background;

      if (iconBlob) {
        iconUrl = await uploadImage(iconBlob, 'icons');
      }
      if (bgBlob) {
        bgUrl = await uploadImage(bgBlob, 'backgrounds');
      }

      const promoData = {
        code: formData.code,
        store: formData.custom_shop_name || formData.store || 'Custom',
        custom_shop_name: formData.custom_shop_name || null,
        description: formData.description,
        store_url: '',
        expires: formData.expires || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reusable: formData.reusable,
        is_krolist: true,
        user_id: user.id,
        custom_icon_url: iconUrl || null,
        card_color: formData.card_color || '#7c3aed',
        card_background: bgUrl || null,
        display_order: editingId ? undefined : promoCodes.length
      };

      if (editingId) {
        const { error } = await supabase.from('promo_codes').update(promoData).eq('id', editingId);
        if (error) throw error;
        toast({ title: 'Promo code updated!' });
      } else {
        const { error } = await supabase.from('promo_codes').insert([promoData]);
        if (error) throw error;
        
        await supabase.from('global_notifications').insert({
          type: 'promo_code',
          title: 'New Promo Code Added!',
          title_ar: 'تمت إضافة كود خصم جديد!',
          message: `${formData.custom_shop_name || formData.store}: ${formData.code}`,
          message_ar: `${formData.custom_shop_name || formData.store}: ${formData.code}`,
          data: { store: formData.custom_shop_name || formData.store, code: formData.code }
        });
        
        toast({ title: 'Promo code added!' });
      }

      setShowAddDialog(false);
      resetForm();
      fetchKrolistPromoCodes();
    } catch (error: any) {
      toast({ title: t('error'), description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promo code?')) return;

    try {
      const { error } = await supabase.from('promo_codes').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Promo code deleted!' });
      fetchKrolistPromoCodes();
    } catch (error: any) {
      toast({ title: t('error'), description: error.message, variant: "destructive" });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Code copied!' });
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(promoCodes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setPromoCodes(items);

    // Update display orders in database
    const updates = items.map((item, index) => ({
      id: item.id,
      display_order: index
    }));

    for (const update of updates) {
      await supabase.from('promo_codes').update({ display_order: update.display_order }).eq('id', update.id);
    }
  };

  const isExpired = (expiryDate: string) => new Date(expiryDate) < new Date();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <FunnyLoadingText />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/20 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" />
              Krolist Promo Codes
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Manage promotional codes with custom shops, colors & backgrounds
            </p>
          </div>
          <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Promo Code
          </Button>
        </div>
        
        {/* Stats */}
        <div className="relative grid grid-cols-3 gap-4 mt-6">
          <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/50">
            <p className="text-2xl font-bold text-primary">{promoCodes.length}</p>
            <p className="text-xs text-muted-foreground">Total Codes</p>
          </div>
          <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/50">
            <p className="text-2xl font-bold text-emerald-500">{promoCodes.filter(p => !isExpired(p.expires)).length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/50">
            <p className="text-2xl font-bold text-destructive">{promoCodes.filter(p => isExpired(p.expires)).length}</p>
            <p className="text-xs text-muted-foreground">Expired</p>
          </div>
        </div>
      </div>

      {/* Drag & Drop Promo List */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="promo-codes">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {promoCodes.map((promo, index) => (
                <Draggable key={promo.id} draggableId={promo.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`group relative ${snapshot.isDragging ? 'z-50' : ''}`}
                    >
                      <Card 
                        className={`relative overflow-hidden transition-all duration-300 ${
                          isExpired(promo.expires) ? 'opacity-60' : ''
                        } ${snapshot.isDragging ? 'shadow-2xl scale-105 rotate-1' : 'hover:shadow-lg'}`}
                      >
                        {/* Color/Background Preview */}
                        <div 
                          className="absolute inset-0 opacity-20"
                          style={{
                            background: promo.card_background 
                              ? `url(${promo.card_background}) center/cover`
                              : `linear-gradient(135deg, ${promo.card_color || '#7c3aed'}, ${promo.card_color || '#7c3aed'}88)`
                          }}
                        />
                        
                        <CardContent className="relative p-4">
                          {/* Drag Handle & Edit Button */}
                          <div className="flex items-center justify-between mb-3">
                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-muted/50">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleOpenEditDialog(promo)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                onClick={() => handleDelete(promo.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Store Icon & Name */}
                          <div className="flex items-center gap-3 mb-3">
                            {promo.custom_icon_url ? (
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted/50 ring-2 ring-border">
                                <img src={promo.custom_icon_url} alt={promo.store} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                                style={{ backgroundColor: promo.card_color || '#7c3aed' }}
                              >
                                {(promo.custom_shop_name || promo.store).charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{promo.custom_shop_name || promo.store}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs px-1.5 py-0">
                                  {promo.code}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => handleCopyCode(promo.code)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {promo.description || 'No description'}
                          </p>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(promo.expires).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2">
                              {promo.reusable && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Reusable</Badge>
                              )}
                              {isExpired(promo.expires) ? (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Expired</Badge>
                              ) : (
                                <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-emerald-500">Active</Badge>
                              )}
                            </div>
                          </div>

                          {/* Color indicator */}
                          <div 
                            className="absolute bottom-0 left-0 right-0 h-1"
                            style={{ backgroundColor: promo.card_color || '#7c3aed' }}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {promoCodes.length === 0 && (
        <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-muted-foreground/20">
          <Store className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No promo codes yet</h3>
          <p className="text-sm text-muted-foreground/70 mt-1">Click "Add Promo Code" to create your first one</p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) resetForm(); setShowAddDialog(open); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingId ? 'Edit Promo Code' : 'Add Promo Code'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Preview Card */}
            <div className="relative overflow-hidden rounded-xl p-4" style={{
              background: bgPreview 
                ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${bgPreview}) center/cover`
                : `linear-gradient(135deg, ${formData.card_color}, ${formData.card_color}88)`
            }}>
              <div className="flex items-center gap-3">
                {iconPreview ? (
                  <img src={iconPreview} alt="Icon" className="w-12 h-12 rounded-lg object-cover ring-2 ring-white/30" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-xl">
                    {(formData.custom_shop_name || formData.store || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-white">
                  <p className="text-xs opacity-70 uppercase tracking-wider">
                    {formData.custom_shop_name || formData.store || 'Store Name'}
                  </p>
                  <p className="font-mono font-bold text-xl tracking-wider">
                    {formData.code || 'CODE'}
                  </p>
                </div>
              </div>
            </div>

            {/* Code */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Promo Code *
              </Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SAVE20"
                className="font-mono"
              />
            </div>

            {/* Shop Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Shop Name *
              </Label>
              <Input
                value={formData.custom_shop_name}
                onChange={(e) => setFormData({ ...formData, custom_shop_name: e.target.value })}
                placeholder="Enter custom shop name"
              />
              <p className="text-xs text-muted-foreground">Or select from existing:</p>
              <div className="flex flex-wrap gap-1">
                {Object.values(STORES).slice(0, 8).map(store => (
                  <Button
                    key={store.id}
                    type="button"
                    variant={formData.store === store.name ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setFormData({ ...formData, store: store.name, custom_shop_name: '' })}
                  >
                    {store.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="10% off on all products"
              />
            </div>

            {/* Expiry & Reusable */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Expiry Date
                </Label>
                <Input
                  type="date"
                  value={formData.expires}
                  onChange={(e) => setFormData({ ...formData, expires: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Reusable</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={formData.reusable}
                    onCheckedChange={(checked) => setFormData({ ...formData, reusable: checked })}
                  />
                  <span className="text-sm text-muted-foreground">{formData.reusable ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Card Color
              </Label>
              <div className="flex flex-wrap gap-2">
                {predefinedColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-lg transition-all ${
                      formData.card_color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, card_color: color })}
                  >
                    {formData.card_color === color && <Check className="h-4 w-4 text-white mx-auto" />}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  type="color"
                  value={formData.card_color}
                  onChange={(e) => setFormData({ ...formData, card_color: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.card_color}
                  onChange={(e) => setFormData({ ...formData, card_color: e.target.value })}
                  className="flex-1 font-mono text-sm"
                  placeholder="#7c3aed"
                />
              </div>
            </div>

            {/* Custom Icon Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4" />
                Custom Icon/Logo
              </Label>
              <div className="flex items-center gap-3">
                {iconPreview ? (
                  <div className="relative">
                    <img src={iconPreview} alt="Icon preview" className="w-16 h-16 rounded-lg object-cover ring-2 ring-border" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => { setIconBlob(null); setIconPreview(null); setFormData({ ...formData, custom_icon_url: '' }); }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-16 w-16 flex flex-col items-center justify-center border-dashed"
                    onClick={() => iconInputRef.current?.click()}
                  >
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-1">Icon</span>
                  </Button>
                )}
                <input ref={iconInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e, 'icon')} />
                <p className="text-xs text-muted-foreground flex-1">Upload a square logo or icon for this promo code</p>
              </div>
            </div>

            {/* Background Image Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4" />
                Background Image
              </Label>
              <div className="flex items-center gap-3">
                {bgPreview ? (
                  <div className="relative">
                    <img src={bgPreview} alt="Background preview" className="w-24 h-16 rounded-lg object-cover ring-2 ring-border" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => { setBgBlob(null); setBgPreview(null); setFormData({ ...formData, card_background: '' }); }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-16 w-24 flex flex-col items-center justify-center border-dashed"
                    onClick={() => bgInputRef.current?.click()}
                  >
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-1">Background</span>
                  </Button>
                )}
                <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e, 'background')} />
                <p className="text-xs text-muted-foreground flex-1">Optional background image for the card</p>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingId ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Croppers */}
      {iconImageSrc && (
        <ImageCropper
          isOpen={isIconCropperOpen}
          onClose={() => { setIsIconCropperOpen(false); setIconImageSrc(null); }}
          imageSrc={iconImageSrc}
          onCropComplete={(blob) => handleCropComplete(blob, 'icon')}
          aspectRatio={1}
        />
      )}
      {bgImageSrc && (
        <ImageCropper
          isOpen={isBgCropperOpen}
          onClose={() => { setIsBgCropperOpen(false); setBgImageSrc(null); }}
          imageSrc={bgImageSrc}
          onCropComplete={(blob) => handleCropComplete(blob, 'background')}
          aspectRatio={16/9}
        />
      )}
    </div>
  );
}
