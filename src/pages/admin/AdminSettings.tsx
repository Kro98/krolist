import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Lock, Unlock, Settings, Image, Upload, X, Sparkles, Sun, Moon, RotateCcw,
  Eye, Contrast, Droplets, ZoomIn, Move, ChevronDown,
  Monitor, Tablet, Smartphone, PanelTop, Square, Columns, Palette, Copy, Layers,
  Check, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast as sonnerToast } from "sonner";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

// ─── Types ───────────────────────────────────────────────────
type DeviceKey = 'desktop' | 'tablet' | 'mobile';
type BgSettings = { blur: number; opacity: number; overlay: number; brightness: number; saturation: number; scale: number; posX: number; posY: number };
type ElementKey = 'card' | 'border' | 'header';
type ElementStyle = { blur: number; opacity: number; color: string };
type SettingsTab = 'general' | 'background' | 'elements';

const defaultBg: BgSettings = { blur: 0, opacity: 20, overlay: 60, brightness: 100, saturation: 100, scale: 100, posX: 50, posY: 50 };
const devices: DeviceKey[] = ['desktop', 'tablet', 'mobile'];
const bgFieldKeys = ['blur', 'opacity', 'overlay', 'brightness', 'saturation', 'scale', 'pos_x', 'pos_y'] as const;
const elementKeys: ElementKey[] = ['card', 'border', 'header'];
const elementFieldKeys = ['blur', 'opacity', 'color'] as const;

// ─── Sub-components ──────────────────────────────────────────

function MiniSlider({ icon: Icon, label, value, onChange, min, max, step, unit = "" }: {
  icon: React.ElementType; label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; unit?: string;
}) {
  return (
    <div className="group/slider space-y-1 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3 h-3 text-muted-foreground group-hover/slider:text-primary transition-colors" />
          <span className="text-[11px] font-medium text-foreground/80">{label}</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground tabular-nums bg-background/60 px-1.5 py-0.5 rounded">{value}{unit}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} className="py-0" />
    </div>
  );
}

