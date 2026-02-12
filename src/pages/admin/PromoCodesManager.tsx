import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Copy, Tag } from "lucide-react";
import { toast } from "sonner";
import { STORES } from "@/config/stores";

interface PromoCode {
  id: string;
  code: string;
  store: string;
  description: string;
  store_url: string;
  expires: string;
  reusable: boolean;
  used: boolean;
  is_krolist: boolean | null;
  display_order: number | null;
  custom_shop_name: string | null;
  card_color: string | null;
}

const STORE_OPTIONS = Object.keys(STORES).map(key => ({
  value: key,
  label: key.charAt(0).toUpperCase() + key.slice(1),
}));

export default function PromoCodesManager() {
  const { user } = useAuth();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    store: 'amazon',
    description: '',
    store_url: '',
    expires: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    reusable: true,
    is_krolist: true,
    custom_shop_name: '',
    card_color: '#7c3aed',
  });

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('is_krolist', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCodes(data || []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const promoData = {
        code: formData.code.toUpperCase().trim(),
        store: formData.store,
        description: formData.description,
        store_url: formData.store_url,
        expires: formData.expires,
        reusable: formData.reusable,
        is_krolist: true,
        user_id: user.id,
        custom_shop_name: formData.custom_shop_name || null,
        card_color: formData.card_color,
        display_order: editingCode ? editingCode.display_order : codes.length,
        used: false,
      };

      if (editingCode) {
        const { error } = await supabase
          .from('promo_codes')
          .update(promoData)
          .eq('id', editingCode.id);
        if (error) throw error;
        toast.success('Promo code updated');
      } else {
        const { error } = await supabase
          .from('promo_codes')
          .insert([promoData]);
        if (error) throw error;
        toast.success('Promo code created');
      }

      setDialogOpen(false);
      resetForm();
      fetchCodes();
    } catch (error) {
      console.error('Error saving promo code:', error);
      toast.error('Failed to save promo code');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promo code?')) return;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Promo code deleted');
      fetchCodes();
    } catch (error) {
      console.error('Error deleting promo code:', error);
      toast.error('Failed to delete promo code');
    }
  };

  const handleEdit = (code: PromoCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      store: code.store,
      description: code.description,
      store_url: code.store_url,
      expires: code.expires,
      reusable: code.reusable,
      is_krolist: true,
      custom_shop_name: code.custom_shop_name || '',
      card_color: code.card_color || '#7c3aed',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCode(null);
    setFormData({
      code: '',
      store: 'amazon',
      description: '',
      store_url: '',
      expires: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      reusable: true,
      is_krolist: true,
      custom_shop_name: '',
      card_color: '#7c3aed',
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied: ${code}`);
  };

  const isExpired = (date: string) => new Date(date) < new Date();

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Promo Codes</h2>
          <p className="text-muted-foreground">
            Manage Krolist promo codes. These appear in the support bubble for visitors.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCode ? 'Edit Promo Code' : 'New Promo Code'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="SAVE20"
                    required
                    className="font-mono uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Store *</Label>
                  <Select value={formData.store} onValueChange={(v) => setFormData(prev => ({ ...prev, store: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STORE_OPTIONS.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.store === 'other' && (
                <div className="space-y-2">
                  <Label>Custom Store Name</Label>
                  <Input
                    value={formData.custom_shop_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_shop_name: e.target.value }))}
                    placeholder="Store name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="20% off on all electronics"
                  required
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Store URL</Label>
                <Input
                  value={formData.store_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, store_url: e.target.value }))}
                  placeholder="https://store.com"
                  type="url"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expires *</Label>
                  <Input
                    type="date"
                    value={formData.expires}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Card Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={formData.card_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, card_color: e.target.value }))}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.card_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, card_color: e.target.value }))}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.reusable}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reusable: checked }))}
                  />
                  <Label>Reusable</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingCode ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No promo codes yet. Add your first one!
                    </TableCell>
                  </TableRow>
                ) : (
                  codes.map(code => (
                    <TableRow key={code.id}>
                      <TableCell>
                        <button
                          onClick={() => copyCode(code.code)}
                          className="flex items-center gap-1.5 font-mono font-bold text-primary hover:underline"
                        >
                          {code.code}
                          <Copy className="w-3 h-3" />
                        </button>
                      </TableCell>
                      <TableCell className="capitalize">
                        {code.custom_shop_name || code.store}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {code.description}
                      </TableCell>
                      <TableCell>
                        <span className={isExpired(code.expires) ? 'text-destructive' : ''}>
                          {new Date(code.expires).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {isExpired(code.expires) ? (
                            <Badge variant="outline" className="text-destructive border-destructive">Expired</Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                          )}
                          {code.reusable && <Badge variant="secondary">Reusable</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(code)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(code.id)}>
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