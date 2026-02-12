import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Shield, Package, Menu, FileText, Sticker, Lock, Unlock, Settings,
  Tag, Image, Upload, X, Key, Sparkles, Sun, Moon, RotateCcw,
  Eye, Contrast, Droplets, ZoomIn, Move, ChevronRight,
  Monitor, Tablet, Smartphone, PanelTop, Square, Columns, Palette, Copy
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import KrolistProductsManager from "./admin/KrolistProductsManager";
import StickersManager from "./admin/StickersManager";
import PromoCodesManager from "./admin/PromoCodesManager";
import ApiSettingsManager from "./admin/ApiSettingsManager";
import { toast as sonnerToast } from "sonner";

// Glassmorphic card wrapper — uses admin element CSS vars
function GlassCard({ children, className, glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "relative rounded-2xl shadow-[var(--shadow-md)]",
        "transition-all duration-300",
        glow && "hover:shadow-[var(--shadow-glow)] hover:border-primary/30",
        className
      )}
      style={{
        backdropFilter: `blur(var(--admin-card-blur, 12px))`,
        backgroundColor: `var(--admin-card-color, hsl(var(--card)))`,
        opacity: `var(--admin-card-opacity, 0.8)`,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: `var(--admin-border-color, hsl(var(--border) / var(--admin-border-opacity, 0.5)))`,
      }}
    >
      {children}
    </motion.div>
  );
}