function ToggleRow({ icon: Icon, label, description, checked, onCheckedChange, disabled, variant = 'default' }: {
  icon: React.ElementType; label: string; description: string; checked: boolean;
  onCheckedChange: (c: boolean) => void; disabled?: boolean;
  variant?: 'default' | 'destructive' | 'warning';
}) {
  const colors = {
    default: { active: 'bg-primary/8 border-primary/20', icon: 'bg-primary/10 text-primary' },
    destructive: { active: 'bg-destructive/5 border-destructive/20', icon: 'bg-destructive/10 text-destructive' },
    warning: { active: 'bg-amber-500/5 border-amber-500/20', icon: 'bg-amber-500/10 text-amber-500' },
  };
  const c = colors[variant];
  const isActive = variant === 'destructive' ? !checked : checked;
  return (
    <div className={cn(
      "flex items-center justify-between p-2.5 rounded-lg border transition-all duration-200",
      isActive ? c.active : "border-transparent bg-muted/20"
    )}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors", isActive ? c.icon : "bg-muted/40 text-muted-foreground")}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <span className="text-[13px] font-medium leading-tight block">{label}</span>
          <span className="text-[10px] text-muted-foreground leading-tight">{description}</span>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

function PillSelector<T extends string>({ items, selected, onSelect }: {
  items: { key: T; icon: React.ElementType; label: string }[];
  selected: T; onSelect: (k: T) => void;
}): React.ReactElement {
  return (
    <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted/40 border border-border/20">
      {items.map(d => {
        const DIcon = d.icon;
        const isActive = selected === d.key;
        return (
          <button
            key={d.key}
            onClick={() => onSelect(d.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200",
              isActive
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <DIcon className="w-3 h-3" />
            <span className="hidden xs:inline">{d.label}</span>
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
    affiliate: false, articles: false, stickers: false,
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

  // Active tab
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

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

  // ─── Tab config ────────────────────────────────────────────
  const tabs: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
    { key: 'general', label: 'General', icon: Settings },
    { key: 'background', label: 'Background', icon: Image },
    { key: 'elements', label: 'Elements', icon: Palette },
  ];

  // Helper for preview mock
  const cardBg = elementStyles.card.color
    ? `${elementStyles.card.color}${Math.round(elementStyles.card.opacity * 2.55).toString(16).padStart(2, '0')}`
    : `hsl(var(--card) / ${elementStyles.card.opacity / 100})`;
  const headerBg = elementStyles.header.color
    ? `${elementStyles.header.color}${Math.round(elementStyles.header.opacity * 2.55).toString(16).padStart(2, '0')}`
    : `hsl(var(--card) / ${elementStyles.header.opacity / 100})`;
  const borderC = elementStyles.border.color
    ? `${elementStyles.border.color}${Math.round(elementStyles.border.opacity * 2.55).toString(16).padStart(2, '0')}`
    : `hsl(var(--border) / ${elementStyles.border.opacity / 200})`;
  const isMobile = selectedDevice === 'mobile';
  const isTablet = selectedDevice === 'tablet';
  const cardCount = isMobile ? 1 : isTablet ? 2 : 3;

  // ─── Render ────────────────────────────────────────────────

  return (
    <>
      <UnsavedChangesDialog />
      <div className="max-w-3xl mx-auto space-y-4 pb-24">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Settings</h2>
              <p className="text-[11px] text-muted-foreground">Theme, visibility & appearance</p>
            </div>
          </div>
          <AnimatePresence>
            {isDirty && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 10 }}
              >
                <Button onClick={saveBgSettings} disabled={savingBg} size="sm" className="rounded-lg gap-1.5 shadow-[var(--shadow-glow)] text-xs">
                  <Sparkles className="w-3 h-3" />
                  {savingBg ? 'Saving…' : 'Save Changes'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Tab Navigation ─── */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border border-border/30">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 relative",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                )}
              >
                <TabIcon className={cn("w-3.5 h-3.5", isActive && "text-primary")} />
                {tab.label}
                {tab.key === 'background' && bgImageUrl && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary absolute top-1.5 right-1.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* ─── Tab Content ─── */}
        <AnimatePresence mode="wait">
          {activeTab === 'general' && (
            <motion.div
              key="general"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Section Visibility */}
              <div className="rounded-xl border border-border/30 overflow-hidden" style={{
                backdropFilter: `blur(var(--admin-card-blur, 12px))`,
                backgroundColor: `var(--admin-card-color, hsl(var(--card)))`,
              }}>
                <div className="px-4 py-3 border-b border-border/20">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    <h3 className="text-[13px] font-semibold">Section Visibility</h3>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Control which sections users can access</p>
                </div>
                <div className="p-3 space-y-1.5">
                  <ToggleRow
                    icon={articlesLocked ? Lock : Unlock}
                    label="Articles"
                    description={articlesLocked ? "Hidden from public" : "Visible to everyone"}
                    checked={!articlesLocked}
                    onCheckedChange={(c) => toggleSectionLock('articles', !c)}
                    disabled={loadingLocks}
                    variant="destructive"
                  />
                  <ToggleRow
                    icon={stickersLocked ? Lock : Unlock}
                    label="Stickers"
                    description={stickersLocked ? "Hidden from public" : "Visible to everyone"}
                    checked={!stickersLocked}
                    onCheckedChange={(c) => toggleSectionLock('stickers', !c)}
                    disabled={loadingLocks}
                    variant="destructive"
                  />
                  <ToggleRow
                    icon={Sparkles}
                    label="Price Auras"
                    description={aurasEnabled ? "Glow effects active" : "No glow effects"}
                    checked={aurasEnabled}
                    onCheckedChange={toggleAuras}
                    disabled={loadingLocks}
                    variant="warning"
                  />
                </div>
              </div>

              {/* Page Backgrounds */}
              <div className="rounded-xl border border-border/30 overflow-hidden" style={{
                backdropFilter: `blur(var(--admin-card-blur, 12px))`,
                backgroundColor: `var(--admin-card-color, hsl(var(--card)))`,
              }}>
                <div className="px-4 py-3 border-b border-border/20">
                  <div className="flex items-center gap-2">
                    <Image className="w-3.5 h-3.5 text-primary" />
                    <h3 className="text-[13px] font-semibold">Page Backgrounds</h3>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Enable the background image per page</p>
                </div>
                <div className="p-3 space-y-1.5">
                  {[
                    { page: 'affiliate', label: 'Affiliate (Main)', desc: 'Main product page' },
                    { page: 'articles', label: 'Articles', desc: 'Articles listing' },
                    { page: 'stickers', label: 'Stickers', desc: 'Stickers shop' },
                  ].map(item => (
                    <ToggleRow
                      key={item.page}
                      icon={Image}
                      label={item.label}
                      description={pageBgToggles[item.page] ? `Active — ${item.desc}` : item.desc}
                      checked={pageBgToggles[item.page]}
                      onCheckedChange={(c) => togglePageBg(item.page, c)}
                      disabled={loadingLocks}
                    />
                  ))}
                </div>
                {!bgImageUrl && (
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/5 border border-warning/15 text-[10px] text-warning">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>No background image set. Go to the <button onClick={() => setActiveTab('background')} className="underline font-medium">Background</button> tab to upload one.</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'background' && (
            <motion.div
              key="background"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Image Upload Card */}
              <div className="rounded-xl border border-border/30 overflow-hidden" style={{
                backdropFilter: `blur(var(--admin-card-blur, 12px))`,
                backgroundColor: `var(--admin-card-color, hsl(var(--card)))`,
              }}>
                <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image className="w-3.5 h-3.5 text-primary" />
                    <h3 className="text-[13px] font-semibold">Image Source</h3>
                    {bgImageUrl && <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">Active</span>}
                  </div>
                  {bgImageUrl && (
                    <button onClick={() => setBgImageUrl('')} className="text-[10px] text-destructive hover:text-destructive/80 font-medium flex items-center gap-1">
                      <X className="w-2.5 h-2.5" /> Remove
                    </button>
                  )}
                </div>
                <div className="p-3 space-y-2.5">
                  <label className="block">
                    <input
                      type="file" accept="image/*,.gif" className="hidden"
                      onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload(file); e.target.value = ''; }}
                    />
                    <div className={cn(
                      "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-border/50",
                      "hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all text-xs text-muted-foreground",
                      uploadingBg && "opacity-50 pointer-events-none"
                    )}>
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingBg ? 'Uploading…' : 'Upload image or GIF'}
                    </div>
                  </label>
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="Or paste image URL…"
                      value={bgImageUrl}
                      onChange={(e) => setBgImageUrl(e.target.value)}
                      className="flex-1 rounded-lg bg-muted/30 text-[11px] h-8 border-border/20"
                    />
                  </div>
                </div>
              </div>

              {/* Preview + Effects */}
              {bgImageUrl && (
                <div className="rounded-xl border border-border/30 overflow-hidden" style={{
                  backdropFilter: `blur(var(--admin-card-blur, 12px))`,
                  backgroundColor: `var(--admin-card-color, hsl(var(--card)))`,
                }}>
                  <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <h3 className="text-[13px] font-semibold">Preview & Effects</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={copyToAllDevices} className="text-[10px] text-primary hover:text-primary/80 font-medium flex items-center gap-1">
                        <Copy className="w-2.5 h-2.5" /> Copy to all
                      </button>
                      <Button variant="ghost" size="sm" onClick={resetBgDefaults} className="h-6 text-[10px] rounded px-2 gap-1">
                        <RotateCcw className="w-2.5 h-2.5" /> Reset
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 space-y-3">
                    <PillSelector
                      items={[
                        { key: 'desktop' as DeviceKey, icon: Monitor, label: 'Desktop' },
                        { key: 'tablet' as DeviceKey, icon: Tablet, label: 'Tablet' },
                        { key: 'mobile' as DeviceKey, icon: Smartphone, label: 'Mobile' },
                      ]}
                      selected={selectedDevice}
                      onSelect={(k: DeviceKey) => setSelectedDevice(k)}
                    />

                    {/* Preview thumbnail */}
                    <div className="flex gap-3 items-start">
                      <div
                        className={cn(
                          "relative rounded-lg overflow-hidden border border-primary/15 cursor-grab active:cursor-grabbing select-none transition-all duration-300 shrink-0",
                          selectedDevice === 'desktop' && "w-full aspect-video",
                          selectedDevice === 'tablet' && "w-3/4 mx-auto aspect-[4/3]",
                          selectedDevice === 'mobile' && "w-2/5 mx-auto aspect-[9/16]",
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

                        {/* Mock layout overlay */}
                        {showElementsInPreview && (
                          <div className="absolute inset-0 pointer-events-none flex flex-col p-[6%] gap-[3%]">
                            <div className="w-full h-[10%] rounded-md flex items-center px-[4%] gap-[3%]" style={{
                              backdropFilter: `blur(${elementStyles.header.blur}px)`,
                              backgroundColor: headerBg, borderWidth: 1, borderColor: borderC,
                            }}>
                              <div className="w-[8%] h-[50%] rounded-sm bg-primary/30" />
                              <div className="flex-1 h-[30%] rounded-sm bg-foreground/10" />
                              <div className="w-[12%] h-[40%] rounded-sm bg-primary/20" />
                            </div>
                            <div className="flex gap-[3%] flex-1 min-h-0">
                              {!isMobile && (
                                <div className={`${isTablet ? 'w-[18%]' : 'w-[22%]'} rounded-md flex flex-col gap-[6%] p-[3%]`} style={{
                                  backdropFilter: `blur(${elementStyles.card.blur}px)`,
                                  backgroundColor: cardBg, borderWidth: 1, borderColor: borderC,
                                }}>
                                  {[1,2,3,4].map(i => (<div key={i} className="w-full h-[8%] rounded-sm bg-foreground/8" />))}
                                </div>
                              )}
                              <div className="flex-1 flex flex-col gap-[3%] min-h-0">
                                <div className={`flex gap-[3%] ${isMobile ? 'flex-col' : 'h-[45%]'}`}>
                                  {Array.from({ length: cardCount }, (_, i) => (
                                    <div key={i} className="flex-1 rounded-md flex flex-col p-[4%] gap-[6%]" style={{
                                      backdropFilter: `blur(${elementStyles.card.blur}px)`,
                                      backgroundColor: cardBg, borderWidth: 1, borderColor: borderC,
                                    }}>
                                      <div className="w-full flex-1 rounded-sm bg-foreground/5" />
                                      <div className="w-[60%] h-[10%] rounded-sm bg-foreground/10" />
                                      <div className="w-[40%] h-[8%] rounded-sm bg-primary/15" />
                                    </div>
                                  ))}
                                </div>
                                <div className="flex-1 rounded-md flex items-center px-[4%] gap-[4%]" style={{
                                  backdropFilter: `blur(${elementStyles.card.blur}px)`,
                                  backgroundColor: cardBg, borderWidth: 1, borderColor: borderC,
                                }}>
                                  <div className="w-[15%] h-[60%] rounded-sm bg-foreground/5" />
                                  <div className="flex-1 flex flex-col gap-[8%]">
                                    <div className="w-[70%] h-[15%] rounded-sm bg-foreground/10" />
                                    <div className="w-[45%] h-[10%] rounded-sm bg-foreground/6" />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className={`w-full h-[8%] rounded-md flex items-center ${isMobile ? 'justify-around px-[2%]' : 'justify-center'}`} style={{
                              backdropFilter: `blur(${elementStyles.card.blur}px)`,
                              backgroundColor: cardBg, borderWidth: 1, borderColor: borderC,
                            }}>
                              {isMobile ? (
                                <>{[1,2,3,4].map(i => (<div key={i} className="w-[12%] h-[40%] rounded-sm bg-foreground/10" />))}</>
                              ) : (
                                <div className="w-[30%] h-[30%] rounded-sm bg-foreground/8" />
                              )}
                            </div>
                          </div>
                        )}

                        <div
                          className="absolute w-3 h-3 rounded-full border-2 border-primary bg-primary/30 -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                          style={{ left: `${currentBg.posX}%`, top: `${currentBg.posY}%` }}
                        />
                      </div>

                      {/* Position info */}
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Move className="w-2.5 h-2.5" />
                        <span className="font-mono"><span className="text-primary font-semibold capitalize">{selectedDevice}</span> — {currentBg.posX}% × {currentBg.posY}%</span>
                      </div>
                      <button
                        onClick={() => setShowElementsInPreview(v => !v)}
                        className={cn(
                          "font-medium flex items-center gap-1 transition-colors",
                          showElementsInPreview ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Layers className="w-2.5 h-2.5" />
                        {showElementsInPreview ? 'Hide layout' : 'Show layout'}
                      </button>
                    </div>

                    {/* Effect sliders */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      <MiniSlider icon={Droplets} label="Blur" value={currentBg.blur} onChange={(v) => updateCurrentBg({ blur: v })} min={0} max={30} step={1} unit="px" />
                      <MiniSlider icon={Eye} label="Opacity" value={currentBg.opacity} onChange={(v) => updateCurrentBg({ opacity: v })} min={0} max={100} step={5} unit="%" />
                      <MiniSlider icon={Contrast} label="Overlay" value={currentBg.overlay} onChange={(v) => updateCurrentBg({ overlay: v })} min={0} max={100} step={5} unit="%" />
                      <MiniSlider icon={Sun} label="Bright" value={currentBg.brightness} onChange={(v) => updateCurrentBg({ brightness: v })} min={0} max={200} step={5} unit="%" />
                      <MiniSlider icon={Moon} label="Saturation" value={currentBg.saturation} onChange={(v) => updateCurrentBg({ saturation: v })} min={0} max={200} step={5} unit="%" />
                      <MiniSlider icon={ZoomIn} label="Zoom" value={currentBg.scale} onChange={(v) => updateCurrentBg({ scale: v })} min={100} max={200} step={5} unit="%" />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'elements' && (
            <motion.div
              key="elements"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="rounded-xl border border-border/30 overflow-hidden" style={{
                backdropFilter: `blur(var(--admin-card-blur, 12px))`,
                backgroundColor: `var(--admin-card-color, hsl(var(--card)))`,
              }}>
                <div className="px-4 py-3 border-b border-border/20">
                  <div className="flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5 text-primary" />
                    <h3 className="text-[13px] font-semibold">Element Styles</h3>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Customize glassmorphic card, border & header styles</p>
                </div>
                <div className="p-3 space-y-3">
                  <PillSelector
                    items={[
                      { key: 'card' as ElementKey, icon: Square, label: 'Cards' },
                      { key: 'border' as ElementKey, icon: Columns, label: 'Borders' },
                      { key: 'header' as ElementKey, icon: PanelTop, label: 'Header' },
                    ]}
                    selected={selectedElement}
                    onSelect={(k: ElementKey) => setSelectedElement(k)}
                  />

                  {/* Live preview strip */}
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/15">
                    <div
                      className="flex-1 h-9 rounded-lg border transition-all"
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
                    <span className="text-[10px] text-muted-foreground font-mono capitalize w-12 text-right">{selectedElement}</span>
                  </div>

                  {/* Controls */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <MiniSlider icon={Droplets} label="Blur" value={currentElement.blur} onChange={(v) => updateElement({ blur: v })} min={0} max={40} step={1} unit="px" />
                    <MiniSlider icon={Eye} label="Opacity" value={currentElement.opacity} onChange={(v) => updateElement({ opacity: v })} min={0} max={100} step={5} unit="%" />
                  </div>

                  {/* Color picker */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/15">
                    <input
                      type="color"
                      value={currentElement.color || '#000000'}
                      onChange={(e) => updateElement({ color: e.target.value })}
                      className="w-7 h-7 rounded-md border border-border/30 cursor-pointer bg-transparent shrink-0"
                    />
                    <Input
                      placeholder="Theme default"
                      value={currentElement.color}
                      onChange={(e) => updateElement({ color: e.target.value })}
                      className="flex-1 rounded-md bg-transparent border-0 text-[11px] h-7 font-mono p-0 focus-visible:ring-0"
                    />
                    {currentElement.color && (
                      <button onClick={() => updateElement({ color: '' })} className="text-[10px] text-muted-foreground hover:text-foreground shrink-0 px-1.5">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Sticky Save Bar ─── */}
        <div className="sticky bottom-20 md:bottom-4 z-30">
          <AnimatePresence>
            {isDirty ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <Button
                  onClick={saveBgSettings}
                  disabled={savingBg}
                  className="w-full rounded-xl h-10 text-sm font-semibold shadow-[var(--shadow-glow)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]"
                >
                  {savingBg ? (
                    <><RotateCcw className="w-3.5 h-3.5 mr-2 animate-spin" /> Saving…</>
                  ) : (
                    <><Check className="w-3.5 h-3.5 mr-2" /> Save All Changes</>
                  )}
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
