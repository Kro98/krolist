import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Gift, Plus, Copy, ExternalLink, Edit, RotateCcw, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PromoCode {
  id: string;
  code: string;
  store: string;
  description: string;
  expires: string;
  used: boolean;
  reusable: boolean;
}

const samplePromoCodes: PromoCode[] = [
  {
    id: "4",
    code: "PALESTINE",
    store: "NOON",
    description: "Special discount code for NOON",
    expires: "2025-12-31",
    used: false,
    reusable: true
  },
  {
    id: "5",
    code: "CLEARANCE",
    store: "NOON",
    description: "Special discount code for NOON",
    expires: "2025-12-31",
    used: false,
    reusable: true
  },
  {
    id: "6",
    code: "KINGDOM",
    store: "NOON",
    description: "Special discount code for NOON",
    expires: "2025-12-31",
    used: false,
    reusable: true
  },
];

export default function PromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(samplePromoCodes);
  const [newCode, setNewCode] = useState("");
  const [newStore, setNewStore] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied!",
      description: `Promo code "${code}" copied to clipboard`,
    });
  };

  const handleAddCode = () => {
    if (newCode && newStore && newDescription) {
      const newPromo: PromoCode = {
        id: Date.now().toString(),
        code: newCode,
        store: newStore,
        description: newDescription,
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        used: false,
        reusable: false
      };
      setPromoCodes([...promoCodes, newPromo]);
      toast({
        title: "Promo Code Added!",
        description: "Your promo code has been saved to your collection",
      });
      setNewCode("");
      setNewStore("");
      setNewDescription("");
    }
  };

  const handleEditPromo = (promo: PromoCode) => {
    setEditingPromo(promo);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingPromo) {
      setPromoCodes(promoCodes.map(p => p.id === editingPromo.id ? editingPromo : p));
      toast({
        title: "Promo Code Updated!",
        description: "Your changes have been saved",
      });
      setIsEditDialogOpen(false);
      setEditingPromo(null);
    }
  };

  const toggleReusable = (id: string) => {
    setPromoCodes(promoCodes.map(p => 
      p.id === id ? { ...p, reusable: !p.reusable, used: p.reusable ? p.used : false } : p
    ));
  };

  const toggleUsed = (id: string) => {
    setPromoCodes(promoCodes.map(p => 
      p.id === id ? { ...p, used: !p.used } : p
    ));
  };

  const handleDeletePromo = (id: string) => {
    setPromoCodes(promoCodes.filter(p => p.id !== id));
    toast({
      title: "Promo Code Deleted",
      description: "The promo code has been removed from your collection",
    });
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store">Store</Label>
              <Input
                id="store"
                placeholder="Amazon"
                value={newStore}
                onChange={(e) => setNewStore(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="20% off electronics"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
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

      {/* Promo Codes List */}
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
                <div className="grid grid-cols-2 gap-2">
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
                    onClick={() => handleDeletePromo(promo.id)}
                    className="text-destructive hover:bg-destructive/10 w-full col-span-2"
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
                    onCheckedChange={() => toggleReusable(editingPromo.id)}
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
      {promoCodes.length === 0 && (
        <div className="text-center py-12">
          <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No promo codes yet</h3>
          <p className="text-muted-foreground mb-4">
            Start saving promo codes you find online for easy access when shopping
          </p>
        </div>
      )}
    </div>
  );
}