// Animated slider row
function SliderControl({ icon: Icon, label, value, onChange, min, max, step, unit = "", color }: {
  icon: React.ElementType; label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; unit?: string; color?: string;
}) {
  return (
    <div className="group space-y-2 p-3 rounded-xl bg-background/40 border border-border/30 hover:border-primary/20 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10 text-primary transition-colors", color)}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <Label className="text-xs font-semibold">{label}</Label>
        </div>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">{value}{unit}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} />
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("products");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Section lock states
  const [articlesLocked, setArticlesLocked] = useState(false);
  const [stickersLocked, setStickersLocked] = useState(false);
  const [loadingLocks, setLoadingLocks] = useState(true);

  // Background settings - per device
  type DeviceKey = 'desktop' | 'tablet' | 'mobile';
  type BgSettings = { blur: number; opacity: number; overlay: number; brightness: number; saturation: number; scale: number; posX: number; posY: number };
  const defaultBg: BgSettings = { blur: 0, opacity: 20, overlay: 60, brightness: 100, saturation: 100, scale: 100, posX: 50, posY: 50 };

  const [bgImageUrl, setBgImageUrl] = useState("");
  const [deviceSettings, setDeviceSettings] = useState<Record<DeviceKey, BgSettings>>({
    desktop: { ...defaultBg },
    tablet: { ...defaultBg },
    mobile: { ...defaultBg },
  });
  const [selectedDevice, setSelectedDevice] = useState<DeviceKey>('desktop');
  const [savingBg, setSavingBg] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [isDraggingPos, setIsDraggingPos] = useState(false);

  // Element-level style settings
  type ElementKey = 'card' | 'border' | 'header';
  type ElementStyle = { blur: number; opacity: number; color: string };
  const defaultElementStyle: ElementStyle = { blur: 12, opacity: 80, color: '' };
  const [elementStyles, setElementStyles] = useState<Record<ElementKey, ElementStyle>>({
    card: { blur: 12, opacity: 80, color: '' },
    border: { blur: 0, opacity: 50, color: '' },
    header: { blur: 24, opacity: 80, color: '' },
  });
  const [selectedElement, setSelectedElement] = useState<ElementKey>('card');
  const currentElement = elementStyles[selectedElement];
  const updateElement = (patch: Partial<ElementStyle>) => {
    setElementStyles(prev => ({ ...prev, [selectedElement]: { ...prev[selectedElement], ...patch } }));
  };

  const currentBg = deviceSettings[selectedDevice];
  const updateCurrentBg = (patch: Partial<BgSettings>) => {
    setDeviceSettings(prev => ({ ...prev, [selectedDevice]: { ...prev[selectedDevice], ...patch } }));
  };
  const getBg = (device: DeviceKey) => deviceSettings[device];

  const tabs = [
    { value: "products", label: t('admin.krolistProducts'), icon: Package, color: "bg-primary/10 text-primary" },
    { value: "articles", label: "Articles", icon: FileText, isLink: true, href: "/admin/articles", color: "bg-accent text-accent-foreground" },
    { value: "stickers", label: "Stickers", icon: Sticker, color: "bg-accent text-accent-foreground" },
    { value: "promo-codes", label: "Promo Codes", icon: Tag, color: "bg-accent text-accent-foreground" },
    { value: "api-settings", label: "API Keys", icon: Key, color: "bg-accent text-accent-foreground" },
    { value: "settings", label: "Settings", icon: Settings, color: "bg-accent text-accent-foreground" },
  ];

  useEffect(() => {
    fetchSectionLocks();
    fetchBgSettings();
  }, []);

  const fetchSectionLocks = async () => {
    try {
      const { data, error } = await supabase
        .from('page_content')
        .select('page_key, content_en')
        .in('page_key', ['section_lock_articles', 'section_lock_stickers']);

      if (!error && data) {
        data.forEach(row => {
          if (row.page_key === 'section_lock_articles') setArticlesLocked(row.content_en === 'locked');
          if (row.page_key === 'section_lock_stickers') setStickersLocked(row.content_en === 'locked');
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
    const value = locked ? 'locked' : 'unlocked';

    try {
      const { error } = await supabase
        .from('page_content')
        .upsert({
          page_key: pageKey,
          content_en: value,
          description: `Lock toggle for ${section} section`,
        }, { onConflict: 'page_key' });

      if (error) throw error;

      if (section === 'articles') setArticlesLocked(locked);
      if (section === 'stickers') setStickersLocked(locked);

      sonnerToast.success(
        locked
          ? `${section} section locked`
          : `${section} section unlocked`
      );
    } catch (err) {
      console.error('Error toggling section lock:', err);
      sonnerToast.error('Failed to update section lock');
    }
  };

  const devices: DeviceKey[] = ['desktop', 'tablet', 'mobile'];
  const bgFieldKeys = ['blur', 'opacity', 'overlay', 'brightness', 'saturation', 'scale', 'pos_x', 'pos_y'] as const;
  const elementKeys: ElementKey[] = ['card', 'border', 'header'];
  const elementFieldKeys = ['blur', 'opacity', 'color'] as const;

  const fetchBgSettings = async () => {
    try {
      const allKeys = ['admin_bg_image'];
      for (const d of devices) {
        for (const f of bgFieldKeys) {
          allKeys.push(`admin_bg_${d}_${f}`);
        }
      }
      for (const f of bgFieldKeys) {
        allKeys.push(`admin_bg_${f}`);
      }
      // Element style keys
      for (const el of elementKeys) {
        for (const f of elementFieldKeys) {
          allKeys.push(`admin_el_${el}_${f}`);
        }
      }
      const { data } = await supabase
        .from('page_content')
        .select('page_key, content_en')
        .in('page_key', allKeys);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(row => { map[row.page_key] = row.content_en; });
        if (map['admin_bg_image']) setBgImageUrl(map['admin_bg_image']);

        setDeviceSettings(prev => {
          const next = { ...prev };
          for (const d of devices) {
            const s = { ...next[d] };
            s.blur = Number(map[`admin_bg_${d}_blur`] ?? map['admin_bg_blur'] ?? 0);
            s.opacity = Number(map[`admin_bg_${d}_opacity`] ?? map['admin_bg_opacity'] ?? 20);
            s.overlay = Number(map[`admin_bg_${d}_overlay`] ?? map['admin_bg_overlay'] ?? 60);
            s.brightness = Number(map[`admin_bg_${d}_brightness`] ?? map['admin_bg_brightness'] ?? 100);
            s.saturation = Number(map[`admin_bg_${d}_saturation`] ?? map['admin_bg_saturation'] ?? 100);
            s.scale = Number(map[`admin_bg_${d}_scale`] ?? map['admin_bg_scale'] ?? 100);
            s.posX = Number(map[`admin_bg_${d}_pos_x`] ?? map['admin_bg_pos_x'] ?? 50);
            s.posY = Number(map[`admin_bg_${d}_pos_y`] ?? map['admin_bg_pos_y'] ?? 50);
            next[d] = s;
          }
          return next;
        });

        setElementStyles(prev => {
          const next = { ...prev };
          for (const el of elementKeys) {
            const e = { ...next[el] };
            const blurVal = map[`admin_el_${el}_blur`];
            const opVal = map[`admin_el_${el}_opacity`];
            const colVal = map[`admin_el_${el}_color`];
            if (blurVal !== undefined) e.blur = Number(blurVal);
            if (opVal !== undefined) e.opacity = Number(opVal);
            if (colVal !== undefined) e.color = colVal;
            next[el] = e;
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
      // Also save desktop as legacy keys for AdminLayout compat
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
      // Save element styles
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
      sonnerToast.success('Background settings saved');
      window.dispatchEvent(new CustomEvent('admin-bg-updated'));
    } catch (err) {
      console.error('Error saving bg settings:', err);
      sonnerToast.error('Failed to save background settings');
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

  return (
    <div className="min-h-screen pb-20 md:pb-6 relative z-10">
      {/* Mobile Header — floating glass */}
      <div className="md:hidden sticky top-0 z-40">
        <div className="mx-3 mt-2 rounded-2xl shadow-[var(--shadow-md)]" style={{ backdropFilter: `blur(var(--admin-header-blur, 24px))`, backgroundColor: `var(--admin-header-color, hsl(var(--card) / var(--admin-header-opacity, 0.8)))`, border: `1px solid var(--admin-border-color, hsl(var(--border) / var(--admin-border-opacity, 0.5)))` }}>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-base font-bold">{t('admin.dashboard')}</h1>
            </div>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-card/90 backdrop-blur-2xl">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    {t('admin.dashboard')}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-1">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    if (tab.isLink && tab.href) {
                      return (
                        <Button
                          key={tab.value}
                          variant="ghost"
                          className="w-full justify-start rounded-xl"
                          onClick={() => { navigate(tab.href!); setMobileMenuOpen(false); }}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {tab.label}
                        </Button>
                      );
                    }
                    return (
                      <Button
                        key={tab.value}
                        variant={activeTab === tab.value ? "secondary" : "ghost"}
                        className="w-full justify-start rounded-xl"
                        onClick={() => { setActiveTab(tab.value); setMobileMenuOpen(false); }}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {tab.label}
                      </Button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Desktop Layout: Floating Sidebar + Content */}
      <div className="hidden md:flex gap-6 container mx-auto py-6 px-4 max-w-[1400px]">
        {/* Floating Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="w-[220px] shrink-0 sticky top-6 self-start"
        >
          <div className="rounded-2xl shadow-[var(--shadow-lg)] p-4 space-y-2" style={{ backdropFilter: `blur(var(--admin-card-blur, 12px))`, backgroundColor: `var(--admin-card-color, hsl(var(--card) / var(--admin-card-opacity, 0.7)))`, border: `1px solid var(--admin-border-color, hsl(var(--border) / var(--admin-border-opacity, 0.5)))` }}>
            {/* Logo Area */}
            <div className="flex items-center gap-2.5 px-2 pb-3 mb-2 border-b border-border/40">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shadow-[var(--shadow-glow)]">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-bold leading-tight">{t('admin.dashboard')}</h1>
                <p className="text-[10px] text-muted-foreground">Control Panel</p>
              </div>
            </div>

            {/* Nav Items */}
            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;

              if (tab.isLink && tab.href) {
                return (
                  <button
                    key={tab.value}
                    onClick={() => navigate(tab.href!)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
                  </button>
                );
              }

              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary shadow-[var(--shadow-glow)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="admin-active-tab"
                      className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              >
                <TabsContent value="products" className="mt-0" forceMount={activeTab === "products" ? true : undefined}>
                  {activeTab === "products" && <KrolistProductsManager />}
                </TabsContent>

                <TabsContent value="stickers" className="mt-0" forceMount={activeTab === "stickers" ? true : undefined}>
                  {activeTab === "stickers" && <StickersManager />}
                </TabsContent>

                <TabsContent value="promo-codes" className="mt-0" forceMount={activeTab === "promo-codes" ? true : undefined}>
                  {activeTab === "promo-codes" && <PromoCodesManager />}
                </TabsContent>

                <TabsContent value="api-settings" className="mt-0" forceMount={activeTab === "api-settings" ? true : undefined}>
                  {activeTab === "api-settings" && <ApiSettingsManager />}
                </TabsContent>

                <TabsContent value="settings" className="mt-0" forceMount={activeTab === "settings" ? true : undefined}>
                  {activeTab === "settings" && (
                    <div className="max-w-3xl space-y-6">
                      {/* Section Visibility */}
                      <GlassCard glow>
                        <div className="p-6 space-y-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Lock className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-bold text-base">Section Visibility</h3>
                              <p className="text-xs text-muted-foreground">Lock sections to hide them from visitors.</p>
                            </div>
                          </div>

                          {/* Articles Lock */}
                          <div className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
                            articlesLocked
                              ? "border-destructive/30 bg-destructive/5"
                              : "border-border/40 bg-background/40"
                          )}>
                            <div className="flex items-center gap-3">
                              <motion.div
                                animate={{ rotate: articlesLocked ? 0 : 15 }}
                                className={cn(
                                  "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                                  articlesLocked ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                                )}
                              >
                                {articlesLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                              </motion.div>
                              <div>
                                <Label className="text-sm font-semibold">Articles</Label>
                                <p className="text-[11px] text-muted-foreground">
                                  {articlesLocked ? "Hidden from public" : "Visible to public"}
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={!articlesLocked}
                              onCheckedChange={(checked) => toggleSectionLock('articles', !checked)}
                              disabled={loadingLocks}
                            />
                          </div>

                          {/* Stickers Lock */}
                          <div className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
                            stickersLocked
                              ? "border-destructive/30 bg-destructive/5"
                              : "border-border/40 bg-background/40"
                          )}>
                            <div className="flex items-center gap-3">
                              <motion.div
                                animate={{ rotate: stickersLocked ? 0 : 15 }}
                                className={cn(
                                  "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                                  stickersLocked ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                                )}
                              >
                                {stickersLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                              </motion.div>
                              <div>
                                <Label className="text-sm font-semibold">Stickers</Label>
                                <p className="text-[11px] text-muted-foreground">
                                  {stickersLocked ? "Hidden from public" : "Visible to public"}
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={!stickersLocked}
                              onCheckedChange={(checked) => toggleSectionLock('stickers', !checked)}
                              disabled={loadingLocks}
                            />
                          </div>
                        </div>
                      </GlassCard>

                      {/* Background Customization */}
                      <GlassCard glow>
                        <div className="p-6 space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-[var(--shadow-glow)]">
                                <Image className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-bold text-base">Admin Background</h3>
                                <p className="text-xs text-muted-foreground">Customize with image, effects & position.</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={resetBgDefaults} className="gap-1.5 text-xs rounded-xl">
                              <RotateCcw className="w-3 h-3" />
                              Reset
                            </Button>
                          </div>

                          {/* Image Upload */}
                          <div className="space-y-3">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Image Source</Label>
                            <label className="block">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setUploadingBg(true);
                                  try {
                                    const ext = file.name.split('.').pop();
                                    const path = `backgrounds/admin-bg-${Date.now()}.${ext}`;
                                    const { error } = await supabase.storage
                                      .from('admin-assets')
                                      .upload(path, file, { upsert: true });
                                    if (error) throw error;
                                    const { data: urlData } = supabase.storage
                                      .from('admin-assets')
                                      .getPublicUrl(path);
                                    setBgImageUrl(urlData.publicUrl);
                                    sonnerToast.success('Image uploaded');
                                  } catch (err) {
                                    console.error(err);
                                    sonnerToast.error('Upload failed');
                                  } finally {
                                    setUploadingBg(false);
                                    e.target.value = '';
                                  }
                                }}
                              />
                              <div className={cn(
                                "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border/60",
                                "hover:border-primary/40 hover:bg-primary/5 hover:shadow-[var(--shadow-glow)] cursor-pointer transition-all duration-300 text-sm text-muted-foreground",
                                uploadingBg && "opacity-50 pointer-events-none"
                              )}>
                                <Upload className="w-4 h-4" />
                                {uploadingBg ? 'Uploading...' : 'Upload Image'}
                              </div>
                            </label>

                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                              <div className="flex-1 h-px bg-border/40" />
                              <span>or paste URL</span>
                              <div className="flex-1 h-px bg-border/40" />
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="https://images.unsplash.com/..."
                                value={bgImageUrl}
                                onChange={(e) => setBgImageUrl(e.target.value)}
                                className="flex-1 rounded-xl bg-background/40"
                              />
                              {bgImageUrl && (
                                <Button variant="ghost" size="icon" onClick={() => setBgImageUrl('')} className="shrink-0 rounded-xl">
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Draggable Preview */}
                          {bgImageUrl && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Move className="w-3.5 h-3.5 text-muted-foreground" />
                                  <Label className="text-xs font-semibold">Click a device to adjust it</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    className="text-[10px] text-primary hover:text-primary/80 font-medium transition-colors"
                                    onClick={copyToAllDevices}
                                  >
                                    Copy to all
                                  </button>
                                  <button
                                    type="button"
                                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={() => updateCurrentBg({ posX: 50, posY: 50 })}
                                  >
                                    Center
                                  </button>
                                </div>
                              </div>

                              {/* Multi-device preview */}
                              <div className="flex items-end justify-center gap-3">
                                {([
                                  { key: 'desktop' as DeviceKey, icon: Monitor, label: 'Desktop', aspect: 'aspect-[16/10]', maxW: 'flex-1 max-w-[260px]' },
                                  { key: 'tablet' as DeviceKey, icon: Tablet, label: 'Tablet', aspect: 'aspect-[3/4]', maxW: 'w-[90px]' },
                                  { key: 'mobile' as DeviceKey, icon: Smartphone, label: 'Mobile', aspect: 'aspect-[9/16]', maxW: 'w-[50px]' },
                                ]).map(device => {
                                  const s = getBg(device.key);
                                  const isSelected = selectedDevice === device.key;
                                  const DevIcon = device.icon;
                                  return (
                                    <div key={device.key} className={cn("flex flex-col items-center gap-1", device.maxW)}>
                                      <div
                                        className={cn(
                                          "relative w-full rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing select-none",
                                          "shadow-[var(--shadow-md)] transition-all duration-300 bg-muted/30",
                                          device.aspect,
                                          isSelected
                                            ? "border-primary shadow-[0_0_16px_hsl(var(--primary)/0.3)] ring-1 ring-primary/20"
                                            : "border-border/50 hover:border-border opacity-70 hover:opacity-100"
                                        )}
                                        onClick={() => setSelectedDevice(device.key)}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          setSelectedDevice(device.key);
                                          setIsDraggingPos(true);
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          const handleMove = (ev: MouseEvent) => {
                                            const x = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
                                            const y = Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100));
                                            setDeviceSettings(prev => ({ ...prev, [device.key]: { ...prev[device.key], posX: Math.round(x), posY: Math.round(y) } }));
                                          };
                                          const handleUp = () => {
                                            setIsDraggingPos(false);
                                            window.removeEventListener('mousemove', handleMove);
                                            window.removeEventListener('mouseup', handleUp);
                                          };
                                          window.addEventListener('mousemove', handleMove);
                                          window.addEventListener('mouseup', handleUp);
                                        }}
                                        onTouchStart={(e) => {
                                          setSelectedDevice(device.key);
                                          setIsDraggingPos(true);
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          const handleMove = (ev: TouchEvent) => {
                                            const touch = ev.touches[0];
                                            const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
                                            const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100));
                                            setDeviceSettings(prev => ({ ...prev, [device.key]: { ...prev[device.key], posX: Math.round(x), posY: Math.round(y) } }));
                                          };
                                          const handleEnd = () => {
                                            setIsDraggingPos(false);
                                            window.removeEventListener('touchmove', handleMove);
                                            window.removeEventListener('touchend', handleEnd);
                                          };
                                          window.addEventListener('touchmove', handleMove);
                                          window.addEventListener('touchend', handleEnd);
                                        }}
                                      >
                                        <img src={bgImageUrl} alt="" className="absolute inset-0 w-full h-full pointer-events-none" style={{
                                          filter: `blur(${s.blur}px) brightness(${s.brightness}%) saturate(${s.saturation}%)`,
                                          opacity: s.opacity / 100, objectFit: 'cover', objectPosition: `${s.posX}% ${s.posY}%`, transform: `scale(${s.scale / 100})`,
                                        }} />
                                        <div className="absolute inset-0" style={{ backgroundColor: `hsl(var(--background) / ${s.overlay / 100})` }} />
                                        {/* Simulated content */}
                                        {device.key === 'desktop' && (
                                          <div className="absolute inset-0 flex flex-col p-2 pointer-events-none">
                                            <div className="flex gap-1 mb-1.5">
                                              <div className="h-1 w-8 rounded-full bg-foreground/15" />
                                              <div className="h-1 w-5 rounded-full bg-foreground/10" />
                                              <div className="h-1 w-5 rounded-full bg-foreground/10 ml-auto" />
                                            </div>
                                            <div className="flex-1 flex gap-1.5">
                                              <div className="w-6 flex flex-col gap-1 py-1">
                                                {[1,2,3,4].map(i => <div key={i} className="h-1 w-full rounded-full bg-foreground/10" />)}
                                              </div>
                                              <div className="flex-1 grid grid-cols-3 gap-1 auto-rows-[12px] py-1">
                                                {[1,2,3,4,5,6].map(i => <div key={i} className="rounded bg-foreground/8" />)}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        {device.key === 'tablet' && (
                                          <div className="absolute inset-0 flex flex-col p-1.5 pointer-events-none">
                                            <div className="h-0.5 w-6 rounded-full bg-foreground/12 mb-1" />
                                            <div className="flex-1 grid grid-cols-2 gap-0.5 auto-rows-[8px]">
                                              {[1,2,3,4].map(i => <div key={i} className="rounded-sm bg-foreground/8" />)}
                                            </div>
                                          </div>
                                        )}
                                        {device.key === 'mobile' && (
                                          <div className="absolute inset-0 flex flex-col p-1 pointer-events-none">
                                            <div className="h-0.5 w-4 rounded-full bg-foreground/12 mx-auto mb-0.5" />
                                            <div className="flex-1 flex flex-col gap-0.5">
                                              {[1,2,3].map(i => <div key={i} className="h-2 w-full rounded-sm bg-foreground/8" />)}
                                            </div>
                                            <div className="h-1.5 w-6 rounded-full bg-foreground/10 mx-auto mt-0.5" />
                                          </div>
                                        )}
                                        {/* Position indicator */}
                                        <motion.div
                                          animate={{ left: `${s.posX}%`, top: `${s.posY}%` }}
                                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                          className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                        >
                                          <div className={cn(
                                            "w-full h-full rounded-full border-2 transition-all",
                                            isSelected
                                              ? "border-primary bg-primary/20 shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
                                              : "border-muted-foreground/40 bg-muted-foreground/10"
                                          )} />
                                        </motion.div>
                                      </div>
                                      <button
                                        onClick={() => setSelectedDevice(device.key)}
                                        className={cn(
                                          "flex items-center gap-1 text-[9px] transition-colors",
                                          isSelected ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                                        )}
                                      >
                                        <DevIcon className="w-2.5 h-2.5" />
                                        <span>{device.label}</span>
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>

                              <p className="text-[10px] text-muted-foreground text-center font-mono tabular-nums">
                                <span className="text-primary font-semibold capitalize">{selectedDevice}</span> — Position: {currentBg.posX}% × {currentBg.posY}%
                              </p>
                            </motion.div>
                          )}

                          {/* Effects Controls — per selected device */}
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3" />
                              Effects — <span className="text-primary capitalize">{selectedDevice}</span>
                            </Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <SliderControl icon={Droplets} label="Blur" value={currentBg.blur} onChange={(v) => updateCurrentBg({ blur: v })} min={0} max={30} step={1} unit="px" />
                              <SliderControl icon={Eye} label="Image Opacity" value={currentBg.opacity} onChange={(v) => updateCurrentBg({ opacity: v })} min={0} max={100} step={5} unit="%" />
                              <SliderControl icon={Contrast} label="Overlay" value={currentBg.overlay} onChange={(v) => updateCurrentBg({ overlay: v })} min={0} max={100} step={5} unit="%" />
                              <SliderControl icon={Sun} label="Brightness" value={currentBg.brightness} onChange={(v) => updateCurrentBg({ brightness: v })} min={0} max={200} step={5} unit="%" />
                              <SliderControl icon={Moon} label="Saturation" value={currentBg.saturation} onChange={(v) => updateCurrentBg({ saturation: v })} min={0} max={200} step={5} unit="%" />
                              <SliderControl icon={ZoomIn} label="Zoom" value={currentBg.scale} onChange={(v) => updateCurrentBg({ scale: v })} min={100} max={200} step={5} unit="%" />
                            </div>
                            </div>

                          {/* Element Styles */}
                          <div className="space-y-3">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <Palette className="w-3 h-3" />
                              Element Styles
                            </Label>

                            {/* Element selector tabs */}
                            <div className="flex gap-1 p-1 rounded-xl bg-background/40 border border-border/30">
                              {([
                                { key: 'card' as ElementKey, icon: Square, label: 'Cards' },
                                { key: 'border' as ElementKey, icon: Columns, label: 'Borders' },
                                { key: 'header' as ElementKey, icon: PanelTop, label: 'Header' },
                              ]).map(el => {
                                const ElIcon = el.icon;
                                const isActive = selectedElement === el.key;
                                return (
                                  <button
                                    key={el.key}
                                    onClick={() => setSelectedElement(el.key)}
                                    className={cn(
                                      "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                                      isActive
                                        ? "bg-primary/10 text-primary shadow-[0_0_8px_hsl(var(--primary)/0.15)]"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                                    )}
                                  >
                                    <ElIcon className="w-3.5 h-3.5" />
                                    <span>{el.label}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Element preview chip */}
                            <div className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-background/30">
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

                            {/* Element controls */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <SliderControl icon={Droplets} label="Blur" value={currentElement.blur} onChange={(v) => updateElement({ blur: v })} min={0} max={40} step={1} unit="px" />
                              <SliderControl icon={Eye} label="Opacity" value={currentElement.opacity} onChange={(v) => updateElement({ opacity: v })} min={0} max={100} step={5} unit="%" />
                            </div>

                            {/* Color picker */}
                            <div className="group space-y-2 p-3 rounded-xl bg-background/40 border border-border/30 hover:border-primary/20 transition-all duration-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                                    <Palette className="w-3.5 h-3.5" />
                                  </div>
                                  <Label className="text-xs font-semibold">Color</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  {currentElement.color && (
                                    <button
                                      onClick={() => updateElement({ color: '' })}
                                      className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      Reset
                                    </button>
                                  )}
                                  <input
                                    type="color"
                                    value={currentElement.color || '#000000'}
                                    onChange={(e) => updateElement({ color: e.target.value })}
                                    className="w-7 h-7 rounded-lg border border-border/50 cursor-pointer bg-transparent"
                                  />
                                </div>
                              </div>
                              <Input
                                placeholder="Default (theme color)"
                                value={currentElement.color}
                                onChange={(e) => updateElement({ color: e.target.value })}
                                className="rounded-lg bg-background/40 text-xs h-8 font-mono"
                              />
                            </div>
                          </div>

                          <Button
                            onClick={saveBgSettings}
                            disabled={savingBg}
                            className="w-full rounded-xl h-11 text-sm font-semibold shadow-[var(--shadow-glow)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] transition-shadow"
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            {savingBg ? 'Saving...' : 'Save Background Settings'}
                          </Button>
                        </div>
                      </GlassCard>
                    </div>
                  )}
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </div>
      </div>

      {/* Mobile Content (no sidebar) */}
      <div className="md:hidden px-3 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="products" className="mt-0">
            <KrolistProductsManager />
          </TabsContent>
          <TabsContent value="stickers" className="mt-0">
            <StickersManager />
          </TabsContent>
          <TabsContent value="promo-codes" className="mt-0">
            <PromoCodesManager />
          </TabsContent>
          <TabsContent value="api-settings" className="mt-0">
            <ApiSettingsManager />
          </TabsContent>
          <TabsContent value="settings" className="mt-0">
            <div className="space-y-4">
              {/* Mobile Section Visibility */}
              <GlassCard>
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Lock className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-bold text-sm">Section Visibility</h3>
                  </div>

                  <div className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all",
                    articlesLocked ? "border-destructive/30 bg-destructive/5" : "border-border/40 bg-background/40"
                  )}>
                    <div className="flex items-center gap-2">
                      {articlesLocked ? <Lock className="w-4 h-4 text-destructive" /> : <Unlock className="w-4 h-4 text-primary" />}
                      <span className="text-sm font-medium">Articles</span>
                    </div>
                    <Switch checked={!articlesLocked} onCheckedChange={(c) => toggleSectionLock('articles', !c)} disabled={loadingLocks} />
                  </div>

                  <div className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all",
                    stickersLocked ? "border-destructive/30 bg-destructive/5" : "border-border/40 bg-background/40"
                  )}>
                    <div className="flex items-center gap-2">
                      {stickersLocked ? <Lock className="w-4 h-4 text-destructive" /> : <Unlock className="w-4 h-4 text-primary" />}
                      <span className="text-sm font-medium">Stickers</span>
                    </div>
                    <Switch checked={!stickersLocked} onCheckedChange={(c) => toggleSectionLock('stickers', !c)} disabled={loadingLocks} />
                  </div>
                </div>
              </GlassCard>

              {/* Mobile Background Settings */}
              <GlassCard>
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Image className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-bold text-sm">Background</h3>
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetBgDefaults} className="text-xs h-7 rounded-lg">
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Reset
                    </Button>
                  </div>

                  {/* Upload */}
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingBg(true);
                        try {
                          const ext = file.name.split('.').pop();
                          const path = `backgrounds/admin-bg-${Date.now()}.${ext}`;
                          const { error } = await supabase.storage
                            .from('admin-assets')
                            .upload(path, file, { upsert: true });
                          if (error) throw error;
                          const { data: urlData } = supabase.storage
                            .from('admin-assets')
                            .getPublicUrl(path);
                          setBgImageUrl(urlData.publicUrl);
                          sonnerToast.success('Image uploaded');
                        } catch (err) {
                          console.error(err);
                          sonnerToast.error('Upload failed');
                        } finally {
                          setUploadingBg(false);
                          e.target.value = '';
                        }
                      }}
                    />
                    <div className={cn(
                      "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-border/60",
                      "hover:border-primary/40 cursor-pointer transition-all text-sm text-muted-foreground",
                      uploadingBg && "opacity-50 pointer-events-none"
                    )}>
                      <Upload className="w-4 h-4" />
                      {uploadingBg ? 'Uploading...' : 'Upload Image'}
                    </div>
                  </label>

                  <div className="flex gap-2">
                    <Input
                      placeholder="or paste URL..."
                      value={bgImageUrl}
                      onChange={(e) => setBgImageUrl(e.target.value)}
                      className="flex-1 rounded-xl bg-background/40 text-xs"
                    />
                    {bgImageUrl && (
                      <Button variant="ghost" size="icon" onClick={() => setBgImageUrl('')} className="shrink-0 rounded-xl h-9 w-9">
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Mobile Preview */}
                  {bgImageUrl && (
                    <div className="space-y-2">
                      {/* Device selector tabs */}
                      <div className="flex gap-1 p-1 rounded-lg bg-background/40 border border-border/30">
                        {(['desktop', 'tablet', 'mobile'] as DeviceKey[]).map(d => (
                          <button
                            key={d}
                            onClick={() => setSelectedDevice(d)}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-medium transition-all",
                              selectedDevice === d ? "bg-primary/10 text-primary" : "text-muted-foreground"
                            )}
                          >
                            {d === 'desktop' ? <Monitor className="w-3 h-3" /> : d === 'tablet' ? <Tablet className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                            <span className="capitalize">{d}</span>
                          </button>
                        ))}
                      </div>
                      <div
                        className="relative w-full h-36 rounded-xl overflow-hidden border border-primary/30 cursor-grab active:cursor-grabbing select-none shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
                        onTouchStart={(e) => {
                          setIsDraggingPos(true);
                          const rect = e.currentTarget.getBoundingClientRect();
                          const handleMove = (ev: TouchEvent) => {
                            const touch = ev.touches[0];
                            const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
                            const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100));
                            updateCurrentBg({ posX: Math.round(x), posY: Math.round(y) });
                          };
                          const handleEnd = () => {
                            setIsDraggingPos(false);
                            window.removeEventListener('touchmove', handleMove);
                            window.removeEventListener('touchend', handleEnd);
                          };
                          window.addEventListener('touchmove', handleMove);
                          window.addEventListener('touchend', handleEnd);
                        }}
                      >
                        <img
                          src={bgImageUrl}
                          alt="Preview"
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          style={{
                            filter: `blur(${currentBg.blur}px) brightness(${currentBg.brightness}%) saturate(${currentBg.saturation}%)`,
                            opacity: currentBg.opacity / 100,
                            objectFit: 'cover',
                            objectPosition: `${currentBg.posX}% ${currentBg.posY}%`,
                            transform: `scale(${currentBg.scale / 100})`,
                          }}
                        />
                        <div className="absolute inset-0" style={{ backgroundColor: `hsl(var(--background) / ${currentBg.overlay / 100})` }} />
                        <div
                          className="absolute w-3 h-3 rounded-full border-2 border-primary bg-primary/20 -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                          style={{ left: `${currentBg.posX}%`, top: `${currentBg.posY}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center font-mono">
                        <span className="text-primary capitalize font-semibold">{selectedDevice}</span> — {currentBg.posX}% × {currentBg.posY}%
                      </p>
                    </div>
                  )}

                  {/* Mobile Sliders */}
                  <div className="space-y-2">
                    <SliderControl icon={Droplets} label="Blur" value={currentBg.blur} onChange={(v) => updateCurrentBg({ blur: v })} min={0} max={30} step={1} unit="px" />
                    <SliderControl icon={Eye} label="Opacity" value={currentBg.opacity} onChange={(v) => updateCurrentBg({ opacity: v })} min={0} max={100} step={5} unit="%" />
                    <SliderControl icon={Contrast} label="Overlay" value={currentBg.overlay} onChange={(v) => updateCurrentBg({ overlay: v })} min={0} max={100} step={5} unit="%" />
                    <SliderControl icon={Sun} label="Brightness" value={currentBg.brightness} onChange={(v) => updateCurrentBg({ brightness: v })} min={0} max={200} step={5} unit="%" />
                    <SliderControl icon={Moon} label="Saturation" value={currentBg.saturation} onChange={(v) => updateCurrentBg({ saturation: v })} min={0} max={200} step={5} unit="%" />
                    <SliderControl icon={ZoomIn} label="Zoom" value={currentBg.scale} onChange={(v) => updateCurrentBg({ scale: v })} min={100} max={200} step={5} unit="%" />
                  </div>

                  {/* Mobile Element Styles */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Palette className="w-3 h-3" /> Element Styles
                    </Label>
                    <div className="flex gap-1 p-1 rounded-lg bg-background/40 border border-border/30">
                      {([
                        { key: 'card' as ElementKey, icon: Square, label: 'Cards' },
                        { key: 'border' as ElementKey, icon: Columns, label: 'Borders' },
                        { key: 'header' as ElementKey, icon: PanelTop, label: 'Header' },
                      ]).map(el => {
                        const ElIcon = el.icon;
                        return (
                          <button key={el.key} onClick={() => setSelectedElement(el.key)}
                            className={cn("flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-medium transition-all",
                              selectedElement === el.key ? "bg-primary/10 text-primary" : "text-muted-foreground"
                            )}>
                            <ElIcon className="w-3 h-3" /><span>{el.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <SliderControl icon={Droplets} label="Blur" value={currentElement.blur} onChange={(v) => updateElement({ blur: v })} min={0} max={40} step={1} unit="px" />
                    <SliderControl icon={Eye} label="Opacity" value={currentElement.opacity} onChange={(v) => updateElement({ opacity: v })} min={0} max={100} step={5} unit="%" />
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-background/40 border border-border/30">
                      <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium flex-1">Color</span>
                      {currentElement.color && <button onClick={() => updateElement({ color: '' })} className="text-[10px] text-muted-foreground">Reset</button>}
                      <input type="color" value={currentElement.color || '#000000'} onChange={(e) => updateElement({ color: e.target.value })} className="w-6 h-6 rounded border border-border/50 cursor-pointer bg-transparent" />
                    </div>
                  </div>
                  <Button
                    onClick={saveBgSettings}
                    disabled={savingBg}
                    className="w-full rounded-xl h-10 text-sm font-semibold shadow-[var(--shadow-glow)]"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {savingBg ? 'Saving...' : 'Save Background'}
                  </Button>
                </div>
              </GlassCard>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Bottom Nav — floating glass dock */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-50">
        <div className="rounded-2xl shadow-[var(--shadow-lg)]" style={{ backdropFilter: `blur(var(--admin-header-blur, 24px))`, backgroundColor: `var(--admin-header-color, hsl(var(--card) / var(--admin-header-opacity, 0.8)))`, border: `1px solid var(--admin-border-color, hsl(var(--border) / var(--admin-border-opacity, 0.5)))` }}>
          <div className="grid grid-cols-6 gap-1 p-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => tab.isLink && tab.href ? navigate(tab.href!) : setActiveTab(tab.value)}
                  className={cn(
                    "relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200",
                    isActive && !tab.isLink
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && !tab.isLink && (
                    <motion.div
                      layoutId="admin-mobile-active"
                      className="absolute inset-0 rounded-xl bg-primary/10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={cn("h-4.5 w-4.5 relative z-10", isActive && !tab.isLink && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]")} />
                  <span className={cn("text-[9px] mt-0.5 font-medium truncate max-w-full relative z-10", isActive && !tab.isLink && "font-bold")}>
                    {tab.label.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
