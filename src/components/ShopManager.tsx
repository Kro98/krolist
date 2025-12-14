import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Package, Plus, Edit, Trash2, MoreVertical, Megaphone, Image as ImageIcon, ExternalLink, ArrowLeft } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getAllStores } from "@/config/stores";
import { supabase } from "@/integrations/supabase/client";
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
interface ShopCampaign {
  id: string;
  shop_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  campaign_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

  // Campaign management state
  const [campaigns, setCampaigns] = useState<ShopCampaign[]>([]);
  const [selectedShopForCampaigns, setSelectedShopForCampaigns] = useState<Shop | null>(null);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<ShopCampaign | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    title: "",
    description: "",
    image_url: "",
    campaign_url: "",
    is_active: true
  });
  useEffect(() => {
    localStorage.setItem('shopOrder', JSON.stringify(shops));
    window.dispatchEvent(new Event('shopOrderUpdated'));
  }, [shops]);
  useEffect(() => {
    if (isAdminView) {
      fetchCampaigns();
    }
  }, [isAdminView]);
  const fetchCampaigns = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('shop_campaigns').select('*').order('shop_id').order('display_order');
      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };
  const getShopCampaignCount = (shopId: string) => {
    return campaigns.filter(c => c.shop_id === shopId).length;
  };
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(shops);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setShops(items);
  };
  const handleCampaignDragEnd = async (result: any) => {
    if (!result.destination || !selectedShopForCampaigns) return;
    const shopCampaigns = campaigns.filter(c => c.shop_id === selectedShopForCampaigns.id);
    const items = Array.from(shopCampaigns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    const updates = items.map((item, index) => ({
      id: item.id,
      display_order: index + 1
    }));
    try {
      for (const update of updates) {
        await supabase.from('shop_campaigns').update({
          display_order: update.display_order
        }).eq('id', update.id);
      }
      fetchCampaigns();
    } catch (error) {
      console.error('Error reordering:', error);
    }
  };
  const toggleShop = (id: string) => {
    const shop = shops.find(s => s.id === id);
    if (!shop) return;
    setShops(shops.map(shop => shop.id === id ? {
      ...shop,
      enabled: !shop.enabled
    } : shop));
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
    setShops(shops.map(shop => shop.id === editingShop.id ? {
      ...shop,
      name: editForm.name,
      affiliateUrl: editForm.affiliateUrl,
      enabled: editForm.adminEnabled ? editForm.enabled : false,
      adminEnabled: editForm.adminEnabled,
      status: editForm.status,
      customStatusText: editForm.customStatusText
    } : shop));
    window.dispatchEvent(new Event('storage'));
    setShowEditDialog(false);
    toast({
      title: "Shop updated globally",
      description: `${editForm.name} settings applied to all users`
    });
  };

  // Campaign functions
  const openCampaignsForShop = (shop: Shop) => {
    setSelectedShopForCampaigns(shop);
  };
  const handleOpenCampaignDialog = (campaign?: ShopCampaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setCampaignForm({
        title: campaign.title,
        description: campaign.description || "",
        image_url: campaign.image_url || "",
        campaign_url: campaign.campaign_url,
        is_active: campaign.is_active
      });
    } else {
      setEditingCampaign(null);
      setCampaignForm({
        title: "",
        description: "",
        image_url: "",
        campaign_url: "",
        is_active: true
      });
    }
    setShowCampaignDialog(true);
  };
  const handleSaveCampaign = async () => {
    if (!selectedShopForCampaigns || !campaignForm.title || !campaignForm.campaign_url) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    try {
      if (editingCampaign) {
        const {
          error
        } = await supabase.from('shop_campaigns').update({
          title: campaignForm.title,
          description: campaignForm.description || null,
          image_url: campaignForm.image_url || null,
          campaign_url: campaignForm.campaign_url,
          is_active: campaignForm.is_active
        }).eq('id', editingCampaign.id);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Campaign updated"
        });
      } else {
        const maxOrder = campaigns.filter(c => c.shop_id === selectedShopForCampaigns.id).reduce((max, c) => Math.max(max, c.display_order), 0);
        const {
          error
        } = await supabase.from('shop_campaigns').insert({
          shop_id: selectedShopForCampaigns.id,
          title: campaignForm.title,
          description: campaignForm.description || null,
          image_url: campaignForm.image_url || null,
          campaign_url: campaignForm.campaign_url,
          is_active: campaignForm.is_active,
          display_order: maxOrder + 1
        });
        if (error) throw error;
        toast({
          title: "Success",
          description: "Campaign created"
        });
      }
      setShowCampaignDialog(false);
      fetchCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Error",
        description: "Failed to save campaign",
        variant: "destructive"
      });
    }
  };
  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      const {
        error
      } = await supabase.from('shop_campaigns').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Campaign deleted"
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive"
      });
    }
  };
  const handleToggleCampaignActive = async (campaign: ShopCampaign) => {
    try {
      const {
        error
      } = await supabase.from('shop_campaigns').update({
        is_active: !campaign.is_active
      }).eq('id', campaign.id);
      if (error) throw error;
      fetchCampaigns();
    } catch (error) {
      console.error('Error toggling campaign:', error);
    }
  };
  const filteredShops = shops.filter(shop => {
    if (!isAdminView && shop.adminEnabled === false) {
      return false;
    }
    return true;
  });
  const currentShopCampaigns = selectedShopForCampaigns ? campaigns.filter(c => c.shop_id === selectedShopForCampaigns.id) : [];

  // If viewing campaigns for a specific shop
  if (selectedShopForCampaigns) {
    return <Card className="shadow-card">
        <CardHeader className="mx-0 px-[5px] py-[15px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedShopForCampaigns(null)} className="text-justify">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2 text-justify text-base">
                  <Megaphone className="h-5 w-5 text-primary" />
                  {selectedShopForCampaigns.name} Campaigns
                </CardTitle>
                
              </div>
            </div>
            <Button onClick={() => handleOpenCampaignDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              ​ADD
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentShopCampaigns.length === 0 ? <div className="text-center py-8 text-muted-foreground">
              No campaigns found. Add one to get started.
            </div> : <DragDropContext onDragEnd={handleCampaignDragEnd}>
              <Droppable droppableId="shop-campaigns">
                {provided => <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {currentShopCampaigns.map((campaign, index) => <Draggable key={campaign.id} draggableId={campaign.id} index={index}>
                        {(provided, snapshot) => <div ref={provided.innerRef} {...provided.draggableProps} className={`flex items-center gap-3 p-3 border rounded-lg bg-card ${snapshot.isDragging ? 'shadow-lg' : ''} ${!campaign.is_active ? 'opacity-50' : ''}`}>
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                            </div>

                            <div className="h-12 w-16 rounded overflow-hidden bg-muted flex-shrink-0">
                              {campaign.image_url ? <img src={campaign.image_url} alt={campaign.title} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center">
                                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                </div>}
                            </div>

                            <div className="flex-1 min-w-0">
                              <span className="font-medium truncate block">{campaign.title}</span>
                              {campaign.description && <p className="text-sm text-muted-foreground truncate">
                                  {campaign.description}
                                </p>}
                            </div>

                            <div className="flex items-center gap-2">
                              <Switch checked={campaign.is_active} onCheckedChange={() => handleToggleCampaignActive(campaign)} />
                              <Button variant="ghost" size="sm" onClick={() => window.open(campaign.campaign_url, '_blank')}>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleOpenCampaignDialog(campaign)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteCampaign(campaign.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>}
                      </Draggable>)}
                    {provided.placeholder}
                  </div>}
              </Droppable>
            </DragDropContext>}
        </CardContent>

        {/* Campaign Dialog */}
        <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCampaign ? "Edit Campaign" : "Add Campaign"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={campaignForm.title} onChange={e => setCampaignForm({
                ...campaignForm,
                title: e.target.value
              })} placeholder="Campaign title" />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea value={campaignForm.description} onChange={e => setCampaignForm({
                ...campaignForm,
                description: e.target.value
              })} placeholder="Campaign description" rows={2} />
              </div>

              <div>
                <Label>Image URL</Label>
                <Input value={campaignForm.image_url} onChange={e => setCampaignForm({
                ...campaignForm,
                image_url: e.target.value
              })} placeholder="https://..." />
                {campaignForm.image_url && <div className="mt-2 h-24 rounded overflow-hidden bg-muted">
                    <img src={campaignForm.image_url} alt="Preview" className="h-full w-full object-cover" onError={e => e.currentTarget.style.display = 'none'} />
                  </div>}
              </div>

              <div>
                <Label>Campaign URL *</Label>
                <Input value={campaignForm.campaign_url} onChange={e => setCampaignForm({
                ...campaignForm,
                campaign_url: e.target.value
              })} placeholder="https://..." />
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={campaignForm.is_active} onCheckedChange={checked => setCampaignForm({
                ...campaignForm,
                is_active: checked
              })} />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCampaign}>
                {editingCampaign ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>;
  }

  // Main shop list view
  return <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {t('settings.shopManagement')}
        </CardTitle>
        <CardDescription>
          {isAdminView ? "Manage shop availability and campaigns for all users" : t('settings.shopManagementDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-0 mx-0">
        {/* Add New Shop and Campaign buttons */}
        {isAdminView && <div className="flex gap-2 px-6">
            <Input placeholder="New shop name" value={newShopName} onChange={e => setNewShopName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addShop()} className="flex-1" />
            <Button onClick={addShop} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Shop
            </Button>
          </div>}

        {/* Shop List */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="shops">
            {provided => <div ref={provided.innerRef} className="space-y-2 w-full px-[5px]">
                {filteredShops.map((shop, index) => {
              const campaignCount = getShopCampaignCount(shop.id);
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
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab flex-shrink-0" />
                              </div>
                              <Package className="h-4 w-4 text-muted-foreground hidden md:block flex-shrink-0" />
                              <span className="font-medium truncate">{shop.name}</span>
                              
                              {/* Campaign button - only show in admin view and if shop has campaigns */}
                              {isAdminView && campaignCount > 0 && <Button variant="ghost" size="sm" onClick={() => openCampaignsForShop(shop)} className="text-primary hover:text-primary gap-1">
                                  <Megaphone className="h-4 w-4" />
                                  <span className="text-xs">{campaignCount}</span>
                                </Button>}
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
                                  <Button variant="ghost" size="sm" onClick={() => openCampaignsForShop(shop)} className="hidden md:flex text-primary hover:text-primary" title="Manage campaigns">
                                    <Megaphone className="h-4 w-4" />
                                  </Button>
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
                                      <DropdownMenuItem onClick={() => openCampaignsForShop(shop)}>
                                        <Megaphone className="h-4 w-4 mr-2" />
                                        Campaigns
                                      </DropdownMenuItem>
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

        <div className="text-sm text-muted-foreground px-6">
          {t('settings.dragToReorder')} • {shops.filter(s => s.enabled).length} {t('status.active')}
        </div>
      </CardContent>

      {/* Edit Shop Dialog */}
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
              <select className="w-full p-2 border rounded-md bg-background" value={editForm.status} onChange={e => setEditForm({
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