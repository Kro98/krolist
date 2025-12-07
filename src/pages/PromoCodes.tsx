import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Gift, Plus, Copy, Edit, RotateCcw, Trash2, Clock, Calendar } from "lucide-react";
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
import { formatDistanceToNow, format } from "date-fns";

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
  
  const autoplayPlugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  // Allow guests to view but show message that they can't create promo codes

  const [krolistPromoCodes, setKrolistPromoCodes] = useState<PromoCode[]>([]);

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
        title: "Error",
        description: "Failed to load promo codes",
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
      
      if (daysLeft < 0) return { text: 'Expired', variant: 'destructive' as const };
      if (daysLeft === 0) return { text: 'Expires today', variant: 'destructive' as const };
      if (daysLeft === 1) return { text: '1 day left', variant: 'secondary' as const };
      if (daysLeft <= 7) return { text: `${daysLeft} days left`, variant: 'secondary' as const };
      if (daysLeft <= 30) return { text: `${daysLeft} days left`, variant: 'default' as const };
      
      return { text: formatDistanceToNow(expiry, { addSuffix: true }), variant: 'default' as const };
    } catch {
      return { text: 'Unknown', variant: 'secondary' as const };
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

    if (!newCode || !selectedShop || !newDescription || (selectedShop === 'other' && !customShopName)) {
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
          store_url: '', // No longer storing URLs
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

      {/* Add New Promo Code - Hidden for guests */}
      {!isGuest ? (
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
            </div>
            <Button
              onClick={handleAddCode}
              className="mt-4 bg-gradient-primary hover:shadow-hover transition-all duration-200"
            >
              Add Code
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card border-2 border-primary/30">
          <CardContent className="p-6">
            <div className="text-center py-4">
              <Gift className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Want to Save Your Own Promo Codes?</h3>
              <p className="text-muted-foreground mb-4">
                Create an account to save and manage your personal promo codes collection. Click the user icon in the top right to sign up or log in.
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
                  <Card className="shadow-card hover:shadow-hover transition-all duration-300 border-2 border-primary/30 h-full">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <div className="mb-3">
                            <div className="bg-primary/10 px-6 py-2 rounded-lg font-mono font-bold text-primary text-2xl inline-block">
                              {promo.code}
                            </div>
                          </div>
                          <div className="flex gap-2 mb-3 flex-wrap">
                            <Badge variant="default">
                              {promo.store}
                            </Badge>
                            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/40">
                              Krolist
                            </Badge>
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Reusable
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {promo.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Calendar className="h-3 w-3" />
                            <span>Expires: {format(new Date(promo.expires), 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="mb-2">
                            <Badge 
                              variant={getTimeUntilExpiration(promo.expires).variant}
                              className="text-xs"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {getTimeUntilExpiration(promo.expires).text}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyCode(promo.code)}
                            className="w-full max-w-32"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      )}

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
                    className="w-full col-span-2"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
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