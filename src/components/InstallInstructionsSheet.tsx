import { useState } from "react";
import { 
  Share, 
  ChevronDown, 
  PlusSquare, 
  Check, 
  MoreVertical, 
  Download, 
  Home, 
  Menu,
  Copy,
  Compass,
  Link,
  Info,
  ExternalLink,
  ArrowRight,
  MoreHorizontal,
  File,
  Plus,
  Smartphone,
  Tablet,
  Monitor,
  Chrome
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  type DeviceType, 
  type BrowserType,
  type InstallInstructions,
  getInstallInstructions,
  getInAppBrowserInstructions,
  getDeviceLabel,
  getBrowserLabel
} from "@/lib/pwaInstall";
import { supabase } from "@/integrations/supabase/client";

interface InstallInstructionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: DeviceType;
  browser: BrowserType;
  installCount?: number | null;
}

// Map icon names to components
const iconMap: Record<string, React.ReactNode> = {
  'share': <Share className="h-4 w-4" />,
  'chevron-down': <ChevronDown className="h-4 w-4" />,
  'plus-square': <PlusSquare className="h-4 w-4" />,
  'check': <Check className="h-4 w-4" />,
  'more-vertical': <MoreVertical className="h-4 w-4" />,
  'download': <Download className="h-4 w-4" />,
  'home': <Home className="h-4 w-4" />,
  'menu': <Menu className="h-4 w-4" />,
  'copy': <Copy className="h-4 w-4" />,
  'compass': <Compass className="h-4 w-4" />,
  'link': <Link className="h-4 w-4" />,
  'info': <Info className="h-4 w-4" />,
  'external-link': <ExternalLink className="h-4 w-4" />,
  'arrow-right': <ArrowRight className="h-4 w-4" />,
  'more-horizontal': <MoreHorizontal className="h-4 w-4" />,
  'file': <File className="h-4 w-4" />,
  'plus': <Plus className="h-4 w-4" />,
  'chrome': <Chrome className="h-4 w-4" />,
};

// Device icon based on type
function getDeviceIcon(device: DeviceType): React.ReactNode {
  if (device === 'iphone' || device === 'android-phone') {
    return <Smartphone className="h-5 w-5" />;
  }
  if (device === 'ipad' || device === 'android-tablet') {
    return <Tablet className="h-5 w-5" />;
  }
  return <Monitor className="h-5 w-5" />;
}

export function InstallInstructionsSheet({
  open,
  onOpenChange,
  device,
  browser,
  installCount
}: InstallInstructionsSheetProps) {
  const { language } = useLanguage();
  const [hasConfirmedInstall, setHasConfirmedInstall] = useState(false);
  
  const isInAppBrowser = browser === 'in-app-browser';
  const instructions: InstallInstructions = isInAppBrowser 
    ? getInAppBrowserInstructions()
    : getInstallInstructions(device, browser);
  
  const lang = language === 'ar' ? 'ar' : 'en';
  
  const handleConfirmInstall = async () => {
    setHasConfirmedInstall(true);
    
    // Track the manual install confirmation
    try {
      await supabase.from('app_installs').insert({
        user_agent: navigator.userAgent,
        platform: `${device}-${browser}-manual-confirmed`
      });
    } catch (error) {
      console.error('Error tracking install:', error);
    }
    
    // Close sheet after animation
    setTimeout(() => {
      onOpenChange(false);
      setHasConfirmedInstall(false);
    }, 1500);
  };
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-2xl bg-primary/10">
              {getDeviceIcon(device)}
            </div>
          </div>
          <SheetTitle className="text-xl">
            {instructions.title[lang]}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {lang === 'ar' 
              ? `${getBrowserLabel(browser, 'ar')} على ${getDeviceLabel(device, 'ar')}`
              : `${getBrowserLabel(browser, 'en')} on ${getDeviceLabel(device, 'en')}`
            }
          </p>
        </SheetHeader>
        
        <div className="py-6 space-y-6">
          {/* Install count badge */}
          {installCount && installCount > 0 && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                {lang === 'ar' 
                  ? `${installCount}+ مستخدم قاموا بالتثبيت`
                  : `${installCount}+ users installed`
                }
              </div>
            </div>
          )}
          
          {/* Browser note if applicable */}
          {instructions.browserNote && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
              <Info className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm">{instructions.browserNote[lang]}</p>
            </div>
          )}
          
          {/* Steps */}
          <ol className="space-y-4">
            {instructions.steps.map((step, index) => (
              <li 
                key={index} 
                className="flex gap-4 items-start animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    {step.icon && iconMap[step.icon] && (
                      <span className="text-muted-foreground">
                        {iconMap[step.icon]}
                      </span>
                    )}
                    <span className="text-sm font-medium">{step.text[lang]}</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          
          {/* Hint */}
          {instructions.hint && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted text-muted-foreground text-sm">
              <Share className="h-4 w-4 shrink-0" />
              <span>{instructions.hint[lang]}</span>
            </div>
          )}
          
          {/* iOS Safari Share button visual hint */}
          {(device === 'iphone' || device === 'ipad') && browser === 'safari' && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                <div className="p-2 rounded-xl bg-blue-500 text-white">
                  <Share className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="p-2 rounded-xl bg-muted">
                  <PlusSquare className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="p-2 rounded-xl bg-green-500 text-white">
                  <Check className="h-5 w-5" />
                </div>
              </div>
            </div>
          )}
          
          {/* Android menu visual hint */}
          {(device === 'android-phone' || device === 'android-tablet') && browser !== 'samsung-internet' && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
                <div className="p-2 rounded-xl bg-muted">
                  <MoreVertical className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="p-2 rounded-xl bg-green-500 text-white">
                  <Download className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="p-2 rounded-xl bg-green-500 text-white">
                  <Check className="h-5 w-5" />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="space-y-3 pt-2 pb-4">
          {hasConfirmedInstall ? (
            <div className="flex items-center justify-center gap-2 py-3 text-green-600 dark:text-green-400 animate-scale-in">
              <Check className="h-5 w-5" />
              <span className="font-medium">
                {lang === 'ar' ? 'شكراً لك!' : 'Thank you!'}
              </span>
            </div>
          ) : (
            <>
              <Button 
                onClick={handleConfirmInstall}
                className="w-full gap-2"
                size="lg"
              >
                <Check className="h-4 w-4" />
                {lang === 'ar' ? 'لقد قمت بالتثبيت!' : "I've installed it!"}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                {lang === 'ar' ? 'ذكرني لاحقاً' : 'Remind me later'}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
