import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Lock, Unlock, Settings, Image, Upload, X, Sparkles, Sun, Moon, RotateCcw,
  Eye, Contrast, Droplets, ZoomIn, Move, ChevronDown,
  Monitor, Tablet, Smartphone, PanelTop, Square, Columns, Palette, Copy, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast as sonnerToast } from "sonner";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

// ─── Types ───────────────────────────────────────────────────
type DeviceKey = 'desktop' | 'tablet' | 'mobile';
type BgSettings = { blur: number; opacity: number; overlay: number; brightness: number; saturation: number; scale: number; posX: number; posY: number };
type ElementKey = 'card' | 'border' | 'header';
type ElementStyle = { blur: number; opacity: number; color: string };

const defaultBg: BgSettings = { blur: 0, opacity: 20, overlay: 60, brightness: 100, saturation: 100, scale: 100, posX: 50, posY: 50 };
const devices: DeviceKey[] = ['desktop', 'tablet', 'mobile'];
const bgFieldKeys = ['blur', 'opacity', 'overlay', 'brightness', 'saturation', 'scale', 'pos_x', 'pos_y'] as const;
const elementKeys: ElementKey[] = ['card', 'border', 'header'];
const elementFieldKeys = ['blur', 'opacity', 'color'] as const;

// ─── Sub-components ──────────────────────────────────────────

function SettingsSection({ icon: Icon, title, description, children, defaultOpen = false, badge }: {
  icon: React.ElementType; title: string; description: string; children: React.ReactNode; defaultOpen?: boolean; badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-border/40 overflow-hidden"
        style={{
          backdropFilter: `blur(var(--admin-card-blur, 12px))`,
          backgroundColor: `var(--admin-card-color, hsl(var(--card)))`,
          opacity: `var(--admin-card-opacity, 0.8)`,
        }}
      >
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 p-4 sm:p-5 hover:bg-accent/30 transition-colors group">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{title}</h3>
                {badge && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">{badge}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0",
              open && "rotate-180"
            )} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 sm:px-5 sm:pb-5 border-t border-border/30 pt-4 space-y-4">
            {children}
          </div>
        </CollapsibleContent>
      </motion.div>
    </Collapsible>
  );
}

function SliderControl({ icon: Icon, label, value, onChange, min, max, step, unit = "" }: {
  icon: React.ElementType; label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; unit?: string;
}) {
  return (
    <div className="space-y-1.5 p-2.5 rounded-xl bg-background/30 border border-border/20 hover:border-primary/15 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">{label}</span>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground tabular-nums">{value}{unit}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} className="py-0.5" />
    </div>
  );
}

