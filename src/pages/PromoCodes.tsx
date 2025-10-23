import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Gift, Plus, Copy, ExternalLink, Edit, RotateCcw, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { replaceWithAffiliateLink, AFFILIATE_LINKS, AVAILABLE_SHOPS } from "@/lib/affiliateLinks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PromoCode {
  id: string;
  code: string;
  store: string;
  description: string;
  store_url: string;
  expires: string;
  used: boolean;
  reusable: boolean;
}

// Static Krolist promo codes
const KROLIST_PROMO_CODES: PromoCode[] = [
  {
    id: 'krolist-kingdom',
    code: 'KINGDOM',
    store: 'NOON',
    description: 'use this code at checkout to get 10 rial discount and support Krolist',
    store_url: 'https://s.noon.com/sLVK_sCBGo4',
    expires: '2099-12-31',
    used: false,
    reusable: true
  },
  {
    id: 'krolist-palestine',
    code: 'PALESTINE',
    store: 'NOON',
    description: 'use this code at checkout to get 10 rial discount and support Krolist',
    store_url: 'https://s.noon.com/sLVK_sCBGo4',
    expires: '2099-12-31',
    used: false,
    reusable: true
  },
  {
    id: 'krolist-clearance',
    code: 'CLEARANCE',
    store: 'NOON',
    description: 'use this code at checkout to get 10 rial discount and support Krolist',
    store_url: 'https://s.noon.com/sLVK_sCBGo4',
    expires: '2099-12-31',
    used: false,
    reusable: true
  }
];

