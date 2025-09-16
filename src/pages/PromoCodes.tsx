import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Plus, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const samplePromoCodes = [
  {
    id: "1",
    code: "SAVE20",
    store: "Amazon",
    description: "20% off electronics",
    expires: "2024-02-15",
    used: false
  },
  {
    id: "2",
    code: "NEWUSER15",
    store: "Best Buy",
    description: "15% off first purchase",
    expires: "2024-01-30",
    used: true
  },
  {
    id: "3",
    code: "FREESHIP",
    store: "Target",
    description: "Free shipping on orders over $50",
    expires: "2024-03-01",
    used: false
  },
];

export default function PromoCodes() {
  const [newCode, setNewCode] = useState("");
  const [newStore, setNewStore] = useState("");
  const [newDescription, setNewDescription] = useState("");
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
      toast({
        title: "Promo Code Added!",
        description: "Your promo code has been saved to your collection",
      });
      setNewCode("");
      setNewStore("");
      setNewDescription("");
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
      <div className="grid gap-4">
        {samplePromoCodes.map((promo) => (
          <Card key={promo.id} className={`shadow-card hover:shadow-hover transition-all duration-300 ${promo.used ? 'opacity-60' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-primary/10 px-3 py-1 rounded-lg font-mono font-bold text-primary">
                      {promo.code}
                    </div>
                    <Badge variant={promo.used ? "secondary" : "default"}>
                      {promo.store}
                    </Badge>
                    {promo.used && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Used
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {promo.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires: {new Date(promo.expires).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyCode(promo.code)}
                    disabled={promo.used}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`https://${promo.store.toLowerCase()}.com`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {samplePromoCodes.length === 0 && (
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