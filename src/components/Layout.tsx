import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
interface LayoutProps {
  children: React.ReactNode;
}
export function Layout({
  children
}: LayoutProps) {
  const {
    language
  } = useLanguage();
  return <TooltipProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="h-16 flex items-center border-b border-border bg-card px-4">
              <SidebarTrigger className="mr-4" />
              <h2 className="text-lg font-semibold text-primary">PriceTracker</h2>
            </header>
            
            {/* Main Content */}
            <main className="flex-1 p-6 overflow-auto mx-0 px-[10px] py-[10px]">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
        <Sonner />
      </SidebarProvider>
    </TooltipProvider>;
}