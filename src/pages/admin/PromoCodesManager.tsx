import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Copy, ExternalLink } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STORES } from "@/config/stores";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

interface KrolistPromoCode {
  id: string;
  code: string;
  store: string;
  description: string;
  store_url: string;
  expires: string;
  used: boolean;
  reusable: boolean;
  is_krolist: boolean;
}

export default function PromoCodesManager() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [promoCodes, setPromoCodes] = useState<KrolistPromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<KrolistPromoCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    store: '',
    description: '',
    store_url: '',
    expires: '',
    reusable: true
  });

  useEffect(() => {
    fetchKrolistPromoCodes();
  }, []);

  const fetchKrolistPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('is_krolist', true)
        .order('created_at', { ascending: false });

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

  const handleOpenDialog = (code?: KrolistPromoCode) => {
    if (code) {
      setEditingCode(code);
      setFormData({
        code: code.code,
        store: code.store,
        description: code.description,
        store_url: code.store_url,
        expires: code.expires,
        reusable: code.reusable
      });
    } else {
      setEditingCode(null);
      setFormData({
        code: '',
        store: '',
        description: '',
        store_url: '',
        expires: '',
        reusable: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: t('error'),
        description: t('admin.mustBeLoggedIn'),
        variant: "destructive"
      });
      return;
    }

    const promoData = {
      code: formData.code,
      store: formData.store,
      description: formData.description,
      store_url: formData.store_url,
      expires: formData.expires,
      reusable: formData.reusable,
      is_krolist: true,
      user_id: user.id
    };

    try {
      if (editingCode) {
        const { error } = await supabase
          .from('promo_codes')
          .update(promoData)
          .eq('id', editingCode.id);

        if (error) throw error;
        toast({ title: t('admin.promoCodeUpdated') });
      } else {
        const { error } = await supabase
          .from('promo_codes')
          .insert([promoData]);

        if (error) throw error;
        toast({ title: t('admin.promoCodeAdded') });
      }

      setIsDialogOpen(false);
      fetchKrolistPromoCodes();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.confirmDelete'))) return;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: t('admin.promoCodeDeleted') });
      fetchKrolistPromoCodes();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: t('promoCodes.codeCopied') });
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  if (isLoading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('admin.krolistPromoCodes')}</h2>
          <p className="text-muted-foreground">{t('admin.krolistPromoCodesDesc')}</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          {t('admin.addPromoCode')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {promoCodes.map((promoCode) => (
          <Card key={promoCode.id} className={isExpired(promoCode.expires) ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{promoCode.code}</CardTitle>
                  <CardDescription>{promoCode.store}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyCode(promoCode.code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(promoCode.store_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{promoCode.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {promoCode.reusable && (
                    <Badge variant="secondary">{t('promoCodes.reusable')}</Badge>
                  )}
                  {isExpired(promoCode.expires) ? (
                    <Badge variant="destructive">{t('promoCodes.expired')}</Badge>
                  ) : (
                    <Badge variant="outline">
                      {t('promoCodes.expires')}: {new Date(promoCode.expires).toLocaleDateString()}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(promoCode)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {t('edit')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(promoCode.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCode ? t('admin.editPromoCode') : t('admin.addPromoCode')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{t('promoCodes.code')}</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>

            <div>
              <Label>{t('promoCodes.store')}</Label>
              <Select value={formData.store} onValueChange={(value) => setFormData({ ...formData, store: value })}>
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
              <Label>{t('promoCodes.description')}</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <Label>{t('promoCodes.storeUrl')}</Label>
              <Input
                value={formData.store_url}
                onChange={(e) => setFormData({ ...formData, store_url: e.target.value })}
              />
            </div>

            <div>
              <Label>{t('promoCodes.expiryDate')}</Label>
              <Input
                type="date"
                value={formData.expires}
                onChange={(e) => setFormData({ ...formData, expires: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.reusable}
                onCheckedChange={(checked) => setFormData({ ...formData, reusable: checked })}
              />
              <Label>{t('promoCodes.reusable')}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave}>{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
