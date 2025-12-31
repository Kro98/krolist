import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Gift, Plus, Edit, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
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

interface PromoCode {
  id: string;
  code: string;
  store: string;
  description: string;
  expires: string;
  used: boolean;
  reusable: boolean;
}

export default function PromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedShop, setSelectedShop] = useState<string>("");
  const [customShopName, setCustomShopName] = useState("");
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const { triggerPromoCopy } = useAdTrigger();
  const { t, language } = useLanguage();
  
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
          reusable: item.reusable
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
          reusable: item.reusable
        })));
      }
    } catch (error) {
      console.error('Error fetching Krolist promo codes:', error);
    }
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

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: t('promo.codeCopied'),
      description: `${t('promo.codeCopiedDesc')} "${code}"`,
    });
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

    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .insert({
          user_id: user.id,
          code: newCode,
          store: storeName,
          description: newDescription,
          store_url: '', // No longer storing URLs
          expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          used: false,
          reusable: false
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
      
      // Refresh the list
      fetchPromoCodes();
    } catch (error: any) {
      console.error('Error adding promo code:', error);
      toast({
        title: t('error'),
        description: error.message || t('promo.failedToAdd'),
        variant: "destructive"
      });
    }
  };

  const handleEditPromo = (promo: PromoCode) => {
    setEditingPromo(promo);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPromo) return;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({
          code: editingPromo.code,
          store: editingPromo.store,
          description: editingPromo.description,
          expires: editingPromo.expires,
          used: editingPromo.used,
          reusable: editingPromo.reusable
        })
        .eq('id', editingPromo.id);

      if (error) throw error;

      toast({
        title: t('promo.codeUpdated'),
        description: t('promo.changesSaved'),
      });

      setIsEditDialogOpen(false);
      setEditingPromo(null);
      fetchPromoCodes();
    } catch (error: any) {
      console.error('Error updating promo code:', error);
      toast({
        title: t('error'),
        description: error.message || t('promo.failedToUpdate'),
        variant: "destructive"
      });
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
        <Card className="shadow-card">
          <CardHeader 
            className="cursor-pointer select-none" 
            onClick={() => setIsAddFormVisible(!isAddFormVisible)}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  {t('promo.addNew')}
                </CardTitle>
                <CardDescription>
                  {t('promo.addNewDesc')}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {isAddFormVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {isAddFormVisible && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">{t('promo.code')}</Label>
                  <Input
                    id="code"
                    placeholder={t('promo.codePlaceholder')}
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop">{t('promo.shop')}</Label>
                  <Select value={selectedShop} onValueChange={setSelectedShop}>
                    <SelectTrigger id="shop">
                      <SelectValue placeholder={t('promo.selectShop')} />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_SHOPS.map((shop) => (
                        <SelectItem key={shop.id} value={shop.id}>
                          {shop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedShop === 'other' && (
                  <div className="space-y-2">
                    <Label htmlFor="customShop">{t('promo.customShopName')}</Label>
                    <Input
                      id="customShop"
                      placeholder={t('promo.enterShopName')}
                      value={customShopName}
                      onChange={(e) => setCustomShopName(e.target.value)}
                      maxLength={20}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="description">{t('promo.description')}</Label>
                  <Input
                    id="description"
                    placeholder={t('promo.descriptionPlaceholder')}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    maxLength={120}
                  />
                </div>
              </div>
              <Button
                onClick={handleAddCode}
                className="mt-4 bg-gradient-primary hover:shadow-hover transition-all duration-200"
              >
                {t('promo.addCode')}
              </Button>
            </CardContent>
          )}
        </Card>
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
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
              <div className="flex items-center justify-between">
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
                <Button onClick={handleSaveEdit} className="bg-gradient-primary">
                  {t('promo.saveChanges')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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