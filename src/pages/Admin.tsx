import { useState, useEffect } from "react";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Shield, Package, Menu, FileText, Sticker, Lock, Unlock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import KrolistProductsManager from "./admin/KrolistProductsManager";
import StickersManager from "./admin/StickersManager";
import { FunnyLoadingText } from "@/components/FunnyLoadingText";
import { toast as sonnerToast } from "sonner";

export default function Admin() {
  const { isAdmin, isLoading: roleLoading } = useAdminRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("products");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Section lock states
  const [articlesLocked, setArticlesLocked] = useState(false);
  const [stickersLocked, setStickersLocked] = useState(false);
  const [loadingLocks, setLoadingLocks] = useState(true);

  const tabs = [
    { value: "products", label: t('admin.krolistProducts'), icon: Package },
    { value: "articles", label: "Articles", icon: FileText, isLink: true, href: "/admin/articles" },
    { value: "stickers", label: "Stickers", icon: Sticker },
    { value: "settings", label: "Settings", icon: Lock },
  ];

  useEffect(() => {
    if (isAdmin) {
      fetchSectionLocks();
    }
  }, [isAdmin]);

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
      // Upsert the setting
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

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast({
        title: t('admin.accessDenied'),
        description: t('admin.accessDeniedDesc'),
        variant: "destructive",
      });
      navigate('/');
    }
  }, [isAdmin, roleLoading, navigate, toast, t]);

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FunnyLoadingText />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">{t('admin.accessDenied')}</h1>
          <p className="text-muted-foreground">{t('admin.accessDeniedDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-6">
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

          <TabsContent value="settings" className="mt-0 md:mt-6">
            <div className="max-w-2xl mx-auto space-y-6 px-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Section Visibility
                  </CardTitle>
                  <CardDescription>
                    Lock sections to hide them from public visitors. Locked sections show a "currently unavailable" message if accessed directly.
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
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="grid grid-cols-4 gap-1 p-2">
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
