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
import { 
  GripVertical, Package, Plus, Edit, Trash2, MoreVertical, Megaphone, 
  Image as ImageIcon, ExternalLink, ArrowLeft, Store, Sparkles, 
  CheckCircle2, XCircle, Clock, Wrench, Tag, Link2, Eye, EyeOff
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { getAllStores, getStoreById } from "@/config/stores";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const statusConfig = {
  active: { 
    label: 'Active', 
    icon: CheckCircle2, 
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
  },
  deactivated_admin: { 
    label: 'Deactivated', 
    icon: XCircle, 
    className: 'bg-destructive/10 text-destructive border-destructive/20' 
  },
  coming_soon: { 
    label: 'Coming Soon', 
    icon: Clock, 
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
  },
  maintenance: { 
    label: 'Maintenance', 
    icon: Wrench, 
    className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' 
  },
  custom: { 
    label: 'Custom', 
    icon: Tag, 
    className: 'bg-primary/10 text-primary border-primary/20' 
  }
};

export function ShopManager() {
  const { t } = useLanguage();
  const { toast } = useToast();
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
      const { data, error } = await supabase
        .from('shop_campaigns')
        .select('*')
        .order('shop_id')
        .order('display_order');
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
        await supabase
          .from('shop_campaigns')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
      fetchCampaigns();
    } catch (error) {
      console.error('Error reordering:', error);
    }
  };

  const toggleShop = (id: string) => {
    const shop = shops.find(s => s.id === id);
    if (!shop) return;
    setShops(shops.map(shop => 
      shop.id === id ? { ...shop, enabled: !shop.enabled } : shop
    ));
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
    toast({
      title: "Shop removed",
      description: "The shop has been removed from the list"
    });
  };

  const addShop = () => {
    if (!newShopName.trim()) return;
    const newShop: Shop = {
      id: newShopName.toLowerCase().replace(/\s+/g, '-'),
      name: newShopName.trim(),
      enabled: true,
      affiliateUrl: '',
      adminEnabled: true,
      status: 'active'
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
    setShops(shops.map(shop => 
      shop.id === editingShop.id ? {
        ...shop,
        name: editForm.name,
        affiliateUrl: editForm.affiliateUrl,
        enabled: editForm.adminEnabled ? editForm.enabled : false,
        adminEnabled: editForm.adminEnabled,
        status: editForm.status,
        customStatusText: editForm.customStatusText
      } : shop
    ));
    window.dispatchEvent(new Event('storage'));
    setShowEditDialog(false);
    toast({
      title: "Shop updated",
      description: `${editForm.name} settings have been saved`
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
        const { error } = await supabase
          .from('shop_campaigns')
          .update({
            title: campaignForm.title,
            description: campaignForm.description || null,
            image_url: campaignForm.image_url || null,
            campaign_url: campaignForm.campaign_url,
            is_active: campaignForm.is_active
          })
          .eq('id', editingCampaign.id);
        if (error) throw error;
        toast({ title: "Success", description: "Campaign updated" });
      } else {
        const maxOrder = campaigns
          .filter(c => c.shop_id === selectedShopForCampaigns.id)
          .reduce((max, c) => Math.max(max, c.display_order), 0);
        const { error } = await supabase
          .from('shop_campaigns')
          .insert({
            shop_id: selectedShopForCampaigns.id,
            title: campaignForm.title,
            description: campaignForm.description || null,
            image_url: campaignForm.image_url || null,
            campaign_url: campaignForm.campaign_url,
            is_active: campaignForm.is_active,
            display_order: maxOrder + 1
          });
        if (error) throw error;
        toast({ title: "Success", description: "Campaign created" });
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
      const { error } = await supabase
        .from('shop_campaigns')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Success", description: "Campaign deleted" });
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
      const { error } = await supabase
        .from('shop_campaigns')
        .update({ is_active: !campaign.is_active })
        .eq('id', campaign.id);
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

  const currentShopCampaigns = selectedShopForCampaigns 
    ? campaigns.filter(c => c.shop_id === selectedShopForCampaigns.id) 
    : [];

  const getShopIcon = (shopId: string) => {
    const storeConfig = getStoreById(shopId);
    return storeConfig?.icon;
  };

  // Campaign view
  if (selectedShopForCampaigns) {
    const shopIcon = getShopIcon(selectedShopForCampaigns.id);
    
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSelectedShopForCampaigns(null)} 
                className="h-10 w-10 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                {shopIcon ? (
                  <img src={shopIcon} alt="" className="h-10 w-10 rounded-xl object-cover ring-2 ring-primary/20" />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold">{selectedShopForCampaigns.name}</h2>
                  <p className="text-sm text-muted-foreground">Manage campaigns</p>
                </div>
              </div>
            </div>
            <Button onClick={() => handleOpenCampaignDialog()} className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" />
              Add Campaign
            </Button>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="space-y-3">
          {currentShopCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/5">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Megaphone className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-center">No campaigns yet</p>
              <p className="text-sm text-muted-foreground/70 text-center mt-1">Add your first campaign to get started</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleCampaignDragEnd}>
              <Droppable droppableId="shop-campaigns">
                {provided => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {currentShopCampaigns.map((campaign, index) => (
                      <Draggable key={campaign.id} draggableId={campaign.id} index={index}>
                        {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef} 
                            {...provided.draggableProps}
                            className={`group relative overflow-hidden rounded-xl border bg-card transition-all duration-300 ${
                              snapshot.isDragging ? 'shadow-2xl ring-2 ring-primary/30 scale-[1.02]' : 'hover:shadow-lg hover:border-primary/30'
                            } ${!campaign.is_active ? 'opacity-60' : ''}`}
                          >
                            <div className="flex items-center gap-4 p-4">
                              <div {...provided.dragHandleProps} className="touch-none">
                                <GripVertical className="h-5 w-5 text-muted-foreground/50 cursor-grab active:cursor-grabbing" />
                              </div>

                              <div className="h-16 w-24 rounded-lg overflow-hidden bg-muted flex-shrink-0 ring-1 ring-border/50">
                                {campaign.image_url ? (
                                  <img src={campaign.image_url} alt={campaign.title} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                    <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium truncate">{campaign.title}</span>
                                  {!campaign.is_active && (
                                    <Badge variant="secondary" className="text-xs">Inactive</Badge>
                                  )}
                                </div>
                                {campaign.description && (
                                  <p className="text-sm text-muted-foreground truncate mt-0.5">{campaign.description}</p>
                                )}
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-9 w-9 rounded-lg"
                                  onClick={() => handleToggleCampaignActive(campaign)}
                                >
                                  {campaign.is_active ? (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-9 w-9 rounded-lg"
                                  onClick={() => window.open(campaign.campaign_url, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-9 w-9 rounded-lg"
                                  onClick={() => handleOpenCampaignDialog(campaign)}
                                >
                                  <Edit className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-9 w-9 rounded-lg text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteCampaign(campaign.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Mobile actions */}
                              <div className="md:hidden">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={() => handleToggleCampaignActive(campaign)}>
                                      {campaign.is_active ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                                      {campaign.is_active ? 'Hide' : 'Show'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => window.open(campaign.campaign_url, '_blank')}>
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Open Link
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleOpenCampaignDialog(campaign)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteCampaign(campaign.id)} 
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

        {/* Campaign Dialog */}
        <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                {editingCampaign ? "Edit Campaign" : "Add Campaign"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input 
                  value={campaignForm.title} 
                  onChange={e => setCampaignForm({ ...campaignForm, title: e.target.value })} 
                  placeholder="Campaign title"
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={campaignForm.description} 
                  onChange={e => setCampaignForm({ ...campaignForm, description: e.target.value })} 
                  placeholder="Campaign description"
                  rows={2}
                  className="rounded-lg resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input 
                  value={campaignForm.image_url} 
                  onChange={e => setCampaignForm({ ...campaignForm, image_url: e.target.value })} 
                  placeholder="https://..."
                  className="rounded-lg"
                />
                {campaignForm.image_url && (
                  <div className="mt-2 h-24 rounded-lg overflow-hidden bg-muted ring-1 ring-border">
                    <img 
                      src={campaignForm.image_url} 
                      alt="Preview" 
                      className="h-full w-full object-cover" 
                      onError={e => (e.currentTarget.style.display = 'none')} 
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Campaign URL *</Label>
                <Input 
                  value={campaignForm.campaign_url} 
                  onChange={e => setCampaignForm({ ...campaignForm, campaign_url: e.target.value })} 
                  placeholder="https://..."
                  className="rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Label className="cursor-pointer">Active</Label>
                <Switch 
                  checked={campaignForm.is_active} 
                  onCheckedChange={checked => setCampaignForm({ ...campaignForm, is_active: checked })} 
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowCampaignDialog(false)} className="rounded-lg">
                Cancel
              </Button>
              <Button onClick={handleSaveCampaign} className="rounded-lg">
                {editingCampaign ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Main shop list view
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-4 right-4">
          <Sparkles className="h-24 w-24 text-primary/10" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{t('settings.shopManagement')}</h2>
              <p className="text-sm text-muted-foreground">
                {isAdminView ? "Manage shop availability and campaigns for all users" : t('settings.shopManagementDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Shop - Admin Only */}
      {isAdminView && (
        <div className="flex gap-3">
          <Input 
            placeholder="Enter new shop name..." 
            value={newShopName} 
            onChange={e => setNewShopName(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && addShop()}
            className="flex-1 h-11 rounded-xl bg-background border-muted-foreground/20"
          />
          <Button onClick={addShop} className="h-11 px-5 rounded-xl gap-2">
            <Plus className="h-4 w-4" />
            Add Shop
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-card border">
          <p className="text-2xl font-bold">{shops.length}</p>
          <p className="text-xs text-muted-foreground">Total Shops</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{shops.filter(s => s.enabled && s.adminEnabled !== false).length}</p>
          <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Active</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{shops.filter(s => s.status === 'coming_soon').length}</p>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Coming Soon</p>
        </div>
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-2xl font-bold text-primary">{campaigns.length}</p>
          <p className="text-xs text-primary/70">Campaigns</p>
        </div>
      </div>

      {/* Shop List */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="shops">
          {provided => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {filteredShops.map((shop, index) => {
                const campaignCount = getShopCampaignCount(shop.id);
                const shopIcon = getShopIcon(shop.id);
                const status = shop.adminEnabled === false ? 'deactivated_admin' : (shop.status || 'active');
                const StatusIcon = statusConfig[status]?.icon || CheckCircle2;

                return (
                  <Draggable key={shop.id} draggableId={shop.id} index={index}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.draggableProps}
                        className={`group relative overflow-hidden rounded-xl border bg-card transition-all duration-300 ${
                          snapshot.isDragging ? 'shadow-2xl ring-2 ring-primary/30 scale-[1.02]' : 'hover:shadow-lg hover:border-primary/20'
                        } ${highlightedShop === shop.id ? 'ring-2 ring-primary shadow-lg' : ''}`}
                      >
                        <div className="flex items-center gap-3 p-4">
                          {/* Drag Handle */}
                          <div {...provided.dragHandleProps} className="touch-none hidden md:block">
                            <GripVertical className="h-5 w-5 text-muted-foreground/40 cursor-grab active:cursor-grabbing" />
                          </div>

                          {/* Shop Icon */}
                          {shopIcon ? (
                            <img src={shopIcon} alt="" className="h-10 w-10 rounded-xl object-cover ring-2 ring-border flex-shrink-0" />
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                          )}

                          {/* Shop Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium truncate">{shop.name}</span>
                              {campaignCount > 0 && isAdminView && (
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs cursor-pointer hover:bg-secondary/80"
                                  onClick={() => openCampaignsForShop(shop)}
                                >
                                  <Megaphone className="h-3 w-3 mr-1" />
                                  {campaignCount}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={`text-xs ${statusConfig[status]?.className}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status === 'custom' && shop.customStatusText ? shop.customStatusText : statusConfig[status]?.label}
                              </Badge>
                              {shop.affiliateUrl && (
                                <span className="text-xs text-muted-foreground truncate max-w-[120px] hidden sm:inline">
                                  <Link2 className="h-3 w-3 inline mr-1" />
                                  {shop.affiliateUrl.replace(/^https?:\/\//, '').split('/')[0]}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {isAdminView ? (
                              <>
                                <Switch 
                                  checked={shop.adminEnabled !== false} 
                                  onCheckedChange={async checked => {
                                    setShops(shops.map(s => s.id === shop.id ? {
                                      ...s,
                                      adminEnabled: checked,
                                      enabled: checked ? s.enabled : false
                                    } : s));
                                    window.dispatchEvent(new Event('storage'));
                                    toast({
                                      title: checked ? "Shop enabled" : "Shop hidden",
                                      description: checked ? "All users can now see this shop" : "This shop is now hidden from all users"
                                    });
                                  }} 
                                />

                                {/* Desktop buttons */}
                                <div className="hidden md:flex items-center gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-9 w-9 rounded-lg"
                                    onClick={() => openCampaignsForShop(shop)}
                                  >
                                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-9 w-9 rounded-lg"
                                    onClick={() => handleEditShop(shop)}
                                  >
                                    <Edit className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-9 w-9 rounded-lg text-destructive hover:text-destructive"
                                    onClick={() => removeShop(shop.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>

                                {/* Mobile dropdown */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg md:hidden">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem onClick={() => openCampaignsForShop(shop)}>
                                      <Megaphone className="h-4 w-4 mr-2" />
                                      Campaigns
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditShop(shop)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => removeShop(shop.id)} 
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </>
                            ) : (
                              <Switch 
                                checked={shop.enabled} 
                                onCheckedChange={() => toggleShop(shop.id)} 
                                disabled={shop.adminEnabled === false}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <span>{t('settings.dragToReorder')}</span>
        <span>{shops.filter(s => s.enabled).length} {t('status.active')}</span>
      </div>

      {/* Edit Shop Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Shop
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Shop Name</Label>
              <Input 
                value={editForm.name} 
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>Affiliate URL</Label>
              <Input 
                value={editForm.affiliateUrl} 
                onChange={e => setEditForm({ ...editForm, affiliateUrl: e.target.value })} 
                placeholder="https://..."
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={editForm.status} 
                onValueChange={value => setEditForm({ ...editForm, status: value as ShopStatus })}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="deactivated_admin">Deactivated by Admin</SelectItem>
                  <SelectItem value="coming_soon">Coming Soon</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="custom">Custom Tag</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editForm.status === 'custom' && (
              <div className="space-y-2">
                <Label>Custom Status Text</Label>
                <Input 
                  value={editForm.customStatusText} 
                  onChange={e => setEditForm({ ...editForm, customStatusText: e.target.value })} 
                  placeholder="Enter custom status text"
                  className="rounded-lg"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <Label className="cursor-pointer">Enable Globally</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Visible to all users when enabled</p>
              </div>
              <Switch 
                checked={editForm.adminEnabled} 
                onCheckedChange={checked => setEditForm({ ...editForm, adminEnabled: checked })} 
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="rounded-lg">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="rounded-lg">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}