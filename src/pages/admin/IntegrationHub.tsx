import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Plug, ToggleLeft, Plus, Save, Trash2, Power, PowerOff,
  Settings2, Globe, CreditCard, BarChart3, Mail, MessageSquare, Brain,
  ShoppingBag, RefreshCw, ChevronDown, ChevronUp, Flag, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  service_key: string;
  service_name: string;
  category: string;
  is_enabled: boolean;
  config: Record<string, any>;
  secret_keys: string[];
  description: string | null;
  icon_url: string | null;
  docs_url: string | null;
}

interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  is_enabled: boolean;
  category: string;
  description: string | null;
  config: Record<string, any>;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  payment: CreditCard,
  analytics: BarChart3,
  email: Mail,
  sms: MessageSquare,
  ai: Brain,
  affiliate: ShoppingBag,
  general: Globe,
  other: Settings2,
  ui: ToggleLeft,
  backend: Settings2,
  experimental: Sparkles,
};

const CATEGORY_COLORS: Record<string, string> = {
  payment: "text-green-500 bg-green-500/10",
  analytics: "text-blue-500 bg-blue-500/10",
  email: "text-orange-500 bg-orange-500/10",
  sms: "text-purple-500 bg-purple-500/10",
  ai: "text-pink-500 bg-pink-500/10",
  affiliate: "text-amber-500 bg-amber-500/10",
  general: "text-muted-foreground bg-muted/50",
  ui: "text-cyan-500 bg-cyan-500/10",
  backend: "text-indigo-500 bg-indigo-500/10",
  experimental: "text-rose-500 bg-rose-500/10",
};

