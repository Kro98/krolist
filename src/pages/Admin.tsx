import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Plus, Edit, Trash2, Copy, ExternalLink } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STORES } from "@/config/stores";

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

export default function Admin() {
  const { isAdmin, isLoading: roleLoading } = useAdminRole();
  const navigate = useNavigate();
  const { toast } = useToast();
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
    if (!roleLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [isAdmin, roleLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchKrolistPromoCodes();
    }
  }, [isAdmin]);

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
        title: "Error",
        description: "Failed to load Krolist promo codes",
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
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reusable: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.store || !formData.description || !formData.store_url || !formData.expires) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingCode) {
        // Update existing code
        const { error } = await supabase
          .from('promo_codes')
          .update({
            code: formData.code,
            store: formData.store,
            description: formData.description,
            store_url: formData.store_url,
            expires: formData.expires,
            reusable: formData.reusable
          })
          .eq('id', editingCode.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Krolist promo code updated successfully"
        });
      } else {
        // Create new code - need to get current user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
          .from('promo_codes')
          .insert({
            user_id: user.id,
            code: formData.code,
            store: formData.store,
            description: formData.description,
            store_url: formData.store_url,
            expires: formData.expires,
            used: false,
            reusable: formData.reusable,
            is_krolist: true
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Krolist promo code added successfully"
        });
      }

      setIsDialogOpen(false);
      fetchKrolistPromoCodes();
    } catch (error: any) {
      console.error('Error saving promo code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save promo code",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Krolist promo code?')) return;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Krolist promo code deleted successfully"
      });

      fetchKrolistPromoCodes();
    } catch (error: any) {
      console.error('Error deleting promo code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete promo code",
        variant: "destructive"
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied!",
      description: `Promo code "${code}" copied to clipboard`
    });
  };

  if (roleLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center max-w-md">
          <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground">
            {roleLoading ? 'Checking permissions...' : 'You do not have admin privileges'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Manage Krolist promo codes and settings</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Krolist Promo Code
        </Button>
      </div>

      {/* Krolist Promo Codes Management */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Krolist Promo Codes</CardTitle>
          <CardDescription>
            Manage promotional codes that appear for all Krolist users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : promoCodes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No Krolist promo codes yet. Click "Add Krolist Promo Code" to create one.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {promoCodes.map((promo) => (
                <Card key={promo.id} className="border-2 border-primary/30">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <div className="bg-primary/10 px-6 py-2 rounded-lg font-mono font-bold text-primary text-2xl inline-block mb-3">
                          {promo.code}
                        </div>
                        <div className="flex gap-2 mb-3 flex-wrap">
                          <Badge variant="default">{promo.store}</Badge>
                          <Badge variant="outline" className="bg-primary/20 text-primary border-primary/40">
                            Krolist
                          </Badge>
                          {promo.reusable && (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                              Reusable
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {promo.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Expires: {new Date(promo.expires).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog(promo)}
                          className="w-full"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyCode(promo.code)}
                          className="w-full"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(promo.store_url, '_blank')}
                          className="w-full"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(promo.id)}
                          className="text-destructive hover:bg-destructive/10 w-full"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCode ? 'Edit Krolist Promo Code' : 'Add Krolist Promo Code'}
            </DialogTitle>
            <DialogDescription>
              This promo code will be visible to all Krolist users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Promo Code *</Label>
              <Input
                id="code"
                placeholder="KINGDOM"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store">Store *</Label>
              <Select value={formData.store} onValueChange={(value) => {
                const store = STORES[value];
                setFormData({ 
                  ...formData, 
                  store: store?.displayName || value,
                  store_url: store?.affiliateUrl || formData.store_url
                });
              }}>
                <SelectTrigger id="store">
                  <SelectValue placeholder="Select a store" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(STORES).map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                placeholder="use this code at checkout to get 10 rial discount and support Krolist"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store_url">Store URL *</Label>
              <Input
                id="store_url"
                placeholder="https://s.noon.com/sLVK_sCBGo4"
                value={formData.store_url}
                onChange={(e) => setFormData({ ...formData, store_url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires">Expiry Date *</Label>
              <Input
                id="expires"
                type="date"
                value={formData.expires}
                onChange={(e) => setFormData({ ...formData, expires: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="reusable"
                checked={formData.reusable}
                onCheckedChange={(checked) => setFormData({ ...formData, reusable: checked })}
              />
              <Label htmlFor="reusable" className="cursor-pointer">
                Reusable code (can be used multiple times)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary">
              {editingCode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
