import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, GripVertical, Image as ImageIcon, ExternalLink, Megaphone } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { getAllStores } from "@/config/stores";

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

export function ShopCampaignsManager() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<ShopCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<ShopCampaign | null>(null);
  const [formData, setFormData] = useState({
    shop_id: "",
    title: "",
    description: "",
    image_url: "",
    campaign_url: "",
    is_active: true
  });

  const stores = getAllStores().filter(s => !s.comingSoon);

  useEffect(() => {
    fetchCampaigns();
  }, []);

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
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (campaign?: ShopCampaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        shop_id: campaign.shop_id,
        title: campaign.title,
        description: campaign.description || "",
        image_url: campaign.image_url || "",
        campaign_url: campaign.campaign_url,
        is_active: campaign.is_active
      });
    } else {
      setEditingCampaign(null);
      setFormData({
        shop_id: selectedShop !== "all" ? selectedShop : stores[0]?.id || "",
        title: "",
        description: "",
        image_url: "",
        campaign_url: "",
        is_active: true
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.shop_id || !formData.title || !formData.campaign_url) {
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
            shop_id: formData.shop_id,
            title: formData.title,
            description: formData.description || null,
            image_url: formData.image_url || null,
            campaign_url: formData.campaign_url,
            is_active: formData.is_active
          })
          .eq('id', editingCampaign.id);

        if (error) throw error;
        toast({ title: "Success", description: "Campaign updated" });
      } else {
        const maxOrder = campaigns
          .filter(c => c.shop_id === formData.shop_id)
          .reduce((max, c) => Math.max(max, c.display_order), 0);

        const { error } = await supabase
          .from('shop_campaigns')
          .insert({
            ...formData,
            description: formData.description || null,
            image_url: formData.image_url || null,
            display_order: maxOrder + 1
          });

        if (error) throw error;
        toast({ title: "Success", description: "Campaign created" });
      }

      setShowDialog(false);
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

  const handleDelete = async (id: string) => {
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

  const handleToggleActive = async (campaign: ShopCampaign) => {
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

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const shopCampaigns = filteredCampaigns;
    const items = Array.from(shopCampaigns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update display orders
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

  const filteredCampaigns = selectedShop === "all" 
    ? campaigns 
    : campaigns.filter(c => c.shop_id === selectedShop);

  const getShopName = (shopId: string) => {
    const store = stores.find(s => s.id === shopId);
    return store?.displayName || shopId;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Shop Campaigns
            </CardTitle>
            <CardDescription>
              Manage promotional links shown in shop dialogs
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Campaign
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shop Filter */}
        <div className="flex items-center gap-2">
          <Label>Filter by Shop:</Label>
          <Select value={selectedShop} onValueChange={setSelectedShop}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shops</SelectItem>
              {stores.map(store => (
                <SelectItem key={store.id} value={store.id}>
                  {store.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Campaigns List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No campaigns found. Add one to get started.
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="campaigns">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {filteredCampaigns.map((campaign, index) => (
                    <Draggable key={campaign.id} draggableId={campaign.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-3 p-3 border rounded-lg bg-card ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          } ${!campaign.is_active ? 'opacity-50' : ''}`}
                        >
                          <div {...provided.dragHandleProps}>
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          </div>

                          {/* Image Preview */}
                          <div className="h-12 w-16 rounded overflow-hidden bg-muted flex-shrink-0">
                            {campaign.image_url ? (
                              <img 
                                src={campaign.image_url} 
                                alt={campaign.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{campaign.title}</span>
                              <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                                {getShopName(campaign.shop_id)}
                              </span>
                            </div>
                            {campaign.description && (
                              <p className="text-sm text-muted-foreground truncate">
                                {campaign.description}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={campaign.is_active}
                              onCheckedChange={() => handleToggleActive(campaign)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(campaign.campaign_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(campaign)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(campaign.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? "Edit Campaign" : "Add Campaign"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Shop *</Label>
              <Select 
                value={formData.shop_id} 
                onValueChange={(v) => setFormData({ ...formData, shop_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a shop" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Campaign title"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Campaign description"
                rows={2}
              />
            </div>

            <div>
              <Label>Image URL</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
              {formData.image_url && (
                <div className="mt-2 h-24 rounded overflow-hidden bg-muted">
                  <img 
                    src={formData.image_url} 
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
            </div>

            <div>
              <Label>Campaign URL *</Label>
              <Input
                value={formData.campaign_url}
                onChange={(e) => setFormData({ ...formData, campaign_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingCampaign ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