export default function IntegrationHub() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  
  // New integration form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newService, setNewService] = useState({ service_key: "", service_name: "", category: "general", description: "" });
  
  // New flag form
  const [showNewFlag, setShowNewFlag] = useState(false);
  const [newFlag, setNewFlag] = useState({ flag_key: "", flag_name: "", category: "general", description: "" });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [intRes, flagRes] = await Promise.all([
        supabase.from("service_integrations").select("*").order("category, service_name"),
        supabase.from("feature_flags").select("*").order("category, flag_name"),
      ]);
      if (intRes.data) setIntegrations(intRes.data as Integration[]);
      if (flagRes.data) setFlags(flagRes.data as FeatureFlag[]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load integrations");
    } finally {
      setLoading(false);
    }
  };

  const toggleIntegration = async (id: string, enabled: boolean) => {
    const { error } = await supabase.from("service_integrations").update({ is_enabled: enabled }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, is_enabled: enabled } : i));
    toast.success(enabled ? "Service enabled" : "Service disabled");
  };

  const saveConfig = async (integration: Integration) => {
    setSavingId(integration.id);
    const { error } = await supabase
      .from("service_integrations")
      .update({ config: integration.config })
      .eq("id", integration.id);
    if (error) toast.error("Failed to save config");
    else toast.success("Config saved");
    setSavingId(null);
  };

  const updateLocalConfig = (id: string, key: string, value: string) => {
    setIntegrations(prev =>
      prev.map(i => i.id === id ? { ...i, config: { ...i.config, [key]: value } } : i)
    );
  };

  const toggleFlag = async (id: string, enabled: boolean) => {
    const { error } = await supabase.from("feature_flags").update({ is_enabled: enabled }).eq("id", id);
    if (error) { toast.error("Failed to toggle flag"); return; }
    setFlags(prev => prev.map(f => f.id === id ? { ...f, is_enabled: enabled } : f));
    toast.success(enabled ? "Feature enabled" : "Feature disabled");
  };

  const addIntegration = async () => {
    const key = newService.service_key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!key || !newService.service_name.trim()) { toast.error("Key and name required"); return; }
    const { error } = await supabase.from("service_integrations").insert({
      service_key: key,
      service_name: newService.service_name.trim(),
      category: newService.category,
      description: newService.description.trim() || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Integration added");
    setShowNewForm(false);
    setNewService({ service_key: "", service_name: "", category: "general", description: "" });
    fetchAll();
  };

  const deleteIntegration = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("service_integrations").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    setIntegrations(prev => prev.filter(i => i.id !== id));
    toast.success("Integration deleted");
  };

  const addFlag = async () => {
    const key = newFlag.flag_key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!key || !newFlag.flag_name.trim()) { toast.error("Key and name required"); return; }
    const { error } = await supabase.from("feature_flags").insert({
      flag_key: key,
      flag_name: newFlag.flag_name.trim(),
      category: newFlag.category,
      description: newFlag.description.trim() || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Flag added");
    setShowNewFlag(false);
    setNewFlag({ flag_key: "", flag_name: "", category: "general", description: "" });
    fetchAll();
  };

  const deleteFlag = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const { error } = await supabase.from("feature_flags").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    setFlags(prev => prev.filter(f => f.id !== id));
    toast.success("Flag deleted");
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  const groupedIntegrations = integrations.reduce<Record<string, Integration[]>>((acc, i) => {
    (acc[i.category] ||= []).push(i);
    return acc;
  }, {});

  const groupedFlags = flags.reduce<Record<string, FeatureFlag[]>>((acc, f) => {
    (acc[f.category] ||= []).push(f);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
        <Plug className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">Integration Hub</p>
          <p className="text-muted-foreground mt-1">
            Connect any service, toggle features on/off, and configure everything from here — no code changes needed.
          </p>
        </div>
      </div>

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="w-4 h-4" /> Services ({integrations.length})
          </TabsTrigger>
          <TabsTrigger value="flags" className="gap-2">
            <Flag className="w-4 h-4" /> Feature Flags ({flags.length})
          </TabsTrigger>
        </TabsList>

        {/* === INTEGRATIONS TAB === */}
        <TabsContent value="integrations" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <Button size="sm" onClick={() => setShowNewForm(!showNewForm)}>
              <Plus className="w-4 h-4 mr-1" /> Add Service
            </Button>
            <Button variant="outline" size="sm" onClick={fetchAll}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </div>

          {showNewForm && (
            <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 space-y-3">
              <Label className="text-sm font-semibold">New Service Integration</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="service_key" value={newService.service_key}
                  onChange={e => setNewService(p => ({ ...p, service_key: e.target.value }))} className="font-mono text-sm" />
                <Input placeholder="Service Name" value={newService.service_name}
                  onChange={e => setNewService(p => ({ ...p, service_name: e.target.value }))} />
                <select value={newService.category} onChange={e => setNewService(p => ({ ...p, category: e.target.value }))}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {["payment", "analytics", "email", "sms", "ai", "affiliate", "general", "other"].map(c =>
                    <option key={c} value={c}>{c}</option>)}
                </select>
                <Input placeholder="Description (optional)" value={newService.description}
                  onChange={e => setNewService(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addIntegration}><Save className="w-3.5 h-3.5 mr-1" /> Save</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowNewForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {Object.entries(groupedIntegrations).map(([category, items]) => {
            const Icon = CATEGORY_ICONS[category] || Globe;
            const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.general;
            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", color)}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{category}</span>
                </div>
                {items.map(integration => {
                  const expanded = expandedId === integration.id;
                  const configKeys = Object.keys(integration.config);
                  return (
                    <div key={integration.id} className="rounded-xl border border-border bg-card/50 overflow-hidden">
                      <div className="flex items-center gap-3 p-3">
                        <Switch
                          checked={integration.is_enabled}
                          onCheckedChange={(v) => toggleIntegration(integration.id, v)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{integration.service_name}</span>
                            <Badge variant={integration.is_enabled ? "default" : "secondary"} className="text-[10px] h-5">
                              {integration.is_enabled ? "Active" : "Off"}
                            </Badge>
                          </div>
                          {integration.description && (
                            <p className="text-xs text-muted-foreground truncate">{integration.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {configKeys.length > 0 && (
                            <Button variant="ghost" size="sm" className="h-8" onClick={() => setExpandedId(expanded ? null : integration.id)}>
                              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive"
                            onClick={() => deleteIntegration(integration.id, integration.service_name)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {expanded && configKeys.length > 0 && (
                        <div className="border-t border-border p-3 space-y-3 bg-muted/20">
                          {integration.secret_keys.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Required secrets: <span className="font-mono">{integration.secret_keys.join(", ")}</span>
                            </div>
                          )}
                          <div className="space-y-2">
                            {configKeys.map(key => (
                              <div key={key} className="flex items-center gap-2">
                                <Label className="text-xs font-mono w-40 shrink-0">{key}</Label>
                                <Input
                                  value={integration.config[key] ?? ""}
                                  onChange={e => updateLocalConfig(integration.id, key, e.target.value)}
                                  className="text-sm h-8"
                                  placeholder={`Enter ${key}...`}
                                />
                              </div>
                            ))}
                          </div>
                          <Button size="sm" onClick={() => saveConfig(integration)} disabled={savingId === integration.id}>
                            <Save className="w-3.5 h-3.5 mr-1" />
                            {savingId === integration.id ? "Saving..." : "Save Config"}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </TabsContent>

        {/* === FEATURE FLAGS TAB === */}
        <TabsContent value="flags" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <Button size="sm" onClick={() => setShowNewFlag(!showNewFlag)}>
              <Plus className="w-4 h-4 mr-1" /> Add Flag
            </Button>
          </div>

          {showNewFlag && (
            <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 space-y-3">
              <Label className="text-sm font-semibold">New Feature Flag</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="flag_key" value={newFlag.flag_key}
                  onChange={e => setNewFlag(p => ({ ...p, flag_key: e.target.value }))} className="font-mono text-sm" />
                <Input placeholder="Flag Name" value={newFlag.flag_name}
                  onChange={e => setNewFlag(p => ({ ...p, flag_name: e.target.value }))} />
                <select value={newFlag.category} onChange={e => setNewFlag(p => ({ ...p, category: e.target.value }))}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {["ui", "backend", "experimental", "general"].map(c =>
                    <option key={c} value={c}>{c}</option>)}
                </select>
                <Input placeholder="Description (optional)" value={newFlag.description}
                  onChange={e => setNewFlag(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addFlag}><Save className="w-3.5 h-3.5 mr-1" /> Save</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowNewFlag(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {Object.entries(groupedFlags).map(([category, items]) => {
            const Icon = CATEGORY_ICONS[category] || Flag;
            const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.general;
            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", color)}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{category}</span>
                </div>
                {items.map(flag => (
                  <div key={flag.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50">
                    <Switch checked={flag.is_enabled} onCheckedChange={v => toggleFlag(flag.id, v)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{flag.flag_name}</span>
                        <Badge variant={flag.is_enabled ? "default" : "secondary"} className="text-[10px] h-5">
                          {flag.is_enabled ? "On" : "Off"}
                        </Badge>
                      </div>
                      {flag.description && (
                        <p className="text-xs text-muted-foreground">{flag.description}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{flag.flag_key}</span>
                    <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive"
                      onClick={() => deleteFlag(flag.id, flag.flag_name)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
