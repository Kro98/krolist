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
import { GripVertical, Package, Plus, X, Search, Edit, Trash2, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getAllStores } from "@/config/stores";
const DEFAULT_SHOPS = getAllStores().map(store => ({
  id: store.id,
  name: store.displayName,
  enabled: store.enabled,
  affiliateUrl: store.affiliateUrl || '',
  adminEnabled: store.enabled,
  status: store.comingSoon ? 'coming_soon' as ShopStatus : 'active' as ShopStatus
}));
type ShopStatus = 'active' | 'deactivated_admin' | 'coming_soon' | 'maintenance' | 'custom';
interface Shop {
  id: string;
  name: string;
  enabled: boolean;
  affiliateUrl?: string;
  status?: ShopStatus;
  customStatusText?: string;
  adminEnabled?: boolean;
}
export function ShopManager() {
  const {
    t
  } = useLanguage();
  const {
    toast
  } = useToast();
  const [isAdminView] = useState(() => window.location.pathname.includes('/admin'));
  const [highlightedShop, setHighlightedShop] = useState<string | null>(null);
  const [shops, setShops] = useState<Shop[]>(() => {
    const saved = localStorage.getItem('shopOrder');
    return saved ? JSON.parse(saved) : DEFAULT_SHOPS;
  });
  const [newShopName, setNewShopName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    affiliateUrl: '',
    enabled: true,
    adminEnabled: true,
    status: 'active' as ShopStatus,
    customStatusText: ''
  });
  useEffect(() => {
    localStorage.setItem('shopOrder', JSON.stringify(shops));
    // Trigger custom event for sidebar update
    window.dispatchEvent(new Event('shopOrderUpdated'));
  }, [shops]);
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(shops);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setShops(items);
  };
  const toggleShop = (id: string) => {
    const shop = shops.find(s => s.id === id);
    if (!shop) return;
    setShops(shops.map(shop => shop.id === id ? {
      ...shop,
      enabled: !shop.enabled
    } : shop));

    // Highlight animation
    setHighlightedShop(id);
    setTimeout(() => setHighlightedShop(null), 600);
    toast({
      title: shop.enabled ? "Shop Disabled" : "Shop Enabled",
      description: `${shop.name} has been ${shop.enabled ? 'disabled' : 'enabled'}`,
      duration: 2000
    });
  };
  const removeShop = (id: string) => {
    if (shops.filter(s => s.enabled).length <= 1) {
      toast({
        title: "Cannot remove shop",
        description: "At least one shop must remain enabled",
        variant: "destructive"
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
      description: `${newShop.name} has been added to your shop list`
    });
  };
  const handleEditShop = (shop: Shop) => {
    setEditingShop(shop);
    setEditForm({
      name: shop.name,
      affiliateUrl: shop.affiliateUrl || '',
      enabled: shop.enabled,
      adminEnabled: shop.adminEnabled !== undefined ? shop.adminEnabled : true,
      status: shop.status || 'active',
      customStatusText: shop.customStatusText || ''
    });
    setShowEditDialog(true);
  };
  const handleSaveEdit = async () => {
    if (!editingShop) return;

    // Update local state
    setShops(shops.map(shop => shop.id === editingShop.id ? {
      ...shop,
      name: editForm.name,
      affiliateUrl: editForm.affiliateUrl,
      enabled: editForm.adminEnabled ? editForm.enabled : false,
      adminEnabled: editForm.adminEnabled,
      status: editForm.status,
      customStatusText: editForm.customStatusText
    } : shop));

    // Trigger storage event to update sidebar and all users
    window.dispatchEvent(new Event('storage'));
    setShowEditDialog(false);
    toast({
      title: "Shop updated globally",
      description: `${editForm.name} settings applied to all users`
    });
  };
  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase());
    // In user view, only show shops that admin has enabled
    if (!isAdminView && shop.adminEnabled === false) {
      return false;
    }
    return matchesSearch;
  });
  return <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {t('settings.shopManagement')}
        </CardTitle>
        <CardDescription>
          {isAdminView ? "Manage shop availability for all users globally" : t('settings.shopManagementDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-0">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('search.placeholder')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        {/* Add New Shop */}
        <div className="flex gap-2">
          <Input placeholder={t('settings.addNewShop')} value={newShopName} onChange={e => setNewShopName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addShop()} />
          <Button onClick={addShop} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Shop List */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="shops">
            {provided => <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 w-full">
              {filteredShops.map((shop, index) => {
              const getStatusBadge = () => {
                if (shop.adminEnabled === false || shop.status === 'deactivated_admin') {
                  return <Badge variant="destructive" className="text-xs">Deactivated by Admin</Badge>;
                }
                if (shop.status === 'coming_soon') {
                  return <Badge variant="outline" className="text-xs bg-muted">Coming Soon</Badge>;
                }
                if (shop.status === 'maintenance') {
                  return <Badge variant="outline" className="text-xs bg-yellow-500/20">Maintenance</Badge>;
                }
                if (shop.status === 'custom' && shop.customStatusText) {
                  return <Badge variant="outline" className="text-xs">{shop.customStatusText}</Badge>;
                }
                if (shop.adminEnabled) {
                  return <Badge variant="secondary" className="text-xs">Available to Users</Badge>;
                }
                return null;
              };
              return <Draggable key={shop.id} draggableId={shop.id} index={index}>
                    {(provided, snapshot) => <div ref={provided.innerRef} {...provided.draggableProps} className={`flex flex-col gap-2 p-3 border rounded-lg bg-card transition-all duration-300 w-full ${snapshot.isDragging ? 'shadow-lg' : ''} ${highlightedShop === shop.id ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : ''}`}>
                        {/* Top row: Grip, Icon, Name, Switch, Actions */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab flex-shrink-0" />
                            </div>
                            <Package className="h-4 w-4 text-muted-foreground hidden md:block flex-shrink-0" />
                            <span className="font-medium truncate">{shop.name}</span>
                          </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isAdminView ? <>
                              <Switch checked={shop.adminEnabled !== false} onCheckedChange={async checked => {
                          setShops(shops.map(s => s.id === shop.id ? {
                            ...s,
                            adminEnabled: checked,
                            enabled: checked ? s.enabled : false
                          } : s));
                          window.dispatchEvent(new Event('storage'));
                          toast({
                            title: checked ? "Shop enabled globally" : "Shop hidden from users",
                            description: checked ? "All users can now see this shop" : "This shop is now hidden from all users"
                          });
                        }} />
                              {/* Desktop buttons */}
                              <Button variant="ghost" size="sm" onClick={() => handleEditShop(shop)} className="hidden md:flex text-primary hover:text-primary">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => removeShop(shop.id)} className="hidden md:flex text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              
                              {/* Mobile dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="md:hidden">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem onClick={() => handleEditShop(shop)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => removeShop(shop.id)} className="text-destructive focus:text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </> : <Switch checked={shop.enabled} onCheckedChange={() => toggleShop(shop.id)} disabled={shop.adminEnabled === false} />}
                          </div>
                        </div>
                        
                        {/* Bottom row: Status badge */}
                        <div className="pl-10 md:pl-11">
                          {getStatusBadge()}
                        </div>
                      </div>}
                  </Draggable>;
            })}
                {provided.placeholder}
              </div>}
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
              <Input value={editForm.name} onChange={e => setEditForm({
              ...editForm,
              name: e.target.value
            })} />
            </div>
            <div>
              <Label>Affiliate URL</Label>
              <Input value={editForm.affiliateUrl} onChange={e => setEditForm({
              ...editForm,
              affiliateUrl: e.target.value
            })} placeholder="https://..." />
            </div>
            <div>
              <Label>Status</Label>
              <select className="w-full p-2 border rounded-md" value={editForm.status} onChange={e => setEditForm({
              ...editForm,
              status: e.target.value as ShopStatus
            })}>
                <option value="active">Active</option>
                <option value="deactivated_admin">Deactivated by Admin</option>
                <option value="coming_soon">Coming Soon</option>
                <option value="maintenance">Deactivated for Maintenance</option>
                <option value="custom">Custom Tag</option>
              </select>
            </div>
            
            {editForm.status === 'custom' && <div>
                <Label>Custom Status Text</Label>
                <Input value={editForm.customStatusText} onChange={e => setEditForm({
              ...editForm,
              customStatusText: e.target.value
            })} placeholder="Enter custom status text" />
              </div>}

            <div className="flex items-center space-x-2">
              <Switch checked={editForm.adminEnabled} onCheckedChange={checked => setEditForm({
              ...editForm,
              adminEnabled: checked
            })} />
              <Label>Admin: Enable Shop Globally (visible to all users)</Label>
            </div>
            
            <p className="text-sm text-muted-foreground">
              When enabled globally, users can toggle it on/off in their settings. When disabled globally, shop is hidden from all users.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>;
}