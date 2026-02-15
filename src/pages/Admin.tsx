import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Shield, Package, Menu, FileText, Sticker, Settings, Server,
  Tag, Key, ChevronRight, ExternalLink, Plug, ChevronDown, Wrench
} from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import KrolistProductsManager from "./admin/KrolistProductsManager";
import StickersManager from "./admin/StickersManager";
import PromoCodesManager from "./admin/PromoCodesManager";
import ApiSettingsManager from "./admin/ApiSettingsManager";
import IntegrationHub from "./admin/IntegrationHub";
import SelfHostingGuide from "./admin/SelfHostingGuide";
import AdminSettings from "./admin/AdminSettings";

const systemSubTabs = [
  { value: "api-settings", label: "API Keys", icon: Key },
  { value: "integrations", label: "Hub", icon: Plug },
  { value: "hosting", label: "Hosting", icon: Server },
];

export default function Admin() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("products");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainTabs = [
    { value: "products", label: t('admin.krolistProducts'), icon: Package },
    { value: "articles", label: "Articles", icon: FileText, isLink: true, href: "/admin/articles" },
    { value: "stickers", label: "Stickers", icon: Sticker },
    { value: "promo-codes", label: "Promo Codes", icon: Tag },
  ];

  const isSystemTab = systemSubTabs.some(s => s.value === activeTab);
  const activeSystemSub = systemSubTabs.find(s => s.value === activeTab);

  return (
    <div className="min-h-screen pb-20 md:pb-6 relative z-10">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-40">
        <div className="mx-3 mt-2 rounded-2xl shadow-[var(--shadow-md)]" style={{ backdropFilter: `blur(var(--admin-header-blur, 24px))`, backgroundColor: `var(--admin-header-color, hsl(var(--card) / var(--admin-header-opacity, 0.8)))`, border: `1px solid var(--admin-border-color, hsl(var(--border) / var(--admin-border-opacity, 0.5)))` }}>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-base font-bold">{t('admin.dashboard')}</h1>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate('/')}>
                <ExternalLink className="h-4 w-4" />
              </Button>
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
                    {mainTabs.map(tab => {
                      const Icon = tab.icon;
                      if (tab.isLink && tab.href) {
                        return (
                          <Button key={tab.value} variant="ghost" className="w-full justify-start rounded-xl"
                            onClick={() => { navigate(tab.href!); setMobileMenuOpen(false); }}>
                            <Icon className="h-4 w-4 mr-2" />{tab.label}
                          </Button>
                        );
                      }
                      return (
                        <Button key={tab.value} variant={activeTab === tab.value ? "secondary" : "ghost"} className="w-full justify-start rounded-xl"
                          onClick={() => { setActiveTab(tab.value); setMobileMenuOpen(false); }}>
                          <Icon className="h-4 w-4 mr-2" />{tab.label}
                        </Button>
                      );
                    })}

                    {/* System group header */}
                    <div className="pt-3 pb-1 px-3">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">System</span>
                    </div>
                    {systemSubTabs.map(sub => {
                      const Icon = sub.icon;
                      return (
                        <Button key={sub.value} variant={activeTab === sub.value ? "secondary" : "ghost"} className="w-full justify-start rounded-xl"
                          onClick={() => { setActiveTab(sub.value); setMobileMenuOpen(false); }}>
                          <Icon className="h-4 w-4 mr-2" />{sub.label}
                        </Button>
                      );
                    })}

                    <div className="pt-3 pb-1 px-3">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Other</span>
                    </div>
                    <Button variant={activeTab === "settings" ? "secondary" : "ghost"} className="w-full justify-start rounded-xl"
                      onClick={() => { setActiveTab("settings"); setMobileMenuOpen(false); }}>
                      <Settings className="h-4 w-4 mr-2" />Settings
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex gap-6 container mx-auto py-6 px-4 max-w-[1400px]">
        <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }} className="w-[220px] shrink-0 sticky top-6 self-start">
          <div className="rounded-2xl shadow-[var(--shadow-lg)] p-4 space-y-2" style={{ backdropFilter: `blur(var(--admin-card-blur, 12px))`, backgroundColor: `var(--admin-card-color, hsl(var(--card) / var(--admin-card-opacity, 0.7)))`, border: `1px solid var(--admin-border-color, hsl(var(--border) / var(--admin-border-opacity, 0.5)))` }}>
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-2 pb-3 mb-2 border-b border-border/40">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shadow-[var(--shadow-glow)]">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-bold leading-tight">{t('admin.dashboard')}</h1>
                <p className="text-[10px] text-muted-foreground">Control Panel</p>
              </div>
            </div>

            {/* Main nav items */}
            {mainTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              if (tab.isLink && tab.href) {
                return (
                  <button key={tab.value} onClick={() => navigate(tab.href!)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-accent/60">
                    <Icon className="w-4 h-4" /><span>{tab.label}</span>
                    <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
                  </button>
                );
              }
              return (
                <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                  className={cn("relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive ? "bg-primary/10 text-primary shadow-[var(--shadow-glow)]" : "text-muted-foreground hover:text-foreground hover:bg-accent/60")}>
                  {isActive && <motion.div layoutId="admin-active-tab" className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                  <Icon className="w-4 h-4 relative z-10" /><span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}

            {/* System dropdown group */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isSystemTab ? "bg-primary/10 text-primary shadow-[var(--shadow-glow)]" : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                )}>
                  {isSystemTab && <motion.div layoutId="admin-active-tab" className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                  <Wrench className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{isSystemTab && activeSystemSub ? activeSystemSub.label : "System"}</span>
                  <ChevronDown className="w-3 h-3 ml-auto relative z-10 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-44 bg-popover z-50">
                {systemSubTabs.map(sub => {
                  const Icon = sub.icon;
                  return (
                    <DropdownMenuItem key={sub.value} onClick={() => setActiveTab(sub.value)}
                      className={cn("gap-2 cursor-pointer", activeTab === sub.value && "bg-primary/10 text-primary")}>
                      <Icon className="w-4 h-4" />{sub.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings */}
            <button onClick={() => setActiveTab("settings")}
              className={cn("relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                activeTab === "settings" ? "bg-primary/10 text-primary shadow-[var(--shadow-glow)]" : "text-muted-foreground hover:text-foreground hover:bg-accent/60")}>
              {activeTab === "settings" && <motion.div layoutId="admin-active-tab" className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
              <Settings className="w-4 h-4 relative z-10" /><span className="relative z-10">Settings</span>
            </button>

            {/* Back to site */}
            <button onClick={() => navigate('/')}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all duration-200 mt-2 border-t border-border/30 pt-4">
              <ExternalLink className="w-4 h-4" /><span>Back to Site</span>
            </button>
          </div>
        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="products" className="mt-0">
              <motion.div key="products" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}><KrolistProductsManager /></motion.div>
            </TabsContent>
            <TabsContent value="stickers" className="mt-0">
              <motion.div key="stickers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}><StickersManager /></motion.div>
            </TabsContent>
            <TabsContent value="promo-codes" className="mt-0">
              <motion.div key="promo-codes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}><PromoCodesManager /></motion.div>
            </TabsContent>
            <TabsContent value="api-settings" className="mt-0">
              <motion.div key="api-settings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}><ApiSettingsManager /></motion.div>
            </TabsContent>
            <TabsContent value="integrations" className="mt-0">
              <motion.div key="integrations" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}><IntegrationHub /></motion.div>
            </TabsContent>
            <TabsContent value="hosting" className="mt-0">
              <motion.div key="hosting" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}><SelfHostingGuide /></motion.div>
            </TabsContent>
            <TabsContent value="settings" className="mt-0">
              <motion.div key="settings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}><AdminSettings /></motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="md:hidden px-3 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="products" className="mt-0"><KrolistProductsManager /></TabsContent>
          <TabsContent value="stickers" className="mt-0"><StickersManager /></TabsContent>
          <TabsContent value="promo-codes" className="mt-0"><PromoCodesManager /></TabsContent>
          <TabsContent value="api-settings" className="mt-0"><ApiSettingsManager /></TabsContent>
          <TabsContent value="integrations" className="mt-0"><IntegrationHub /></TabsContent>
          <TabsContent value="hosting" className="mt-0"><SelfHostingGuide /></TabsContent>
          <TabsContent value="settings" className="mt-0"><AdminSettings /></TabsContent>
        </Tabs>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-50">
        <div className="rounded-2xl shadow-[var(--shadow-lg)]" style={{ backdropFilter: `blur(var(--admin-header-blur, 24px))`, backgroundColor: `var(--admin-header-color, hsl(var(--card) / var(--admin-header-opacity, 0.8)))`, border: `1px solid var(--admin-border-color, hsl(var(--border) / var(--admin-border-opacity, 0.5)))` }}>
          <div className="grid grid-cols-6 gap-1 p-2">
            {/* Main tabs */}
            {mainTabs.filter(t => !t.isLink).map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                  className={cn("relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                  {isActive && <motion.div layoutId="admin-mobile-active" className="absolute inset-0 rounded-xl bg-primary/10" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                  <Icon className={cn("h-4.5 w-4.5 relative z-10", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]")} />
                  <span className={cn("text-[9px] mt-0.5 font-medium truncate max-w-full relative z-10", isActive && "font-bold")}>{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}

            {/* Articles link */}
            <button onClick={() => navigate('/admin/articles')}
              className="relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground">
              <FileText className="h-4.5 w-4.5 relative z-10" />
              <span className="text-[9px] mt-0.5 font-medium truncate max-w-full relative z-10">Articles</span>
            </button>

            {/* System dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn("relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200",
                  isSystemTab ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                  {isSystemTab && <motion.div layoutId="admin-mobile-active" className="absolute inset-0 rounded-xl bg-primary/10" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                  <Wrench className={cn("h-4.5 w-4.5 relative z-10", isSystemTab && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]")} />
                  <span className={cn("text-[9px] mt-0.5 font-medium truncate max-w-full relative z-10", isSystemTab && "font-bold")}>System</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="center" className="w-40 bg-popover z-[60]">
                {systemSubTabs.map(sub => {
                  const Icon = sub.icon;
                  return (
                    <DropdownMenuItem key={sub.value} onClick={() => setActiveTab(sub.value)}
                      className={cn("gap-2 cursor-pointer", activeTab === sub.value && "bg-primary/10 text-primary")}>
                      <Icon className="w-4 h-4" />{sub.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings */}
            <button onClick={() => setActiveTab("settings")}
              className={cn("relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200",
                activeTab === "settings" ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
              {activeTab === "settings" && <motion.div layoutId="admin-mobile-active" className="absolute inset-0 rounded-xl bg-primary/10" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
              <Settings className={cn("h-4.5 w-4.5 relative z-10", activeTab === "settings" && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]")} />
              <span className={cn("text-[9px] mt-0.5 font-medium truncate max-w-full relative z-10", activeTab === "settings" && "font-bold")}>Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
