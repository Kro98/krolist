import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Gift, Plus, Edit, RotateCcw, ChevronDown, ChevronUp, ImagePlus, X, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AVAILABLE_SHOPS } from "@/lib/affiliateLinks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { formatDistanceToNow } from "date-fns";
import { useAdTrigger } from "@/contexts/AdTriggerContext";
import { useLanguage } from "@/contexts/LanguageContext";
import PromoTicketCard from "@/components/PromoTicketCard";
import ImageCropper from "@/components/ImageCropper";
import confetti from "canvas-confetti";
import { usePromoSettings } from "@/hooks/usePromoSettings";

interface PromoCode {
  id: string;
  code: string;
  store: string;
  description: string;
  expires: string;
  used: boolean;
  reusable: boolean;
  custom_image_url?: string;
}

export default function PromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedShop, setSelectedShop] = useState<string>("");
  const [customShopName, setCustomShopName] = useState("");
  const [newExpiresDate, setNewExpiresDate] = useState("");
  const [newIsReusable, setNewIsReusable] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const { triggerPromoCopy } = useAdTrigger();
  const { t, language } = useLanguage();
  const { settings: promoSettings } = usePromoSettings();
  
  // Image upload states
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
  const [croppedImagePreview, setCroppedImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Edit image states
  const [editSelectedImageSrc, setEditSelectedImageSrc] = useState<string | null>(null);
  const [isEditCropperOpen, setIsEditCropperOpen] = useState(false);
  const [editCroppedImageBlob, setEditCroppedImageBlob] = useState<Blob | null>(null);
  const [editCroppedImagePreview, setEditCroppedImagePreview] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  const autoplayPlugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  // Allow guests to view but show message that they can't create promo codes

  const [krolistPromoCodes, setKrolistPromoCodes] = useState<PromoCode[]>([]);
  const [isAddFormVisible, setIsAddFormVisible] = useState(true);

  // Fetch promo codes from database
  useEffect(() => {
    // Guests can view Krolist promo codes
    fetchKrolistPromoCodes();
    
    // Only fetch user promo codes if logged in
    if (user) {
      fetchPromoCodes();
    }
  }, [user]);

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('is_krolist', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setPromoCodes(data.map(item => ({
          id: item.id,
          code: item.code,
          store: item.store,
          description: item.description,
          expires: item.expires,
          used: item.used,
          reusable: item.reusable,
          custom_image_url: item.custom_image_url || undefined
        })));
      }
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast({
        title: t('error'),
        description: t('promo.failedToLoad'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKrolistPromoCodes = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('is_krolist', true)
        .gte('expires', today)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setKrolistPromoCodes(data.map(item => ({
          id: item.id,
          code: item.code,
          store: item.store,
          description: item.description,
          expires: item.expires,
          used: item.used,
          reusable: item.reusable,
          custom_image_url: item.custom_image_url || undefined
        })));
      }
    } catch (error) {
      console.error('Error fetching Krolist promo codes:', error);
    }
  };

  // Image handling functions
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: t('error'),
        description: t('promo.invalidImageType') || 'Please select an image file',
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (isEdit) {
        setEditSelectedImageSrc(reader.result as string);
        setIsEditCropperOpen(true);
      } else {
        setSelectedImageSrc(reader.result as string);
        setIsCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (blob: Blob, isEdit = false) => {
    const previewUrl = URL.createObjectURL(blob);
    if (isEdit) {
      setEditCroppedImageBlob(blob);
      setEditCroppedImagePreview(previewUrl);
    } else {
      setCroppedImageBlob(blob);
      setCroppedImagePreview(previewUrl);
    }
  };

  const clearImage = (isEdit = false) => {
    if (isEdit) {
      setEditCroppedImageBlob(null);
      setEditCroppedImagePreview(null);
      setEditSelectedImageSrc(null);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    } else {
      setCroppedImageBlob(null);
      setCroppedImagePreview(null);
      setSelectedImageSrc(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (blob: Blob, userId: string): Promise<string | null> => {
    const fileName = `${userId}/${Date.now()}-store-image.jpg`;
    
    const { data, error } = await supabase.storage
      .from('promo-store-images')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: false
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

  const getTimeUntilExpiration = (expiresDate: string) => {
    try {
      const expiry = new Date(expiresDate);
      const now = new Date();
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft < 0) return { text: t('promo.expired'), variant: 'destructive' as const };
      if (daysLeft === 0) return { text: t('promo.expiresToday'), variant: 'destructive' as const };
      if (daysLeft === 1) return { text: t('promo.dayLeft'), variant: 'secondary' as const };
      if (daysLeft <= 7) return { text: `${daysLeft} ${t('promo.daysLeft')}`, variant: 'secondary' as const };
      if (daysLeft <= 30) return { text: `${daysLeft} ${t('promo.daysLeft')}`, variant: 'default' as const };
      
      return { text: formatDistanceToNow(expiry, { addSuffix: true }), variant: 'default' as const };
    } catch {
      return { text: t('promo.unknown'), variant: 'secondary' as const };
    }
  };

  const triggerConfetti = () => {
    // Fire confetti from both sides
    const defaults = {
      spread: 60,
      ticks: 100,
      gravity: 0.8,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#7c3aed', '#a855f7', '#c084fc', '#e879f9', '#f0abfc', '#fcd34d', '#fbbf24']
    };

    confetti({
      ...defaults,
      particleCount: 40,
      origin: { x: 0.3, y: 0.7 }
    });

    confetti({
      ...defaults,
      particleCount: 40,
      origin: { x: 0.7, y: 0.7 }
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: t('promo.codeCopied'),
      description: `${t('promo.codeCopiedDesc')} "${code}"`,
    });
    
    // Trigger confetti if enabled
    if (promoSettings.confettiEnabled) {
      triggerConfetti();
    }
    
    triggerPromoCopy();
  };

  const handleAddCode = async () => {
    if (!user) {
      toast({
        title: t('promo.authRequired'),
        description: t('promo.signInToAdd'),
        variant: "destructive"
      });
      return;
    }

    const storeName = selectedShop === 'other' ? customShopName : selectedShop;

    if (!newCode || !selectedShop || !newDescription || (selectedShop === 'other' && !customShopName)) {
      toast({
        title: t('promo.missingInfo'),
        description: t('promo.fillAllFields'),
        variant: "destructive"
      });
      return;
    }

    // Check limit
    if (promoCodes.length >= 24) {
      toast({
        title: t('promo.limitReached'),
        description: t('promo.limitReachedDesc'),
        variant: "destructive"
      });
      return;
    }

    setIsUploadingImage(true);
    
    try {
      let customImageUrl: string | null = null;
      
      // Upload image if one was cropped
      if (croppedImageBlob) {
        customImageUrl = await uploadImage(croppedImageBlob, user.id);
      }

      // Calculate expiry date - use user-provided date or default to 1 year
      const expiryDate = newExpiresDate 
        ? newExpiresDate 
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('promo_codes')
        .insert({
          user_id: user.id,
          code: newCode,
          store: storeName,
          description: newDescription,
          store_url: '',
          expires: expiryDate,
          used: false,
          reusable: newIsReusable,
          custom_image_url: customImageUrl
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: t('promo.codeAdded'),
        description: t('promo.codeAddedDesc'),
      });

      setNewCode("");
      setSelectedShop("");
      setCustomShopName("");
      setNewDescription("");
      setNewExpiresDate("");
      setNewIsReusable(false);
      clearImage();
      
      // Refresh the list
      fetchPromoCodes();
    } catch (error: any) {
      console.error('Error adding promo code:', error);
      toast({
        title: t('error'),
        description: error.message || t('promo.failedToAdd'),
        variant: "destructive"
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleEditPromo = (promo: PromoCode) => {
    setEditingPromo(promo);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPromo || !user) return;

    setIsUploadingImage(true);
    
    try {
      let customImageUrl = editingPromo.custom_image_url;
      
      // Upload new image if one was cropped
      if (editCroppedImageBlob) {
        customImageUrl = await uploadImage(editCroppedImageBlob, user.id);
      }

      const { error } = await supabase
        .from('promo_codes')
        .update({
          code: editingPromo.code,
          store: editingPromo.store,
          description: editingPromo.description,
          expires: editingPromo.expires,
          used: editingPromo.used,
          reusable: editingPromo.reusable,
          custom_image_url: customImageUrl
        })
        .eq('id', editingPromo.id);

      if (error) throw error;

      toast({
        title: t('promo.codeUpdated'),
        description: t('promo.changesSaved'),
      });

      setIsEditDialogOpen(false);
      setEditingPromo(null);
      clearImage(true);
      fetchPromoCodes();
    } catch (error: any) {
      console.error('Error updating promo code:', error);
      toast({
        title: t('error'),
        description: error.message || t('promo.failedToUpdate'),
        variant: "destructive"
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeletePromo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: t('promo.codeDeleted'),
        description: t('promo.codeDeletedDesc'),
      });

      fetchPromoCodes();
    } catch (error: any) {
      console.error('Error deleting promo code:', error);
      toast({
        title: t('error'),
        description: error.message || t('promo.failedToDelete'),
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('promo.title')}</h1>
        <p className="text-muted-foreground">{t('promo.subtitle')}</p>
      </div>

      {/* Add New Promo Code - Hidden for guests */}
      {!isGuest ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-background to-primary/10 border border-primary/20">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl transform translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl transform -translate-x-10 translate-y-10" />
          
          {/* Header */}
          <div 
            className="relative cursor-pointer select-none p-5 pb-0"
            onClick={() => setIsAddFormVisible(!isAddFormVisible)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                  <Plus className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t('promo.addNew')}</h2>
                  <p className="text-sm text-muted-foreground">{t('promo.addNewDesc')}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-full bg-muted/50 hover:bg-muted"
              >
                {isAddFormVisible ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          
          {isAddFormVisible && (
            <div className="relative p-5 pt-6 space-y-6">
              {/* Main inputs row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Promo Code Input */}
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</span>
                    {t('promo.code')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="code"
                      placeholder={t('promo.codePlaceholder')}
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      maxLength={20}
                      className="h-12 text-lg font-mono uppercase tracking-wider bg-background/80 border-2 border-muted focus:border-primary/50 rounded-xl pl-4"
                    />
                  </div>
                </div>
                
                {/* Shop Select */}
                <div className="space-y-2">
                  <Label htmlFor="shop" className="text-sm font-medium flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">2</span>
                    {t('promo.shop')}
                  </Label>
                  <Select value={selectedShop} onValueChange={setSelectedShop}>
                    <SelectTrigger id="shop" className="h-12 bg-background/80 border-2 border-muted focus:border-primary/50 rounded-xl">
                      <SelectValue placeholder={t('promo.selectShop')} />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {AVAILABLE_SHOPS.map((shop) => (
                        <SelectItem key={shop.id} value={shop.id}>
                          {shop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Custom shop name */}
              {selectedShop === 'other' && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <Label htmlFor="customShop" className="text-sm font-medium">{t('promo.customShopName')}</Label>
                  <Input
                    id="customShop"
                    placeholder={t('promo.enterShopName')}
                    value={customShopName}
                    onChange={(e) => setCustomShopName(e.target.value)}
                    maxLength={20}
                    className="h-12 bg-background/80 border-2 border-muted focus:border-primary/50 rounded-xl"
                  />
                </div>
              )}
              
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">3</span>
                  {t('promo.description')}
                </Label>
                <Input
                  id="description"
                  placeholder={t('promo.descriptionPlaceholder')}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  maxLength={120}
                  className="h-12 bg-background/80 border-2 border-muted focus:border-primary/50 rounded-xl"
                />
              </div>
              
              {/* Options Row - Expiration, Reusable, Image */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Expiration Date Card */}
                <div className="p-4 rounded-2xl bg-background/60 border border-border/50 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <div className="p-1.5 rounded-lg bg-blue-500/10">
                      <Gift className="h-4 w-4 text-blue-500" />
                    </div>
                    {t('promo.expirationDate') || 'Expires'}
                  </div>
                  <Input
                    id="expires"
                    type="date"
                    value={newExpiresDate}
                    onChange={(e) => setNewExpiresDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="h-10 bg-muted/50 border-0 rounded-lg text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {t('promo.expirationHint') || 'Leave empty for 1 year'}
                  </p>
                </div>
                
                {/* Reusable Toggle Card */}
                <div className="p-4 rounded-2xl bg-background/60 border border-border/50 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10">
                      <RotateCcw className="h-4 w-4 text-emerald-500" />
                    </div>
                    {t('promo.usageType') || 'Usage'}
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="reusable-toggle-add"
                      checked={newIsReusable}
                      onCheckedChange={setNewIsReusable}
                    />
                    {newIsReusable ? (
                      <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
                        {t('promo.reusable') || 'Reusable'}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t('promo.oneTimeUse') || 'One-time'}</span>
                    )}
                  </div>
                </div>
                
                {/* Image Upload Card */}
                <div className="p-4 rounded-2xl bg-background/60 border border-border/50 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <div className="p-1.5 rounded-lg bg-purple-500/10">
                      <ImagePlus className="h-4 w-4 text-purple-500" />
                    </div>
                    {t('promo.storeImage') || 'Image'}
                  </div>
                  
                  {croppedImagePreview ? (
                    <div className="relative inline-block">
                      <img 
                        src={croppedImagePreview} 
                        alt="Store preview" 
                        className="w-16 h-16 object-cover rounded-xl border-2 border-primary/30 shadow-sm"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                        onClick={() => clearImage()}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-16 w-16 p-0 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5"
                    >
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageSelect(e, false)}
                  />
                </div>
              </div>
              
              {/* Submit Button */}
              <Button
                onClick={handleAddCode}
                disabled={isUploadingImage}
                className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {t('promo.uploading') || 'Uploading...'}
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    {t('promo.addCode')}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card className="shadow-card border-2 border-primary/30">
          <CardContent className="p-6">
            <div className="text-center py-4">
              <Gift className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">{t('promo.wantToSave')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('promo.createAccountToSave')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Krolist Promo Codes Carousel */}
      {krolistPromoCodes.length > 0 && (
        <div className="mb-8">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[autoplayPlugin.current]}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {krolistPromoCodes.map((promo) => (
                <CarouselItem key={promo.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                  <PromoTicketCard
                    promo={promo}
                    isKrolist={true}
                    onCopy={handleCopyCode}
                    getTimeUntilExpiration={getTimeUntilExpiration}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      )}

      {/* User Promo Codes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promoCodes.map((promo) => (
          <PromoTicketCard
            key={promo.id}
            promo={promo}
            isKrolist={false}
            onCopy={handleCopyCode}
            onEdit={handleEditPromo}
            onDelete={handleDeletePromo}
            getTimeUntilExpiration={getTimeUntilExpiration}
          />
        ))}
      </div>

      {/* Edit Promo Code Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          clearImage(true);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              {t('promo.editPromo')}
            </DialogTitle>
            <DialogDescription>
              {t('promo.editPromoDesc')}
            </DialogDescription>
          </DialogHeader>
          {editingPromo && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code">{t('promo.code')}</Label>
                <Input
                  id="edit-code"
                  value={editingPromo.code}
                  onChange={(e) => setEditingPromo({...editingPromo, code: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-store">{t('promo.store')}</Label>
                <Input
                  id="edit-store"
                  value={editingPromo.store}
                  onChange={(e) => setEditingPromo({...editingPromo, store: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">{t('promo.description')}</Label>
                <Input
                  id="edit-description"
                  value={editingPromo.description}
                  onChange={(e) => setEditingPromo({...editingPromo, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expires">{t('promo.expires')}</Label>
                <Input
                  id="edit-expires"
                  type="date"
                  value={editingPromo.expires}
                  onChange={(e) => setEditingPromo({...editingPromo, expires: e.target.value})}
                />
              </div>
              
              {/* Edit Image Upload Section */}
              <div className="space-y-2">
                <Label>{t('promo.storeImage') || 'Store Image'}</Label>
                <div className="flex items-center gap-4">
                  {(editCroppedImagePreview || editingPromo.custom_image_url) ? (
                    <div className="relative">
                      <img 
                        src={editCroppedImagePreview || editingPromo.custom_image_url} 
                        alt="Store preview" 
                        className="w-16 h-16 object-cover rounded-lg border-2 border-primary/30"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-5 w-5"
                        onClick={() => {
                          clearImage(true);
                          setEditingPromo({...editingPromo, custom_image_url: undefined});
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => editFileInputRef.current?.click()}
                      className="h-16 w-16 flex flex-col items-center justify-center gap-1 border-dashed"
                    >
                      <ImagePlus className="h-5 w-5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{t('promo.addImage') || 'Add'}</span>
                    </Button>
                  )}
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageSelect(e, true)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editFileInputRef.current?.click()}
                  >
                    {t('promo.changeImage') || 'Change'}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={editingPromo.reusable}
                    onCheckedChange={(checked) => setEditingPromo({...editingPromo, reusable: checked, used: checked ? false : editingPromo.used})}
                    id="reusable-toggle"
                  />
                  <Label htmlFor="reusable-toggle" className="flex items-center gap-2 cursor-pointer">
                    {editingPromo.reusable && (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        <RotateCcw className="h-3 w-3 mr-1" />
                        {t('promo.reusable')}
                      </Badge>
                    )}
                    {!editingPromo.reusable && (
                      <span className="text-sm text-muted-foreground">{t('promo.makeReusable')}</span>
                    )}
                  </Label>
                </div>
                <Button 
                  onClick={handleSaveEdit} 
                  disabled={isUploadingImage}
                  className="bg-gradient-primary"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('promo.saving') || 'Saving...'}
                    </>
                  ) : (
                    t('promo.saveChanges')
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Cropper for Add Form */}
      {selectedImageSrc && (
        <ImageCropper
          isOpen={isCropperOpen}
          onClose={() => {
            setIsCropperOpen(false);
            setSelectedImageSrc(null);
          }}
          imageSrc={selectedImageSrc}
          onCropComplete={(blob) => handleCropComplete(blob, false)}
          aspectRatio={1}
        />
      )}

      {/* Image Cropper for Edit Form */}
      {editSelectedImageSrc && (
        <ImageCropper
          isOpen={isEditCropperOpen}
          onClose={() => {
            setIsEditCropperOpen(false);
            setEditSelectedImageSrc(null);
          }}
          imageSrc={editSelectedImageSrc}
          onCropComplete={(blob) => handleCropComplete(blob, true)}
          aspectRatio={1}
        />
      )}

      {/* Empty State */}
      {promoCodes.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('promo.noPersonalCodes')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('promo.startSaving')}
          </p>
        </div>
      )}
    </div>
  );
}