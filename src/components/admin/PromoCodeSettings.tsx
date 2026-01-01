import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Settings, Palette, ImagePlus, X, Loader2, Save, Eye } from "lucide-react";
import ImageCropper from "@/components/ImageCropper";

interface PromoCodeSettingsData {
  default_gradient_start: string;
  default_gradient_end: string;
  default_background_image: string;
  show_decorative_dots: boolean;
  shimmer_enabled: boolean;
}

const defaultSettings: PromoCodeSettingsData = {
  default_gradient_start: '#7c3aed',
  default_gradient_end: '#4c1d95',
  default_background_image: '',
  show_decorative_dots: true,
  shimmer_enabled: true,
};

export default function PromoCodeSettings() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [settings, setSettings] = useState<PromoCodeSettingsData>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Image upload states
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [croppedImagePreview, setCroppedImagePreview] = useState<string | null>(null);
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_settings')
        .select('*')
        .in('setting_key', [
          'promo_gradient_start',
          'promo_gradient_end',
          'promo_background_image',
          'promo_show_dots',
          'promo_shimmer_enabled'
        ]);

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsMap: Record<string, string> = {};
        data.forEach(item => {
          settingsMap[item.setting_key] = item.setting_value;
        });

        setSettings({
          default_gradient_start: settingsMap['promo_gradient_start'] || defaultSettings.default_gradient_start,
          default_gradient_end: settingsMap['promo_gradient_end'] || defaultSettings.default_gradient_end,
          default_background_image: settingsMap['promo_background_image'] || '',
          show_decorative_dots: settingsMap['promo_show_dots'] !== 'false',
          shimmer_enabled: settingsMap['promo_shimmer_enabled'] !== 'false',
        });

        if (settingsMap['promo_background_image']) {
          setCroppedImagePreview(settingsMap['promo_background_image']);
        }
      }
    } catch (error) {
      console.error('Error fetching promo settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: t('error'),
        description: 'Please select an image file',
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result as string);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (blob: Blob) => {
    const previewUrl = URL.createObjectURL(blob);
    setCroppedImageBlob(blob);
    setCroppedImagePreview(previewUrl);
  };

  const clearImage = () => {
    setCroppedImageBlob(null);
    setCroppedImagePreview(null);
    setSettings(prev => ({ ...prev, default_background_image: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (blob: Blob): Promise<string | null> => {
    const fileName = `admin/promo-default-bg-${Date.now()}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('promo-store-images')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error('Error uploading image:', error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from('promo-store-images')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      let backgroundImageUrl = settings.default_background_image;
      
      // Upload new image if one was cropped
      if (croppedImageBlob) {
        backgroundImageUrl = await uploadImage(croppedImageBlob) || '';
      }

      const settingsToSave = [
        { setting_key: 'promo_gradient_start', setting_value: settings.default_gradient_start, description: 'Default gradient start color for promo tickets' },
        { setting_key: 'promo_gradient_end', setting_value: settings.default_gradient_end, description: 'Default gradient end color for promo tickets' },
        { setting_key: 'promo_background_image', setting_value: backgroundImageUrl, description: 'Default background image for promo tickets' },
        { setting_key: 'promo_show_dots', setting_value: String(settings.show_decorative_dots), description: 'Show decorative dots on promo tickets' },
        { setting_key: 'promo_shimmer_enabled', setting_value: String(settings.shimmer_enabled), description: 'Enable shimmer animation on promo tickets' },
      ];

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('ad_settings')
          .upsert(setting, { onConflict: 'setting_key' });

        if (error) throw error;
      }

      toast({
        title: 'Settings saved',
        description: 'Promo code appearance settings have been updated.',
      });

      setCroppedImageBlob(null);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || 'Failed to save settings',
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Promo Ticket Appearance
          </CardTitle>
          <CardDescription>
            Customize the default appearance of promo code tickets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Gradient Colors */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Default Gradient Colors
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Start Color</Label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer"
                    style={{ backgroundColor: settings.default_gradient_start }}
                    onClick={() => document.getElementById('gradient-start')?.click()}
                  />
                  <Input
                    id="gradient-start"
                    type="color"
                    value={settings.default_gradient_start}
                    onChange={(e) => setSettings(prev => ({ ...prev, default_gradient_start: e.target.value }))}
                    className="w-20 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={settings.default_gradient_start}
                    onChange={(e) => setSettings(prev => ({ ...prev, default_gradient_start: e.target.value }))}
                    className="flex-1 font-mono text-sm"
                    placeholder="#7c3aed"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">End Color</Label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer"
                    style={{ backgroundColor: settings.default_gradient_end }}
                    onClick={() => document.getElementById('gradient-end')?.click()}
                  />
                  <Input
                    id="gradient-end"
                    type="color"
                    value={settings.default_gradient_end}
                    onChange={(e) => setSettings(prev => ({ ...prev, default_gradient_end: e.target.value }))}
                    className="w-20 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={settings.default_gradient_end}
                    onChange={(e) => setSettings(prev => ({ ...prev, default_gradient_end: e.target.value }))}
                    className="flex-1 font-mono text-sm"
                    placeholder="#4c1d95"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Background Image */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ImagePlus className="h-4 w-4" />
              Default Background Image
            </Label>
            <div className="flex items-center gap-4">
              {croppedImagePreview ? (
                <div className="relative">
                  <img 
                    src={croppedImagePreview} 
                    alt="Background preview" 
                    className="w-24 h-16 object-cover rounded-lg border-2 border-primary/30"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={clearImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-16 w-24 flex flex-col items-center justify-center gap-1 border-dashed"
                >
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add</span>
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <p className="text-sm text-muted-foreground flex-1">
                This image will be used as the default background for promo tickets without a custom store image.
              </p>
            </div>
          </div>

          {/* Toggle Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label>Decorative Dots</Label>
                <p className="text-sm text-muted-foreground">Show small decorative dots on ticket corners</p>
              </div>
              <Switch
                checked={settings.show_decorative_dots}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, show_decorative_dots: checked }))}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label>Shimmer Animation</Label>
                <p className="text-sm text-muted-foreground">Enable shimmer effect when tickets first appear</p>
              </div>
              <Switch
                checked={settings.shimmer_enabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, shimmer_enabled: checked }))}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </Label>
            <div 
              className="relative h-32 rounded-xl overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${settings.default_gradient_start}, ${settings.default_gradient_end})`
              }}
            >
              {croppedImagePreview && (
                <img 
                  src={croppedImagePreview} 
                  alt="Preview" 
                  className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
              )}
              {/* Perforated edges */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-background rounded-full" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-background rounded-full" />
              <div className="absolute left-6 right-6 top-1/2 border-t-2 border-dashed border-white/20" />
              
              {/* Decorative dots */}
              {settings.show_decorative_dots && (
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full" />
                  <div className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full" />
                  <div className="absolute bottom-4 left-4 w-2 h-2 bg-white rounded-full" />
                  <div className="absolute bottom-4 right-4 w-2 h-2 bg-white rounded-full" />
                </div>
              )}
              
              <div className="relative z-10 p-4 flex items-center justify-center h-full">
                <div className="text-center text-white">
                  <p className="text-xs opacity-70 uppercase tracking-wider">Sample Store</p>
                  <p className="font-mono font-bold text-2xl tracking-wider">SAVE20</p>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Image Cropper */}
      {selectedImageSrc && (
        <ImageCropper
          isOpen={isCropperOpen}
          onClose={() => {
            setIsCropperOpen(false);
            setSelectedImageSrc(null);
          }}
          imageSrc={selectedImageSrc}
          onCropComplete={handleCropComplete}
          aspectRatio={16/9}
        />
      )}
    </div>
  );
}
