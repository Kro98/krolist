import { useState, useEffect } from "react";
import { Download, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallButton() {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [installCount, setInstallCount] = useState<number | null>(null);

  useEffect(() => {
    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          setHasUpdate(true);
        });
      });

      // Also check periodically for updates
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration?.waiting) {
          setHasUpdate(true);
        }
      });
    }

    // Fetch install count
    fetchInstallCount();

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const fetchInstallCount = async () => {
    try {
      const { count, error } = await supabase
        .from('app_installs')
        .select('*', { count: 'exact', head: true });
      
      if (!error && count !== null) {
        setInstallCount(count);
      }
    } catch (error) {
      console.error('Error fetching install count:', error);
    }
  };

  const trackInstall = async () => {
    try {
      await supabase.from('app_installs').insert({
        user_agent: navigator.userAgent,
        platform: navigator.platform || 'unknown'
      });
      // Increment local count
      setInstallCount(prev => (prev ?? 0) + 1);
    } catch (error) {
      console.error('Error tracking install:', error);
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // If no prompt available, show instructions or try to trigger install
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      await trackInstall();
      setDeferredPrompt(null);
    }
  };

  const handleUpdate = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      } else {
        // Force check for updates
        await registration?.update();
        window.location.reload();
      }
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Download className="h-5 w-5" />
          {hasUpdate && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-primary rounded-full animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border-border">
        <DropdownMenuItem 
          onClick={handleInstall} 
          className="cursor-pointer flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          <span className="flex-1">{language === "ar" ? "تثبيت التطبيق" : "Install App"}</span>
          {installCount !== null && installCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              <Users className="h-3 w-3" />
              {formatCount(installCount)}
            </span>
          )}
        </DropdownMenuItem>
        {hasUpdate && (
          <DropdownMenuItem 
            onClick={handleUpdate} 
            className="cursor-pointer flex items-center gap-2 text-primary"
          >
            <RefreshCw className="h-4 w-4" />
            {language === "ar" ? "تثبيت التحديث" : "Install Update"}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
