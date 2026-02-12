import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { edgeFunctionUrl } from "@/config/supabase";
import { Key, Save, Plus, Trash2, AlertTriangle, Shield, RefreshCw, Lock, Zap, CheckCircle, XCircle, Info, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ServiceDependenciesAudit from "./ServiceDependenciesAudit";

interface SecretEntry {
  name: string;
  protected: boolean;
}

export default function ApiSettingsManager() {
  const [secrets, setSecrets] = useState<SecretEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New secret form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  // Update existing secret
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [updatingSaving, setUpdatingSaving] = useState(false);

  // Delete
  const [deleting, setDeleting] = useState<string | null>(null);

  // Test connection
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; status: string; message: string }>>({});

  // AdSense slot settings
  const [adSlots, setAdSlots] = useState({
    adsense_client_id: '',
    adsense_slot_donation: '',
    adsense_slot_product_banner: '',
    adsense_slot_article_inline: '',
    adsense_slot_interstitial: '',
  });
  const [adSlotsLoading, setAdSlotsLoading] = useState(true);
  const [adSlotsSaving, setAdSlotsSaving] = useState(false);

  const fetchSecrets = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        edgeFunctionUrl('manage-secrets'),
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch');
      }

      const data = await res.json();
      setSecrets(data);
    } catch (err: any) {
      console.error('Error fetching secrets:', err);
      toast.error(err.message || 'Failed to load secrets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSecrets();
    fetchAdSlots();
  }, []);

  const fetchAdSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['adsense_client_id', 'adsense_slot_donation', 'adsense_slot_product_banner', 'adsense_slot_article_inline', 'adsense_slot_interstitial']);

      if (error) throw error;

      const updated = { ...adSlots };
      data?.forEach((row) => {
        if (row.setting_key in updated) {
          (updated as any)[row.setting_key] = row.setting_value || '';
        }
      });
      setAdSlots(updated);
    } catch (err) {
      console.error('Failed to load ad slots:', err);
    } finally {
      setAdSlotsLoading(false);
    }
  };

  const handleSaveAdSlots = async () => {
    setAdSlotsSaving(true);
    try {
      for (const [key, value] of Object.entries(adSlots)) {
        const { error } = await supabase
          .from('ad_settings')
          .update({ setting_value: value, updated_at: new Date().toISOString() })
          .eq('setting_key', key);

        if (error) throw error;
      }
      toast.success('AdSense settings saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save ad settings');
    } finally {
      setAdSlotsSaving(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSecrets();
  };

  const handleAddSecret = async () => {
    const trimmedName = newName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const trimmedValue = newValue.trim();

    if (!trimmedName || !trimmedValue) {
      toast.error('Name and value are required');
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        edgeFunctionUrl('manage-secrets'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: trimmedName, value: trimmedValue }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      toast.success(`${trimmedName} saved successfully`);
      setNewName("");
      setNewValue("");
      setShowNewForm(false);
      fetchSecrets();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save secret');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSecret = async (name: string) => {
    const trimmedValue = editValue.trim();
    if (!trimmedValue) {
      toast.error('Value is required');
      return;
    }

    setUpdatingSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        edgeFunctionUrl('manage-secrets'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, value: trimmedValue }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update');
      }

      toast.success(`${name} updated`);
      setEditingName(null);
      setEditValue("");
    } catch (err: any) {
      toast.error(err.message || 'Failed to update secret');
    } finally {
      setUpdatingSaving(false);
    }
  };

  const handleDeleteSecret = async (name: string) => {
    if (!confirm(`Delete secret "${name}"? Edge functions using it will break.`)) return;

    setDeleting(name);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        edgeFunctionUrl('manage-secrets'),
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ names: [name] }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete');
      }

      toast.success(`${name} deleted`);
      setSecrets(prev => prev.filter(s => s.name !== name));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete secret');
    } finally {
      setDeleting(null);
    }
  };

  const handleTestConnection = async (name: string) => {
    setTesting(name);
    setTestResults(prev => { const copy = { ...prev }; delete copy[name]; return copy; });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        edgeFunctionUrl('test-secret-connection'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ secretName: name }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Test failed');

      setTestResults(prev => ({ ...prev, [name]: data }));
      if (data.success) {
        toast.success(`${name}: ${data.message}`);
      } else {
        toast.error(`${name}: ${data.message}`);
      }
    } catch (err: any) {
      const result = { success: false, status: 'error', message: err.message || 'Test failed' };
      setTestResults(prev => ({ ...prev, [name]: result }));
      toast.error(err.message || 'Test failed');
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const userSecrets = secrets.filter(s => !s.protected);
  const protectedSecrets = secrets.filter(s => s.protected);

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4">
      {/* Info */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
        <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">Supabase Edge Function Secrets</p>
          <p className="text-muted-foreground mt-1">
            These secrets are securely stored in Supabase and available as environment variables in all edge functions. Values cannot be viewed after saving — only names are shown.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Key className="w-5 h-5" />
          Secrets ({secrets.length})
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("w-4 h-4 mr-1", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowNewForm(true)} disabled={showNewForm}>
            <Plus className="w-4 h-4 mr-1" />
            Add Secret
          </Button>
        </div>
      </div>

      {/* Add New Secret Form */}
      {showNewForm && (
        <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 space-y-3">
          <Label className="text-sm font-semibold">New Secret</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input
                placeholder="MY_API_KEY"
                value={newName}
                onChange={(e) => setNewName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Value</Label>
              <Input
                type="password"
                placeholder="sk-..."
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddSecret} disabled={saving} size="sm">
              <Save className="w-3.5 h-3.5 mr-1" />
              {saving ? 'Saving...' : 'Save Secret'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowNewForm(false); setNewName(""); setNewValue(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* User Secrets */}
      {userSecrets.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Secrets</Label>
          {userSecrets.map(secret => {
            const testResult = testResults[secret.name];
            return (
            <div key={secret.name} className="space-y-1">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50 group hover:border-primary/20 transition-colors">
                {testResult ? (
                  testResult.success
                    ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    : <XCircle className="w-4 h-4 text-destructive shrink-0" />
                ) : (
                  <Key className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className="font-mono text-sm font-medium flex-1">{secret.name}</span>

                {editingName === secret.name ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="password"
                      placeholder="New value..."
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="font-mono text-xs h-8 w-48"
                      autoFocus
                    />
                    <Button size="sm" className="h-8" onClick={() => handleUpdateSecret(secret.name)} disabled={updatingSaving}>
                      {updatingSaving ? '...' : 'Save'}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8" onClick={() => { setEditingName(null); setEditValue(""); }}>
                      ✕
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleTestConnection(secret.name)}
                      disabled={testing === secret.name}
                    >
                      <Zap className={cn("w-3.5 h-3.5 mr-1", testing === secret.name && "animate-pulse")} />
                      {testing === secret.name ? 'Testing...' : 'Test'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => { setEditingName(secret.name); setEditValue(""); }}
                    >
                      Update
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleDeleteSecret(secret.name)}
                      disabled={deleting === secret.name}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              {testResult && (
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ml-7",
                  testResult.success ? "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/30" : "text-destructive bg-destructive/5"
                )}>
                  <Info className="w-3 h-3 shrink-0" />
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          );
          })}
        </div>
      )}

      {/* Protected Secrets */}
      {protectedSecrets.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Secrets (Protected)</Label>
          {protectedSecrets.map(secret => (
            <div key={secret.name} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30">
              <Lock className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              <span className="font-mono text-sm text-muted-foreground">{secret.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/5">
        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Deleting or modifying secrets used by edge functions will break those functions. Protected system secrets cannot be deleted from this interface.
        </p>
      </div>

      {/* AdSense Slot Configuration */}
      <div className="pt-4 border-t border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MonitorPlay className="w-5 h-5" />
            AdSense Slot IDs
          </h2>
          <Button size="sm" onClick={handleSaveAdSlots} disabled={adSlotsSaving || adSlotsLoading}>
            <Save className={cn("w-4 h-4 mr-1", adSlotsSaving && "animate-spin")} />
            {adSlotsSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Configure your Google AdSense ad slot IDs here. Leave a slot empty to hide that ad placement. Changes take effect immediately after saving.
        </p>

        {adSlotsLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-muted rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Publisher Client ID</Label>
              <Input
                placeholder="ca-pub-XXXXXXXXXXXXX"
                value={adSlots.adsense_client_id}
                onChange={(e) => setAdSlots(prev => ({ ...prev, adsense_client_id: e.target.value }))}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Donation / Support Video Slot</Label>
              <Input
                placeholder="1234567890"
                value={adSlots.adsense_slot_donation}
                onChange={(e) => setAdSlots(prev => ({ ...prev, adsense_slot_donation: e.target.value }))}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Affiliate Product Banner Slot</Label>
              <Input
                placeholder="1234567890"
                value={adSlots.adsense_slot_product_banner}
                onChange={(e) => setAdSlots(prev => ({ ...prev, adsense_slot_product_banner: e.target.value }))}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Article Inline Ad Slot</Label>
              <Input
                placeholder="1234567890"
                value={adSlots.adsense_slot_article_inline}
                onChange={(e) => setAdSlots(prev => ({ ...prev, adsense_slot_article_inline: e.target.value }))}
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Interstitial (Product Click) Slot ID</Label>
              <Input
                placeholder="1234567890"
                value={adSlots.adsense_slot_interstitial}
                onChange={(e) => setAdSlots(prev => ({ ...prev, adsense_slot_interstitial: e.target.value }))}
                className="font-mono text-sm"
              />
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5" />
          Service Dependencies & Migration Guide
        </h2>
        <ServiceDependenciesAudit existingSecrets={secrets.map(s => s.name)} />
      </div>
    </div>
  );
}
