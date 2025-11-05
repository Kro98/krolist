import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Package, Plus, X, Search, Edit } from "lucide-react";
import { getAllStores } from "@/config/stores";

const DEFAULT_SHOPS = getAllStores().map(store => ({
  id: store.id,
  name: store.displayName,
  enabled: store.enabled,
  affiliateUrl: store.affiliateUrl || ''
}));

interface Shop {
  id: string;
  name: string;
  enabled: boolean;
  affiliateUrl?: string;
}

export function ShopManager() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [shops, setShops] = useState<Shop[]>(() => {
    const saved = localStorage.getItem('shopOrder');
    return saved ? JSON.parse(saved) : DEFAULT_SHOPS;
  });
  const [newShopName, setNewShopName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', affiliateUrl: '', enabled: true });

  useEffect(() => {
    localStorage.setItem('shopOrder', JSON.stringify(shops));
    // Trigger storage event for sidebar update
    window.dispatchEvent(new Event('storage'));
  }, [shops]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(shops);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setShops(items);
  };

  const toggleShop = (id: string) => {
    setShops(shops.map(shop => 
      shop.id === id ? { ...shop, enabled: !shop.enabled } : shop
    ));
  };

  const removeShop = (id: string) => {
    if (shops.filter(s => s.enabled).length <= 1) {
      toast({
        title: "Cannot remove shop",
        description: "At least one shop must remain enabled",
        variant: "destructive",
      });
      return;
    }
    setShops(shops.filter(shop => shop.id !== id));
  };

  const addShop = () => {
    if (!newShopName.trim()) return;
    
    const newShop: Shop = {
      id: newShopName.toLowerCase().replace(/\s+/g, '-'),
      name: newShopName.trim(),
      enabled: true,
      affiliateUrl: ''
    };
    
    setShops([...shops, newShop]);
    setNewShopName("");
    
    toast({
      title: "Shop added",
      description: `${newShop.name} has been added to your shop list`,
    });
  };

  const handleEditShop = (shop: Shop) => {
    setEditingShop(shop);
    setEditForm({ name: shop.name, affiliateUrl: shop.affiliateUrl || '', enabled: shop.enabled });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingShop) return;
    
    // Update local state
    setShops(shops.map(shop => 
      shop.id === editingShop.id 
        ? { ...shop, name: editForm.name, affiliateUrl: editForm.affiliateUrl, enabled: editForm.enabled }
        : shop
    ));
    
    // Trigger storage event to update sidebar and all users
    window.dispatchEvent(new Event('storage'));
    
    setShowEditDialog(false);
    toast({
      title: "Shop updated",
      description: `${editForm.name} has been updated and changes applied to all users`,
    });
  };

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {t('settings.shopManagement')}
        </CardTitle>
        <CardDescription>
          {t('settings.shopManagementDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search.placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Add New Shop */}
        <div className="flex gap-2">
          <Input
            placeholder={t('settings.addNewShop')}
            value={newShopName}
            onChange={(e) => setNewShopName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addShop()}
          />
          <Button onClick={addShop} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Shop List */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="shops">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {filteredShops.map((shop, index) => {
                  const storeConfig = getAllStores().find(s => s.id === shop.id);
                  const isComingSoon = storeConfig?.comingSoon || false;
                  
                  return (
                  <Draggable key={shop.id} draggableId={shop.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center justify-between p-3 border rounded-lg bg-card ${
                          snapshot.isDragging ? 'shadow-lg' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div {...provided.dragHandleProps}>
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          </div>
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{shop.name}</span>
                          {isComingSoon ? (
                            <Badge variant="outline" className="text-xs bg-muted">
                              Coming Soon
                            </Badge>
                          ) : shop.enabled && (
                            <Badge variant="secondary" className="text-xs">
                              {t('status.active')}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditShop(shop)}
                            className="text-primary hover:text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!isComingSoon && (
                            <Switch
                              checked={shop.enabled}
                              onCheckedChange={() => toggleShop(shop.id)}
                            />
                          )}
                          {!DEFAULT_SHOPS.find(s => s.id === shop.id) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeShop(shop.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                )})}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="text-sm text-muted-foreground">
          {t('settings.dragToReorder')} • {shops.filter(s => s.enabled).length} {t('status.active')}
        </div>
      </CardContent>
      
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shop</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Shop Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Affiliate URL</Label>
              <Input
                value={editForm.affiliateUrl}
                onChange={(e) => setEditForm({ ...editForm, affiliateUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={editForm.enabled}
                onCheckedChange={(checked) => setEditForm({ ...editForm, enabled: checked })}
              />
              <Label>Shop Enabled (affects all users)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}