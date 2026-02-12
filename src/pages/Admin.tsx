import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield, Package, Menu, FileText, Sticker, Lock, Unlock, Settings, Tag, Image, Upload, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import KrolistProductsManager from "./admin/KrolistProductsManager";
import StickersManager from "./admin/StickersManager";
import PromoCodesManager from "./admin/PromoCodesManager";
import { toast as sonnerToast } from "sonner";

export default function Admin() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("products");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Section lock states
  const [articlesLocked, setArticlesLocked] = useState(false);
  const [stickersLocked, setStickersLocked] = useState(false);
  const [loadingLocks, setLoadingLocks] = useState(true);

  // Background settings
  const [bgImageUrl, setBgImageUrl] = useState("");
  const [bgBlur, setBgBlur] = useState(0);
  const [bgOpacity, setBgOpacity] = useState(20);
  const [savingBg, setSavingBg] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  const tabs = [
    { value: "products", label: t('admin.krolistProducts'), icon: Package },
    { value: "articles", label: "Articles", icon: FileText, isLink: true, href: "/admin/articles" },
    { value: "stickers", label: "Stickers", icon: Sticker },
    { value: "promo-codes", label: "Promo Codes", icon: Tag },
    { value: "settings", label: "Settings", icon: Settings },
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

  const fetchBgSettings = async () => {
    try {
      const { data } = await supabase
        .from('page_content')
        .select('page_key, content_en')
        .in('page_key', ['admin_bg_image', 'admin_bg_blur', 'admin_bg_opacity']);
      if (data) {
        data.forEach(row => {
          if (row.page_key === 'admin_bg_image') setBgImageUrl(row.content_en || '');
          if (row.page_key === 'admin_bg_blur') setBgBlur(Number(row.content_en) || 0);
          if (row.page_key === 'admin_bg_opacity') setBgOpacity(Number(row.content_en) || 20);
        });
      }
    } catch (err) {
      console.error('Error fetching bg settings:', err);
    }
  };

  const saveBgSettings = async () => {
    setSavingBg(true);
    try {
      const settings = [
        { page_key: 'admin_bg_image', content_en: bgImageUrl, description: 'Admin background image URL' },
        { page_key: 'admin_bg_blur', content_en: String(bgBlur), description: 'Admin background blur (px)' },
        { page_key: 'admin_bg_opacity', content_en: String(bgOpacity), description: 'Admin background opacity (%)' },
      ];
      for (const s of settings) {
        await supabase.from('page_content').upsert(s, { onConflict: 'page_key' });
      }
      sonnerToast.success('Background settings saved');
      // Dispatch event so AdminLayout picks it up live
      window.dispatchEvent(new CustomEvent('admin-bg-updated'));
    } catch (err) {
      console.error('Error saving bg settings:', err);
      sonnerToast.error('Failed to save background settings');
    } finally {
      setSavingBg(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-6 relative z-10">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">{t('admin.dashboard')}</h1>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
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
                        className="w-full justify-start"
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
                      className="w-full justify-start"
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

      {/* Desktop Header */}
      <div className="hidden md:block container mx-auto py-6 px-4 max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold mx-0">{t('admin.dashboard')}</h1>
            <p className="text-muted-foreground">{t('admin.dashboardDesc')}</p>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-0 px-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop Tabs */}
          <TabsList className="hidden md:inline-flex w-full lg:w-auto gap-2 flex-wrap mb-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              if (tab.isLink && tab.href) {
                return (
                  <Button key={tab.value} variant="ghost" size="sm" className="h-9 px-3" onClick={() => navigate(tab.href!)}>
                    <Icon className="h-4 w-4 mr-2" />
                    <span>{tab.label}</span>
                  </Button>
                );
              }
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="relative">
                  <Icon className="h-4 w-4 mr-2" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="products" className="mt-0 md:mt-6">
            <KrolistProductsManager />
          </TabsContent>

          <TabsContent value="stickers" className="mt-0 md:mt-6">
            <StickersManager />
          </TabsContent>

          <TabsContent value="promo-codes" className="mt-0 md:mt-6">
            <PromoCodesManager />
          </TabsContent>

          <TabsContent value="settings" className="mt-0 md:mt-6">
            <div className="max-w-2xl mx-auto space-y-6 px-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Section Visibility
                  </CardTitle>
                  <CardDescription>
                    Lock sections to hide them from public visitors.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Articles Lock */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        articlesLocked ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                      )}>
                        {articlesLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Articles Section</Label>
                        <p className="text-xs text-muted-foreground">
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
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        stickersLocked ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                      )}>
                        {stickersLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Stickers Section</Label>
                        <p className="text-xs text-muted-foreground">
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
                </CardContent>
              </Card>

              {/* Background Customization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Admin Background
                  </CardTitle>
                  <CardDescription>
                    Set a background image with blur and transparency effects.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Image Upload or URL */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Background Image</Label>
                    
                    {/* Upload button */}
                    <div className="flex gap-2">
                      <label className="flex-1">
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
                          "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-border",
                          "hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all text-sm text-muted-foreground",
                          uploadingBg && "opacity-50 pointer-events-none"
                        )}>
                          <Upload className="w-4 h-4" />
                          {uploadingBg ? 'Uploading...' : 'Upload Image'}
                        </div>
                      </label>
                    </div>

                    {/* OR URL input */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex-1 h-px bg-border" />
                      <span>or paste URL</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://images.unsplash.com/..."
                        value={bgImageUrl}
                        onChange={(e) => setBgImageUrl(e.target.value)}
                        className="flex-1"
                      />
                      {bgImageUrl && (
                        <Button variant="ghost" size="icon" onClick={() => setBgImageUrl('')} className="shrink-0">
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Preview */}
                  {bgImageUrl && (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-border">
                      <img
                        src={bgImageUrl}
                        alt="Background preview"
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                          filter: `blur(${bgBlur}px)`,
                          opacity: bgOpacity / 100,
                        }}
                      />
                      <div className="absolute inset-0 bg-background/60" />
                      <p className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground">
                        Live Preview
                      </p>
                    </div>
                  )}

                  {/* Blur Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Blur</Label>
                      <span className="text-xs text-muted-foreground">{bgBlur}px</span>
                    </div>
                    <Slider
                      value={[bgBlur]}
                      onValueChange={([v]) => setBgBlur(v)}
                      min={0}
                      max={30}
                      step={1}
                    />
                  </div>

                  {/* Opacity Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Image Opacity</Label>
                      <span className="text-xs text-muted-foreground">{bgOpacity}%</span>
                    </div>
                    <Slider
                      value={[bgOpacity]}
                      onValueChange={([v]) => setBgOpacity(v)}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>

                  <Button onClick={saveBgSettings} disabled={savingBg} className="w-full">
                    {savingBg ? 'Saving...' : 'Save Background Settings'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="grid grid-cols-5 gap-1 p-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => tab.isLink && tab.href ? navigate(tab.href!) : setActiveTab(tab.value)}
                className={cn(
                  "relative flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200",
                  isActive && !tab.isLink ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && !tab.isLink && "animate-scale-in")} />
                <span className={cn("text-[10px] mt-1 font-medium truncate max-w-full", isActive && !tab.isLink && "font-semibold")}>
                  {tab.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