export default function PromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [newCode, setNewCode] = useState("");
  const [newStore, setNewStore] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStoreUrl, setNewStoreUrl] = useState("");
  const [selectedShop, setSelectedShop] = useState<string>("");
  const [customShopName, setCustomShopName] = useState("");
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch promo codes from database
  useEffect(() => {
    if (user) {
      fetchPromoCodes();
    }
  }, [user]);

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setPromoCodes(data.map(item => ({
          id: item.id,
          code: item.code,
          store: item.store,
          description: item.description,
          store_url: item.store_url,
          expires: item.expires,
          used: item.used,
          reusable: item.reusable
        })));
      }
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast({
        title: "Error",
        description: "Failed to load promo codes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied!",
      description: `Promo code "${code}" copied to clipboard`,
    });
  };

  const handleAddCode = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add promo codes",
        variant: "destructive"
      });
      return;
    }

    const storeName = selectedShop === 'other' ? customShopName : selectedShop;
    const storeUrl = selectedShop === 'other' ? newStoreUrl : (AFFILIATE_LINKS[selectedShop] || '');

    if (!newCode || !selectedShop || !newDescription || (selectedShop === 'other' && (!customShopName || !newStoreUrl))) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Check limit
    if (promoCodes.length >= 24) {
      toast({
        title: "Limit Reached",
        description: "You can only save up to 24 promo codes",
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
          store_url: storeUrl,
          expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          used: false,
          reusable: false
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Promo Code Added!",
        description: "Your promo code has been saved to your collection",
      });

      setNewCode("");
      setSelectedShop("");
      setCustomShopName("");
      setNewDescription("");
      setNewStoreUrl("");
      
      // Refresh the list
      fetchPromoCodes();
    } catch (error: any) {
      console.error('Error adding promo code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add promo code",
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
          store_url: replaceWithAffiliateLink(editingPromo.store_url),
          expires: editingPromo.expires,
          used: editingPromo.used,
          reusable: editingPromo.reusable
        })
        .eq('id', editingPromo.id);

      if (error) throw error;

      toast({
        title: "Promo Code Updated!",
        description: "Your changes have been saved",
      });

      setIsEditDialogOpen(false);
      setEditingPromo(null);
      fetchPromoCodes();
    } catch (error: any) {
      console.error('Error updating promo code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update promo code",
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
        title: "Promo Code Deleted",
        description: "The promo code has been removed from your collection",
      });

      fetchPromoCodes();
    } catch (error: any) {
      console.error('Error deleting promo code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete promo code",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Promo Codes</h1>
        <p className="text-muted-foreground">Manage your collection of discount codes and coupons</p>
      </div>

      {/* Add New Promo Code */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add New Promo Code
          </CardTitle>
          <CardDescription>
            Save promo codes you find online for easy access when shopping
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Promo Code</Label>
              <Input
                id="code"
                placeholder="SAVE20"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop">Shop</Label>
              <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger id="shop">
                  <SelectValue placeholder="Select a shop" />
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
                <Label htmlFor="customShop">Custom Shop Name</Label>
                <Input
                  id="customShop"
                  placeholder="Enter shop name"
                  value={customShopName}
                  onChange={(e) => setCustomShopName(e.target.value)}
                  maxLength={20}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="20% off electronics"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                maxLength={120}
              />
            </div>
            {selectedShop === 'other' && (
              <div className="space-y-2">
                <Label htmlFor="storeUrl">Store URL</Label>
                <Input
                  id="storeUrl"
                  placeholder="https://example.com"
                  value={newStoreUrl}
                  onChange={(e) => setNewStoreUrl(e.target.value)}
                />
              </div>
            )}
          </div>
          <Button
            onClick={handleAddCode}
            className="mt-4 bg-gradient-primary hover:shadow-hover transition-all duration-200"
          >
            Add Code
          </Button>
        </CardContent>
      </Card>

      {/* Krolist Promo Codes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {KROLIST_PROMO_CODES.map((promo) => (
          <Card key={promo.id} className="shadow-card hover:shadow-hover transition-all duration-300 border-2 border-primary/30">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="bg-primary/10 px-3 py-1 rounded-lg font-mono font-bold text-primary text-sm inline-block">
                      {promo.code}
                    </div>
                    <Badge variant="outline" className="bg-primary/20 text-primary border-primary/40">
                      Krolist
                    </Badge>
                  </div>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <Badge variant="default">
                      {promo.store}
                    </Badge>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reusable
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {promo.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Promo Codes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promoCodes.map((promo) => (
          <Card key={promo.id} className={`shadow-card hover:shadow-hover transition-all duration-300 ${promo.used && !promo.reusable ? 'opacity-60' : ''}`}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="mb-3">
                    <div className="bg-primary/10 px-3 py-1 rounded-lg font-mono font-bold text-primary text-sm inline-block">
                      {promo.code}
                    </div>
                  </div>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <Badge variant={promo.used && !promo.reusable ? "secondary" : "default"}>
                      {promo.store}
                    </Badge>
                    {promo.reusable ? (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reusable
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        One-time use
                      </Badge>
                    )}
                    {promo.used && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                        Used
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
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditPromo(promo)}
                    className="w-full"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyCode(promo.code)}
                    disabled={promo.used && !promo.reusable}
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
                    onClick={() => handleDeletePromo(promo.id)}
                    className="text-destructive hover:bg-destructive/10 w-full col-span-3"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Promo Code Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Promo Code
            </DialogTitle>
            <DialogDescription>
              Update your promo code details below
            </DialogDescription>
          </DialogHeader>
          {editingPromo && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code">Promo Code</Label>
                <Input
                  id="edit-code"
                  value={editingPromo.code}
                  onChange={(e) => setEditingPromo({...editingPromo, code: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-store">Store</Label>
                <Input
                  id="edit-store"
                  value={editingPromo.store}
                  onChange={(e) => setEditingPromo({...editingPromo, store: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editingPromo.description}
                  onChange={(e) => setEditingPromo({...editingPromo, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-url">Store URL</Label>
                <Input
                  id="edit-url"
                  value={editingPromo.store_url}
                  onChange={(e) => setEditingPromo({...editingPromo, store_url: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expires">Expires</Label>
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
                        Reusable
                      </Badge>
                    )}
                    {!editingPromo.reusable && (
                      <span className="text-sm text-muted-foreground">Make Reusable</span>
                    )}
                  </Label>
                </div>
                <Button onClick={handleSaveEdit} className="bg-gradient-primary">
                  Save Changes
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
          <h3 className="text-lg font-medium mb-2">No personal promo codes yet</h3>
          <p className="text-muted-foreground mb-4">
            Start saving promo codes you find online for easy access when shopping
          </p>
        </div>
      )}
    </div>
  );
}