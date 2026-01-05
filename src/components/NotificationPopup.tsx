import { useEffect, useState, useRef } from 'react';
import { Check, Package, TrendingDown, Smartphone, ShoppingBag, Bell, Tag, Calendar, LogIn, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications, AppNotification } from '@/contexts/NotificationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AuthModal } from '@/components/AuthModal';

interface PopupNotification {
  notification: AppNotification;
  translateY: number;
  opacity: number;
  scale: number;
  isEntering: boolean;
  isDragging: boolean;
}

const DISMISSED_POPUPS_KEY = 'krolist_dismissed_popups';

const getDismissedPopupIds = (): Set<string> => {
  try {
    const stored = localStorage.getItem(DISMISSED_POPUPS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const now = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const cleaned: Record<string, number> = {};
      Object.entries(parsed).forEach(([id, timestamp]) => {
        if (now - (timestamp as number) < sevenDays) {
          cleaned[id] = timestamp as number;
        }
      });
      localStorage.setItem(DISMISSED_POPUPS_KEY, JSON.stringify(cleaned));
      return new Set(Object.keys(cleaned));
    }
  } catch (e) {
    console.error('Failed to parse dismissed popups:', e);
  }
  return new Set();
};

const saveDismissedPopupId = (id: string) => {
  try {
    const stored = localStorage.getItem(DISMISSED_POPUPS_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    parsed[id] = Date.now();
    localStorage.setItem(DISMISSED_POPUPS_KEY, JSON.stringify(parsed));
  } catch (e) {
    console.error('Failed to save dismissed popup:', e);
  }
};

export function NotificationPopup() {
  const { language } = useLanguage();
  const { notifications, markAsRead, dismissNotification, isGuest } = useNotifications();
  const [activePopups, setActivePopups] = useState<PopupNotification[]>([]);
  const [shownIds, setShownIds] = useState<Set<string>>(() => getDismissedPopupIds());
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const dragStartRef = useRef<{ id: string; startY: number } | null>(null);
  const isArabic = language === 'ar';

  useEffect(() => {
    if (isGuest && notifications.length > 0 && !sessionStorage.getItem('guest_notification_prompt_shown')) {
      setShowGuestPrompt(true);
      sessionStorage.setItem('guest_notification_prompt_shown', 'true');
    }
  }, [isGuest, notifications.length]);

  useEffect(() => {
    if (isGuest) return;
    if (activePopups.length > 0) return;
    
    const unreadNotifications = notifications.filter(n => !n.isRead && !shownIds.has(n.id));
    if (unreadNotifications.length > 0) {
      const nextNotification = unreadNotifications[0];
      const newPopup: PopupNotification = {
        notification: nextNotification,
        translateY: -100,
        opacity: 0,
        scale: 0.9,
        isEntering: true,
        isDragging: false
      };
      setActivePopups([newPopup]);
      setShownIds(prev => new Set([...prev, nextNotification.id]));

      requestAnimationFrame(() => {
        setTimeout(() => {
          setActivePopups(prev => prev.map(p => ({
            ...p,
            translateY: 0,
            opacity: 1,
            scale: 1,
            isEntering: false
          })));
        }, 50);
      });
    }
  }, [notifications, shownIds, activePopups.length, isGuest]);

  const handleDismiss = (id: string) => {
    setActivePopups(prev => prev.map(p => p.notification.id === id ? {
      ...p,
      translateY: -100,
      opacity: 0,
      scale: 0.9
    } : p));
    setTimeout(() => {
      setActivePopups(prev => prev.filter(p => p.notification.id !== id));
    }, 300);
  };

  const handleMarkAsRead = (id: string) => {
    saveDismissedPopupId(id);
    markAsRead(id);
    handleDismiss(id);
  };

  const handleRemove = (id: string) => {
    saveDismissedPopupId(id);
    dismissNotification(id);
    handleDismiss(id);
  };

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    dragStartRef.current = { id, startY: e.touches[0].clientY };
    setActivePopups(prev => prev.map(p => p.notification.id === id ? { ...p, isDragging: true } : p));
  };

  const handleTouchMove = (e: React.TouchEvent, id: string) => {
    if (!dragStartRef.current || dragStartRef.current.id !== id) return;
    const diff = e.touches[0].clientY - dragStartRef.current.startY;
    if (diff < 0) {
      const translateY = Math.max(diff, -150);
      const opacity = Math.max(1 + diff / 150, 0);
      const scale = Math.max(1 + diff / 500, 0.85);
      setActivePopups(prev => prev.map(p => p.notification.id === id ? { ...p, translateY, opacity, scale } : p));
    }
  };

  const handleTouchEnd = (id: string) => {
    const popup = activePopups.find(p => p.notification.id === id);
    if (!popup) return;
    setActivePopups(prev => prev.map(p => p.notification.id === id ? { ...p, isDragging: false } : p));

    if (popup.translateY < -60) {
      handleRemove(id);
    } else {
      setActivePopups(prev => prev.map(p => p.notification.id === id ? { ...p, translateY: 0, opacity: 1, scale: 1 } : p));
    }
    dragStartRef.current = null;
  };

  const getIcon = (type: AppNotification['type']) => {
    const iconClasses = "h-6 w-6";
    switch (type) {
      case 'new_product':
        return <Package className={`${iconClasses} text-primary`} />;
      case 'price_update':
        return <TrendingDown className={`${iconClasses} text-emerald-500`} />;
      case 'app_update':
        return <Smartphone className={`${iconClasses} text-blue-500`} />;
      case 'order_update':
        return <ShoppingBag className={`${iconClasses} text-orange-500`} />;
      case 'promo_code':
        return <Tag className={`${iconClasses} text-emerald-500`} />;
      case 'event':
        return <Calendar className={`${iconClasses} text-violet-500`} />;
      default:
        return <Bell className={iconClasses} />;
    }
  };

  const getTypeGradient = (type: AppNotification['type']) => {
    switch (type) {
      case 'new_product': return 'from-primary/20 via-primary/10 to-transparent';
      case 'price_update': return 'from-emerald-500/20 via-emerald-500/10 to-transparent';
      case 'app_update': return 'from-blue-500/20 via-blue-500/10 to-transparent';
      case 'order_update': return 'from-orange-500/20 via-orange-500/10 to-transparent';
      case 'promo_code': return 'from-emerald-500/20 via-emerald-500/10 to-transparent';
      case 'event': return 'from-violet-500/20 via-violet-500/10 to-transparent';
      default: return 'from-muted/30 via-muted/10 to-transparent';
    }
  };

  // Guest sign-in prompt
  if (showGuestPrompt) {
    return (
      <>
        <div 
          className="fixed top-0 left-0 right-0 z-[100] px-4 pointer-events-none flex justify-center" 
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <div className="relative max-w-md w-full pointer-events-auto animate-in slide-in-from-top-4 fade-in duration-500">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl opacity-50" />
            
            <div className="relative bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
              {/* Gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary" />
              
              {/* Drag indicator */}
              <div className="flex justify-center py-3">
                <div className="w-12 h-1 bg-muted-foreground/20 rounded-full" />
              </div>
              
              <div className="px-5 pb-5">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <Bell className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-foreground mb-1">
                      {isArabic ? 'تفعيل الإشعارات' : 'Enable Notifications'}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {isArabic 
                        ? 'سجل دخولك للحصول على إشعارات العروض والتحديثات'
                        : 'Sign in to get alerts for deals and price drops'}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 h-10 rounded-xl border-border/50" 
                    onClick={() => setShowGuestPrompt(false)}
                  >
                    {isArabic ? 'لاحقاً' : 'Maybe later'}
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 h-10 rounded-xl gap-2 font-medium" 
                    onClick={() => { setShowGuestPrompt(false); setShowAuthModal(true); }}
                  >
                    <LogIn className="h-4 w-4" />
                    {isArabic ? 'تسجيل الدخول' : 'Sign In'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </>
    );
  }

  if (activePopups.length === 0) return <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[100] px-4 pointer-events-none flex justify-center" 
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
    >
      {activePopups.map(popup => {
        const title = isArabic && popup.notification.titleAr ? popup.notification.titleAr : popup.notification.title;
        const message = isArabic && popup.notification.messageAr ? popup.notification.messageAr : popup.notification.message;
        
        return (
          <div
            key={popup.notification.id}
            className={`relative max-w-md w-full pointer-events-auto ${popup.isDragging ? '' : 'transition-all duration-300 ease-out'}`}
            style={{ 
              transform: `translateY(${popup.translateY}px) scale(${popup.scale})`, 
              opacity: popup.opacity 
            }}
            onTouchStart={e => handleTouchStart(e, popup.notification.id)}
            onTouchMove={e => handleTouchMove(e, popup.notification.id)}
            onTouchEnd={() => handleTouchEnd(popup.notification.id)}
          >
            {/* Glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-b ${getTypeGradient(popup.notification.type)} rounded-2xl blur-xl opacity-60`} />
            
            <div className="relative bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
              {/* Type-based gradient accent */}
              <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b ${getTypeGradient(popup.notification.type)} pointer-events-none`} />
              
              {/* Close button */}
              <button
                onClick={() => handleRemove(popup.notification.id)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10"
              >
                <X className="h-4 w-4" />
              </button>
              
              {/* Drag indicator */}
              <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1 bg-muted-foreground/20 rounded-full" />
              </div>
              
              <div className="relative px-5 pb-5">
                <div className="flex gap-4">
                  {/* Icon with subtle animation */}
                  <div className="flex-shrink-0 relative">
                    <div className="p-3 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm animate-in zoom-in-50 duration-300">
                      {getIcon(popup.notification.type)}
                    </div>
                    <div className="absolute -top-1 -right-1">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-1">
                    <h4 className="text-base font-semibold text-foreground mb-1 line-clamp-1">
                      {title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {message}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button 
                    size="sm" 
                    className="w-full h-10 rounded-xl gap-2 font-medium" 
                    onClick={() => handleMarkAsRead(popup.notification.id)}
                  >
                    <Check className="h-4 w-4" />
                    {isArabic ? 'حسناً' : 'Got it'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}