function DeviceSelector({ selected, onSelect }: { selected: DeviceKey; onSelect: (d: DeviceKey) => void }) {
  const items = [
    { key: 'desktop' as DeviceKey, icon: Monitor, label: 'Desktop' },
    { key: 'tablet' as DeviceKey, icon: Tablet, label: 'Tablet' },
    { key: 'mobile' as DeviceKey, icon: Smartphone, label: 'Mobile' },
  ];
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-background/30 border border-border/20">
      {items.map(d => {
        const DIcon = d.icon;
        const isActive = selected === d.key;
        return (
          <button
            key={d.key}
            onClick={() => onSelect(d.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
            )}
          >
            <DIcon className="w-3.5 h-3.5" />
            <span>{d.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ElementSelector({ selected, onSelect }: { selected: ElementKey; onSelect: (e: ElementKey) => void }) {
  const items = [
    { key: 'card' as ElementKey, icon: Square, label: 'Cards' },
    { key: 'border' as ElementKey, icon: Columns, label: 'Borders' },
    { key: 'header' as ElementKey, icon: PanelTop, label: 'Header' },
  ];
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-background/30 border border-border/20">
      {items.map(el => {
        const ElIcon = el.icon;
        const isActive = selected === el.key;
        return (
          <button
            key={el.key}
            onClick={() => onSelect(el.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
            )}
          >
            <ElIcon className="w-3.5 h-3.5" />
            <span>{el.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export default function AdminSettings() {
  // Section locks
  const [articlesLocked, setArticlesLocked] = useState(false);
  const [stickersLocked, setStickersLocked] = useState(false);
  const [aurasEnabled, setAurasEnabled] = useState(false);
  const [loadingLocks, setLoadingLocks] = useState(true);

  // Page background toggles
  const [pageBgToggles, setPageBgToggles] = useState<Record<string, boolean>>({
    affiliate: false,
    articles: false,
    stickers: false,
  });

  // Background settings
  const [bgImageUrl, setBgImageUrl] = useState("");
  const [deviceSettings, setDeviceSettings] = useState<Record<DeviceKey, BgSettings>>({
    desktop: { ...defaultBg }, tablet: { ...defaultBg }, mobile: { ...defaultBg },
  });
  const [selectedDevice, setSelectedDevice] = useState<DeviceKey>('desktop');
  const [savingBg, setSavingBg] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [isDraggingPos, setIsDraggingPos] = useState(false);

  // Element styles
  const [elementStyles, setElementStyles] = useState<Record<ElementKey, ElementStyle>>({
    card: { blur: 12, opacity: 80, color: '' },
    border: { blur: 0, opacity: 50, color: '' },
    header: { blur: 24, opacity: 80, color: '' },
  });
  const [selectedElement, setSelectedElement] = useState<ElementKey>('card');
  const [showElementsInPreview, setShowElementsInPreview] = useState(false);

  const savedStateRef = useRef<string>("");
  const initializedRef = useRef(false);

  const currentBg = deviceSettings[selectedDevice];
  const currentElement = elementStyles[selectedElement];

  const updateCurrentBg = (patch: Partial<BgSettings>) => {
    setDeviceSettings(prev => ({ ...prev, [selectedDevice]: { ...prev[selectedDevice], ...patch } }));
  };
  const updateElement = (patch: Partial<ElementStyle>) => {
    setElementStyles(prev => ({ ...prev, [selectedElement]: { ...prev[selectedElement], ...patch } }));
  };

  const currentSettingsSnapshot = useMemo(() =>
    JSON.stringify({ bgImageUrl, deviceSettings, elementStyles }),
    [bgImageUrl, deviceSettings, elementStyles]
  );
  const isDirty = savedStateRef.current !== '' && currentSettingsSnapshot !== savedStateRef.current;
  const { UnsavedChangesDialog } = useUnsavedChanges(isDirty);

  useEffect(() => {
    fetchSectionLocks();
    fetchBgSettings();
  }, []);

  useEffect(() => {
    if (!loadingLocks && !initializedRef.current && currentSettingsSnapshot) {
      initializedRef.current = true;
      savedStateRef.current = currentSettingsSnapshot;
    }
  }, [loadingLocks, currentSettingsSnapshot]);

  // ─── Data fetching ─────────────────────────────────────────

  const fetchSectionLocks = async () => {
    try {
      const { data, error } = await supabase
        .from('page_content')
        .select('page_key, content_en')
        .in('page_key', ['section_lock_articles', 'section_lock_stickers', 'product_auras_enabled', 'bg_enabled_affiliate', 'bg_enabled_articles', 'bg_enabled_stickers']);
      if (!error && data) {
        data.forEach(row => {
          if (row.page_key === 'section_lock_articles') setArticlesLocked(row.content_en === 'locked');
          if (row.page_key === 'section_lock_stickers') setStickersLocked(row.content_en === 'locked');
          if (row.page_key === 'product_auras_enabled') setAurasEnabled(row.content_en === 'true');
          if (row.page_key.startsWith('bg_enabled_')) {
            const page = row.page_key.replace('bg_enabled_', '');
            setPageBgToggles(prev => ({ ...prev, [page]: row.content_en === 'true' }));
          }
        });
      }
    } catch (err) {
      console.error('Error fetching section locks:', err);
    } finally {
      setLoadingLocks(false);
    }
  };

  const toggleSectionLock = async (section: 'articles' | 'stickers', locked: boolean) => {
    const pageKey = `section_lock_${section}`;
    try {
      const { error } = await supabase.from('page_content').upsert({
        page_key: pageKey, content_en: locked ? 'locked' : 'unlocked',
        description: `Lock toggle for ${section} section`,
      }, { onConflict: 'page_key' });
      if (error) throw error;
      if (section === 'articles') setArticlesLocked(locked);
      if (section === 'stickers') setStickersLocked(locked);
      sonnerToast.success(locked ? `${section} section locked` : `${section} section unlocked`);
    } catch (err) {
      console.error('Error toggling section lock:', err);
      sonnerToast.error('Failed to update section lock');
    }
  };

  const toggleAuras = async (enabled: boolean) => {
    try {
      const { error } = await supabase.from('page_content').upsert({
        page_key: 'product_auras_enabled', content_en: enabled ? 'true' : 'false',
        description: 'Toggle price aura effects on product cards',
      }, { onConflict: 'page_key' });
      if (error) throw error;
      setAurasEnabled(enabled);
      sonnerToast.success(enabled ? 'Price auras enabled' : 'Price auras disabled');
    } catch (err) {
      console.error('Error toggling auras:', err);
      sonnerToast.error('Failed to update aura setting');
    }
  };

  const togglePageBg = async (page: string, enabled: boolean) => {
    const pageKey = `bg_enabled_${page}`;
    try {
      const { error } = await supabase.from('page_content').upsert({
        page_key: pageKey, content_en: enabled ? 'true' : 'false',
        description: `Background toggle for ${page} page`,
      }, { onConflict: 'page_key' });
      if (error) throw error;
      setPageBgToggles(prev => ({ ...prev, [page]: enabled }));
      sonnerToast.success(enabled ? `${page} background enabled` : `${page} background disabled`);
    } catch (err) {
      console.error('Error toggling page bg:', err);
      sonnerToast.error('Failed to update page background');
    }
  };

  const fetchBgSettings = async () => {
    try {
      const allKeys = ['admin_bg_image'];
      for (const d of devices) for (const f of bgFieldKeys) allKeys.push(`admin_bg_${d}_${f}`);
      for (const f of bgFieldKeys) allKeys.push(`admin_bg_${f}`);
      for (const el of elementKeys) for (const f of elementFieldKeys) allKeys.push(`admin_el_${el}_${f}`);

      const { data } = await supabase.from('page_content').select('page_key, content_en').in('page_key', allKeys);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(row => { map[row.page_key] = row.content_en; });
        if (map['admin_bg_image']) setBgImageUrl(map['admin_bg_image']);
        setDeviceSettings(prev => {
          const next = { ...prev };
          for (const d of devices) {
            next[d] = {
              blur: Number(map[`admin_bg_${d}_blur`] ?? map['admin_bg_blur'] ?? 0),
              opacity: Number(map[`admin_bg_${d}_opacity`] ?? map['admin_bg_opacity'] ?? 20),
              overlay: Number(map[`admin_bg_${d}_overlay`] ?? map['admin_bg_overlay'] ?? 60),
              brightness: Number(map[`admin_bg_${d}_brightness`] ?? map['admin_bg_brightness'] ?? 100),
              saturation: Number(map[`admin_bg_${d}_saturation`] ?? map['admin_bg_saturation'] ?? 100),
              scale: Number(map[`admin_bg_${d}_scale`] ?? map['admin_bg_scale'] ?? 100),
              posX: Number(map[`admin_bg_${d}_pos_x`] ?? map['admin_bg_pos_x'] ?? 50),
              posY: Number(map[`admin_bg_${d}_pos_y`] ?? map['admin_bg_pos_y'] ?? 50),
            };
          }
          return next;
        });
        setElementStyles(prev => {
          const next = { ...prev };
          for (const el of elementKeys) {
            const blurVal = map[`admin_el_${el}_blur`];
            const opVal = map[`admin_el_${el}_opacity`];
            const colVal = map[`admin_el_${el}_color`];
            next[el] = {
              blur: blurVal !== undefined ? Number(blurVal) : prev[el].blur,
              opacity: opVal !== undefined ? Number(opVal) : prev[el].opacity,
              color: colVal !== undefined ? colVal : prev[el].color,
            };
          }
          return next;
        });
      }
    } catch (err) {
      console.error('Error fetching bg settings:', err);
    }
  };

  const saveBgSettings = async () => {
    setSavingBg(true);
    try {
      const settings: { page_key: string; content_en: string; description: string }[] = [
        { page_key: 'admin_bg_image', content_en: bgImageUrl, description: 'Admin background image URL' },
      ];
      for (const d of devices) {
        const s = deviceSettings[d];
        settings.push(
          { page_key: `admin_bg_${d}_blur`, content_en: String(s.blur), description: `Admin bg ${d} blur` },
          { page_key: `admin_bg_${d}_opacity`, content_en: String(s.opacity), description: `Admin bg ${d} opacity` },
          { page_key: `admin_bg_${d}_overlay`, content_en: String(s.overlay), description: `Admin bg ${d} overlay` },
          { page_key: `admin_bg_${d}_brightness`, content_en: String(s.brightness), description: `Admin bg ${d} brightness` },
          { page_key: `admin_bg_${d}_saturation`, content_en: String(s.saturation), description: `Admin bg ${d} saturation` },
          { page_key: `admin_bg_${d}_scale`, content_en: String(s.scale), description: `Admin bg ${d} scale` },
          { page_key: `admin_bg_${d}_pos_x`, content_en: String(s.posX), description: `Admin bg ${d} posX` },
          { page_key: `admin_bg_${d}_pos_y`, content_en: String(s.posY), description: `Admin bg ${d} posY` },
        );
      }
      const ds = deviceSettings.desktop;
      settings.push(
        { page_key: 'admin_bg_blur', content_en: String(ds.blur), description: 'Admin background blur (px)' },
        { page_key: 'admin_bg_opacity', content_en: String(ds.opacity), description: 'Admin background opacity (%)' },
        { page_key: 'admin_bg_overlay', content_en: String(ds.overlay), description: 'Admin background overlay opacity (%)' },
        { page_key: 'admin_bg_brightness', content_en: String(ds.brightness), description: 'Admin background brightness (%)' },
        { page_key: 'admin_bg_saturation', content_en: String(ds.saturation), description: 'Admin background saturation (%)' },
        { page_key: 'admin_bg_scale', content_en: String(ds.scale), description: 'Admin background scale/zoom (%)' },
        { page_key: 'admin_bg_pos_x', content_en: String(ds.posX), description: 'Admin background position X (%)' },
        { page_key: 'admin_bg_pos_y', content_en: String(ds.posY), description: 'Admin background position Y (%)' },
      );
      for (const el of elementKeys) {
        const e = elementStyles[el];
        settings.push(
          { page_key: `admin_el_${el}_blur`, content_en: String(e.blur), description: `Admin ${el} blur` },
          { page_key: `admin_el_${el}_opacity`, content_en: String(e.opacity), description: `Admin ${el} opacity` },
          { page_key: `admin_el_${el}_color`, content_en: e.color, description: `Admin ${el} color` },
        );
      }
      for (const s of settings) {
        await supabase.from('page_content').upsert(s, { onConflict: 'page_key' });
      }
      sonnerToast.success('Settings saved');
      savedStateRef.current = JSON.stringify({ bgImageUrl, deviceSettings, elementStyles });
      window.dispatchEvent(new CustomEvent('admin-bg-updated'));
    } catch (err) {
      console.error('Error saving bg settings:', err);
      sonnerToast.error('Failed to save settings');
    } finally {
      setSavingBg(false);
    }
  };

  const resetBgDefaults = () => {
    setDeviceSettings(prev => ({ ...prev, [selectedDevice]: { ...defaultBg } }));
  };

  const copyToAllDevices = () => {
    const current = deviceSettings[selectedDevice];
    setDeviceSettings({ desktop: { ...current }, tablet: { ...current }, mobile: { ...current } });
    sonnerToast.success('Copied to all devices');
  };

  const handleUpload = async (file: File) => {
    setUploadingBg(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `backgrounds/admin-bg-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('admin-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('admin-assets').getPublicUrl(path);
      setBgImageUrl(urlData.publicUrl);
      sonnerToast.success('Image uploaded');
    } catch (err) {
      console.error(err);
      sonnerToast.error('Upload failed');
    } finally {
      setUploadingBg(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────

  return (
    <>
      <UnsavedChangesDialog />
      <div className="max-w-2xl mx-auto space-y-3">
        {/* Page header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Settings</h2>
              <p className="text-xs text-muted-foreground">Manage visibility, theme & background</p>
            </div>
          </div>
          {isDirty && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Button
                onClick={saveBgSettings}
                disabled={savingBg}
                size="sm"
                className="rounded-xl gap-1.5 shadow-[var(--shadow-glow)]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {savingBg ? 'Saving...' : 'Save'}
              </Button>
            </motion.div>
          )}
        </div>

        {/* ─── Section 1: Visibility ─── */}
        <SettingsSection
          icon={Lock}
          title="Section Visibility"
          description="Control which sections are visible to visitors"
          defaultOpen={true}
        >
          <div className="space-y-2">
            {[
              { label: 'Articles', locked: articlesLocked, section: 'articles' as const },
              { label: 'Stickers', locked: stickersLocked, section: 'stickers' as const },
            ].map(item => (
              <div key={item.section} className={cn(
                "flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
                item.locked
                  ? "border-destructive/20 bg-destructive/5"
                  : "border-border/30 bg-background/30"
              )}>
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    item.locked ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                  )}>
                    {item.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="text-sm font-medium">{item.label}</span>
                    <p className="text-[11px] text-muted-foreground">
                      {item.locked ? "Hidden from public" : "Visible to everyone"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={!item.locked}
                  onCheckedChange={(c) => toggleSectionLock(item.section, !c)}
                  disabled={loadingLocks}
                />
              </div>
            ))}

            {/* Price Auras Toggle */}
            <div className={cn(
              "flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
              aurasEnabled
                ? "border-amber-400/20 bg-amber-400/5"
                : "border-border/30 bg-background/30"
            )}>
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  aurasEnabled ? "bg-amber-400/10 text-amber-400" : "bg-muted text-muted-foreground"
                )}>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-sm font-medium">Price Auras</span>
                  <p className="text-[11px] text-muted-foreground">
                    {aurasEnabled ? "Glow effects on product cards" : "No glow effects"}
                  </p>
                </div>
              </div>
              <Switch
                checked={aurasEnabled}
                onCheckedChange={toggleAuras}
                disabled={loadingLocks}
              />
            </div>
          </div>
        </SettingsSection>

        {/* ─── Section: Page Backgrounds ─── */}
        <SettingsSection
          icon={Image}
          title="Page Backgrounds"
          description="Enable the background image on specific pages"
        >
          <div className="space-y-2">
            {[
              { page: 'affiliate', label: 'Affiliate (Main Page)', description: 'Show background on the main product page' },
              { page: 'articles', label: 'Articles', description: 'Show background on the articles listing page' },
              { page: 'stickers', label: 'Stickers', description: 'Show background on the stickers shop page' },
            ].map(item => (
              <div key={item.page} className={cn(
                "flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
                pageBgToggles[item.page]
                  ? "border-primary/20 bg-primary/5"
                  : "border-border/30 bg-background/30"
              )}>
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    pageBgToggles[item.page] ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <Image className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-sm font-medium">{item.label}</span>
                    <p className="text-[11px] text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <Switch
                  checked={pageBgToggles[item.page]}
                  onCheckedChange={(c) => togglePageBg(item.page, c)}
                  disabled={loadingLocks}
                />
              </div>
            ))}
          </div>
        </SettingsSection>
        <SettingsSection
          icon={Image}
          title="Background Image"
          description="Upload or link a background image or GIF"
          badge={bgImageUrl ? "Active" : undefined}
        >
          {/* Upload area */}
          <label className="block">
            <input
              type="file" accept="image/*,.gif" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = '';
              }}
            />
            <div className={cn(
              "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border/40",
              "hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all text-sm text-muted-foreground",
              uploadingBg && "opacity-50 pointer-events-none"
            )}>
              <Upload className="w-4 h-4" />
              {uploadingBg ? 'Uploading...' : 'Upload Image or GIF'}
            </div>
          </label>

          {/* URL input */}
          <div className="flex gap-2">
            <Input
              placeholder="https://images.unsplash.com/..."
              value={bgImageUrl}
              onChange={(e) => setBgImageUrl(e.target.value)}
              className="flex-1 rounded-xl bg-background/30 text-xs"
            />
            {bgImageUrl && (
              <Button variant="ghost" size="icon" onClick={() => setBgImageUrl('')} className="shrink-0 rounded-xl">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Preview */}
          {bgImageUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Move className="w-3 h-3" />
                  <span>Drag to reposition</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={copyToAllDevices} className="text-[10px] text-primary hover:text-primary/80 font-medium flex items-center gap-1">
                    <Copy className="w-2.5 h-2.5" /> Copy to all
                  </button>
                  <button onClick={() => updateCurrentBg({ posX: 50, posY: 50 })} className="text-[10px] text-muted-foreground hover:text-foreground">
                    Center
                  </button>
                </div>
              </div>

              <DeviceSelector selected={selectedDevice} onSelect={setSelectedDevice} />

              {/* Preview thumbnail */}
              <div
                className={cn(
                  "relative rounded-xl overflow-hidden border border-primary/20 cursor-grab active:cursor-grabbing select-none mx-auto transition-all duration-300",
                  selectedDevice === 'desktop' && "w-full aspect-video",
                  selectedDevice === 'tablet' && "w-3/4 aspect-[4/3]",
                  selectedDevice === 'mobile' && "w-2/5 aspect-[9/16]",
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsDraggingPos(true);
                  const rect = e.currentTarget.getBoundingClientRect();
                  const handleMove = (ev: MouseEvent) => {
                    const x = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
                    const y = Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100));
                    updateCurrentBg({ posX: Math.round(x), posY: Math.round(y) });
                  };
                  const handleUp = () => { setIsDraggingPos(false); window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
                  window.addEventListener('mousemove', handleMove);
                  window.addEventListener('mouseup', handleUp);
                }}
                onTouchStart={(e) => {
                  setIsDraggingPos(true);
                  const rect = e.currentTarget.getBoundingClientRect();
                  const handleMove = (ev: TouchEvent) => {
                    const touch = ev.touches[0];
                    const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
                    const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100));
                    updateCurrentBg({ posX: Math.round(x), posY: Math.round(y) });
                  };
                  const handleEnd = () => { setIsDraggingPos(false); window.removeEventListener('touchmove', handleMove); window.removeEventListener('touchend', handleEnd); };
                  window.addEventListener('touchmove', handleMove);
                  window.addEventListener('touchend', handleEnd);
                }}
              >
                <img src={bgImageUrl} alt="" className="absolute inset-0 w-full h-full pointer-events-none" style={{
                  filter: `blur(${currentBg.blur}px) brightness(${currentBg.brightness}%) saturate(${currentBg.saturation}%)`,
                  opacity: currentBg.opacity / 100, objectFit: 'cover', objectPosition: `${currentBg.posX}% ${currentBg.posY}%`, transform: `scale(${currentBg.scale / 100})`,
                }} />
                <div className="absolute inset-0" style={{ backgroundColor: `hsl(var(--background) / ${currentBg.overlay / 100})` }} />
                {/* Mock elements overlay */}
                {showElementsInPreview && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col p-[8%] gap-[4%]">
                    {/* Mock header */}
                    <div
                      className="w-full h-[12%] rounded-md"
                      style={{
                        backdropFilter: `blur(${elementStyles.header.blur}px)`,
                        backgroundColor: elementStyles.header.color
                          ? `${elementStyles.header.color}${Math.round(elementStyles.header.opacity * 2.55).toString(16).padStart(2, '0')}`
                          : `hsl(var(--card) / ${elementStyles.header.opacity / 100})`,
                        borderWidth: 1,
                        borderColor: elementStyles.border.color
                          ? `${elementStyles.border.color}${Math.round(elementStyles.border.opacity * 2.55).toString(16).padStart(2, '0')}`
                          : `hsl(var(--border) / ${elementStyles.border.opacity / 200})`,
                      }}
                    />
                    {/* Mock cards */}
                    <div className="flex gap-[4%] flex-1">
                      {[1, 2].map(i => (
                        <div
                          key={i}
                          className="flex-1 rounded-md"
                          style={{
                            backdropFilter: `blur(${elementStyles.card.blur}px)`,
                            backgroundColor: elementStyles.card.color
                              ? `${elementStyles.card.color}${Math.round(elementStyles.card.opacity * 2.55).toString(16).padStart(2, '0')}`
                              : `hsl(var(--card) / ${elementStyles.card.opacity / 100})`,
                            borderWidth: 1,
                            borderColor: elementStyles.border.color
                              ? `${elementStyles.border.color}${Math.round(elementStyles.border.opacity * 2.55).toString(16).padStart(2, '0')}`
                              : `hsl(var(--border) / ${elementStyles.border.opacity / 200})`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div
                  className="absolute w-3.5 h-3.5 rounded-full border-2 border-primary bg-primary/30 -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                  style={{ left: `${currentBg.posX}%`, top: `${currentBg.posY}%` }}
                />
              </div>
              {/* Preview controls */}
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground font-mono">
                  <span className="text-primary capitalize font-semibold">{selectedDevice}</span> — {currentBg.posX}% × {currentBg.posY}%
                </p>
                <button
                  onClick={() => setShowElementsInPreview(v => !v)}
                  className={cn(
                    "text-[10px] font-medium flex items-center gap-1 transition-colors",
                    showElementsInPreview ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Layers className="w-2.5 h-2.5" />
                  {showElementsInPreview ? 'Hide elements' : 'Show elements'}
                </button>
              </div>
            </div>
          )}
        </SettingsSection>

        {/* ─── Section 3: Image Effects ─── */}
        <SettingsSection
          icon={Sparkles}
          title="Image Effects"
          description={`Adjust blur, brightness & more per device`}
        >
          <DeviceSelector selected={selectedDevice} onSelect={setSelectedDevice} />

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground capitalize">{selectedDevice} effects</span>
            <Button variant="ghost" size="sm" onClick={resetBgDefaults} className="h-7 text-xs rounded-lg gap-1">
              <RotateCcw className="w-3 h-3" /> Reset
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <SliderControl icon={Droplets} label="Blur" value={currentBg.blur} onChange={(v) => updateCurrentBg({ blur: v })} min={0} max={30} step={1} unit="px" />
            <SliderControl icon={Eye} label="Opacity" value={currentBg.opacity} onChange={(v) => updateCurrentBg({ opacity: v })} min={0} max={100} step={5} unit="%" />
            <SliderControl icon={Contrast} label="Overlay" value={currentBg.overlay} onChange={(v) => updateCurrentBg({ overlay: v })} min={0} max={100} step={5} unit="%" />
            <SliderControl icon={Sun} label="Brightness" value={currentBg.brightness} onChange={(v) => updateCurrentBg({ brightness: v })} min={0} max={200} step={5} unit="%" />
            <SliderControl icon={Moon} label="Saturation" value={currentBg.saturation} onChange={(v) => updateCurrentBg({ saturation: v })} min={0} max={200} step={5} unit="%" />
            <SliderControl icon={ZoomIn} label="Zoom" value={currentBg.scale} onChange={(v) => updateCurrentBg({ scale: v })} min={100} max={200} step={5} unit="%" />
          </div>
        </SettingsSection>

        {/* ─── Section 4: Element Styles ─── */}
        <SettingsSection
          icon={Palette}
          title="Element Styles"
          description="Customize cards, borders & header appearance"
        >
          <ElementSelector selected={selectedElement} onSelect={setSelectedElement} />

          {/* Preview chip */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border/20 bg-background/20">
            <div
              className="flex-1 h-10 rounded-lg border transition-all"
              style={{
                backdropFilter: `blur(${currentElement.blur}px)`,
                backgroundColor: currentElement.color
                  ? `${currentElement.color}${Math.round(currentElement.opacity * 2.55).toString(16).padStart(2, '0')}`
                  : `hsl(var(--card) / ${currentElement.opacity / 100})`,
                borderColor: currentElement.color
                  ? `${currentElement.color}33`
                  : `hsl(var(--border) / ${currentElement.opacity / 200})`,
              }}
            />
            <span className="text-[10px] text-muted-foreground font-mono capitalize">{selectedElement}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <SliderControl icon={Droplets} label="Blur" value={currentElement.blur} onChange={(v) => updateElement({ blur: v })} min={0} max={40} step={1} unit="px" />
            <SliderControl icon={Eye} label="Opacity" value={currentElement.opacity} onChange={(v) => updateElement({ opacity: v })} min={0} max={100} step={5} unit="%" />
          </div>

          {/* Color */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-background/30 border border-border/20">
            <Palette className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <Input
              placeholder="Default (theme)"
              value={currentElement.color}
              onChange={(e) => updateElement({ color: e.target.value })}
              className="flex-1 rounded-lg bg-transparent border-0 text-xs h-7 font-mono p-0 focus-visible:ring-0"
            />
            {currentElement.color && (
              <button onClick={() => updateElement({ color: '' })} className="text-[10px] text-muted-foreground hover:text-foreground shrink-0">
                Reset
              </button>
            )}
            <input
              type="color"
              value={currentElement.color || '#000000'}
              onChange={(e) => updateElement({ color: e.target.value })}
              className="w-7 h-7 rounded-lg border border-border/30 cursor-pointer bg-transparent shrink-0"
            />
          </div>
        </SettingsSection>

        {/* ─── Save Button (sticky on mobile) ─── */}
        <div className="sticky bottom-20 md:bottom-4 z-30 pt-2">
          <Button
            onClick={saveBgSettings}
            disabled={savingBg || !isDirty}
            className={cn(
              "w-full rounded-xl h-11 text-sm font-semibold transition-all",
              isDirty
                ? "shadow-[var(--shadow-glow)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]"
                : "opacity-60"
            )}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {savingBg ? 'Saving...' : isDirty ? 'Save All Changes' : 'No Changes'}
          </Button>
        </div>
      </div>
    </>
  );
}
