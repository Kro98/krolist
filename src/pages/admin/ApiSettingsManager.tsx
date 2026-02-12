import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Key, Eye, EyeOff, Save, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  key_name: string;
  key_value: string;
  description: string;
  is_active: boolean;
  updated_at: string;
}

export default function ApiSettingsManager() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);

  // New key form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [newKeyDesc, setNewKeyDesc] = useState("");

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('category', 'api_settings')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const keys: ApiKey[] = (data || []).map(row => {
        let parsed: { value?: string; description?: string; is_active?: boolean } = {};
        try {
          parsed = JSON.parse(row.content_en);
        } catch {
          parsed = { value: row.content_en, description: row.description || '', is_active: true };
        }
        return {
          id: row.id,
          key_name: row.page_key.replace('api_key_', ''),
          key_value: parsed.value || '',
          description: parsed.description || row.description || '',
          is_active: parsed.is_active !== false,
          updated_at: row.updated_at || '',
        };
      });

      setApiKeys(keys);
    } catch (err) {
      console.error('Error fetching API keys:', err);
      toast.error('Failed to load API settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const maskValue = (value: string) => {
    if (value.length <= 8) return '•'.repeat(value.length);
    return value.slice(0, 4) + '•'.repeat(Math.min(value.length - 8, 20)) + value.slice(-4);
  };

  const saveKey = async (key: ApiKey) => {
    setSaving(key.id);
    try {
      const { error } = await supabase
        .from('page_content')
        .update({
          content_en: JSON.stringify({
            value: key.key_value,
            description: key.description,
            is_active: key.is_active,
          }),
          description: key.description,
          updated_by: user?.id,
        })
        .eq('id', key.id);

      if (error) throw error;
      toast.success(`${key.key_name} updated`);
    } catch (err) {
      console.error('Error saving API key:', err);
      toast.error('Failed to save');
    } finally {
      setSaving(null);
    }
  };

  const addNewKey = async () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) {
      toast.error('Name and value are required');
      return;
    }

    setSaving('new');
    try {
      const pageKey = `api_key_${newKeyName.trim().toLowerCase().replace(/\s+/g, '_')}`;

      const { error } = await supabase
        .from('page_content')
        .upsert({
          page_key: pageKey,
          content_en: JSON.stringify({
            value: newKeyValue.trim(),
            description: newKeyDesc.trim(),
            is_active: true,
          }),
          description: newKeyDesc.trim(),
          category: 'api_settings',
          updated_by: user?.id,
        }, { onConflict: 'page_key' });

      if (error) throw error;

      toast.success(`${newKeyName} added`);
      setNewKeyName("");
      setNewKeyValue("");
      setNewKeyDesc("");
      setShowNewForm(false);
      fetchApiKeys();
    } catch (err) {
      console.error('Error adding API key:', err);
      toast.error('Failed to add key');
    } finally {
      setSaving(null);
    }
  };

  const deleteKey = async (key: ApiKey) => {
    if (!confirm(`Delete "${key.key_name}"? This cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('page_content')
        .delete()
        .eq('id', key.id);

      if (error) throw error;
      toast.success(`${key.key_name} deleted`);
      setApiKeys(prev => prev.filter(k => k.id !== key.id));
    } catch (err) {
      console.error('Error deleting API key:', err);
      toast.error('Failed to delete');
    }
  };

  const updateLocalKey = (id: string, field: keyof ApiKey, value: string | boolean) => {
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, [field]: value } : k));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4">
      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-destructive">Sensitive Data</p>
          <p className="text-muted-foreground mt-1">
            API keys stored here are saved in the database. For production secrets, use Supabase Edge Function secrets instead.
          </p>
        </div>
      </div>

      {/* Existing Keys */}
      {apiKeys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Manage your API keys and credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {apiKeys.map(key => (
              <div key={key.id} className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{key.key_name}</p>
                    {key.description && (
                      <p className="text-xs text-muted-foreground">{key.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleVisibility(key.id)}
                    >
                      {visibleKeys.has(key.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteKey(key)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    type={visibleKeys.has(key.id) ? "text" : "password"}
                    value={key.key_value}
                    onChange={(e) => updateLocalKey(key.id, 'key_value', e.target.value)}
                    className="font-mono text-xs flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => saveKey(key)}
                    disabled={saving === key.id}
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    {saving === key.id ? '...' : 'Save'}
                  </Button>
                </div>

                {key.updated_at && (
                  <p className="text-[10px] text-muted-foreground">
                    Last updated: {new Date(key.updated_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add New Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            {showNewForm ? 'New API Key' : 'Add API Key'}
          </CardTitle>
        </CardHeader>
        {showNewForm ? (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Key Name</Label>
              <Input
                placeholder="e.g. OPENAI_API_KEY"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Value</Label>
              <Input
                type="password"
                placeholder="sk-..."
                value={newKeyValue}
                onChange={(e) => setNewKeyValue(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Description (optional)</Label>
              <Input
                placeholder="Used for AI product search"
                value={newKeyDesc}
                onChange={(e) => setNewKeyDesc(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addNewKey} disabled={saving === 'new'} className="flex-1">
                {saving === 'new' ? 'Adding...' : 'Add Key'}
              </Button>
              <Button variant="outline" onClick={() => setShowNewForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        ) : (
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => setShowNewForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add New API Key
            </Button>
          </CardContent>
        )}
      </Card>

      {apiKeys.length === 0 && !showNewForm && (
        <div className="text-center py-12 text-muted-foreground">
          <Key className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No API keys configured yet.</p>
        </div>
      )}
    </div>
  );
}
