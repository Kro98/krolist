import { useEffect, useState, useRef } from 'react';
import { Check, Package, TrendingDown, Smartphone, ShoppingBag, Bell, Tag, Calendar, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications, AppNotification } from '@/contexts/NotificationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface PopupNotification {
  notification: AppNotification;
  translateY: number;
  opacity: number;
  isEntering: boolean;
  isDragging: boolean;
}

export function NotificationPopup() {
  const { language } = useLanguage();
  const { notifications, markAsRead, dismissNotification, isGuest } = useNotifications();
  const navigate = useNavigate();
  const [activePopups, setActivePopups] = useState<PopupNotification[]>([]);
  const [shownIds, setShownIds] = useState<Set<string>>(new Set());
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const dragStartRef = useRef<{ id: string; startY: number } | null>(null);
  const isArabic = language === 'ar';

  // Show guest sign-in prompt once per session
  useEffect(() => {
    if (isGuest && notifications.length > 0 && !sessionStorage.getItem('guest_notification_prompt_shown')) {
      setShowGuestPrompt(true);
      sessionStorage.setItem('guest_notification_prompt_shown', 'true');
    }
  }, [isGuest, notifications.length]);

  // Show only ONE popup at a time for new unread notifications (only for authenticated users)
  useEffect(() => {
    if (isGuest) return; // Don't show notification popups to guests
    if (activePopups.length > 0) return;
    
    const unreadNotifications = notifications.filter(n => !n.isRead && !shownIds.has(n.id));
    if (unreadNotifications.length > 0) {
      const nextNotification = unreadNotifications[0];
      const newPopup: PopupNotification = {
        notification: nextNotification,
        translateY: -100,
        opacity: 0,
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
      opacity: 0
    } : p));
    setTimeout(() => {
      setActivePopups(prev => prev.filter(p => p.notification.id !== id));
    }, 300);
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    handleDismiss(id);
  };

  const handleRemove = (id: string) => {
    dismissNotification(id);
    handleDismiss(id);
  };

  const handleSignIn = () => {
    setShowGuestPrompt(false);
    navigate('/auth');
  };

  const handleDismissGuestPrompt = () => {
    setShowGuestPrompt(false);
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
      setActivePopups(prev => prev.map(p => p.notification.id === id ? { ...p, translateY, opacity } : p));
    }
  };

  const handleTouchEnd = (id: string) => {
    const popup = activePopups.find(p => p.notification.id === id);
    if (!popup) return;
    setActivePopups(prev => prev.map(p => p.notification.id === id ? { ...p, isDragging: false } : p));

    if (popup.translateY < -60) {
      handleRemove(id);
    } else {
      setActivePopups(prev => prev.map(p => p.notification.id === id ? { ...p, translateY: 0, opacity: 1 } : p));
    }
    dragStartRef.current = null;
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'new_product':
        return <Package className="h-6 w-6 text-primary" />;
      case 'price_update':
        return <TrendingDown className="h-6 w-6 text-success" />;
      case 'app_update':
        return <Smartphone className="h-6 w-6 text-blue-500" />;
      case 'order_update':
        return <ShoppingBag className="h-6 w-6 text-orange-500" />;
      case 'promo_code':
        return <Tag className="h-6 w-6 text-green-500" />;
      case 'event':
        return <Calendar className="h-6 w-6 text-purple-500" />;
      default:
        return <Bell className="h-6 w-6" />;
    }
  };

  // Show guest sign-in prompt
  if (showGuestPrompt) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] px-4 pt-4 pointer-events-none flex flex-col gap-2" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        <div className="max-w-md mx-auto w-full bg-card border border-border rounded-xl shadow-lg pointer-events-auto animate-in slide-in-from-top duration-300">
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
          <div className="px-4 pb-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground">
                  {isArabic ? 'تفعيل الإشعارات' : 'Enable Notifications'}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isArabic 
                    ? 'سجل دخولك للحصول على إشعارات حول العروض والتحديثات على جميع أجهزتك'
                    : 'Sign in to receive notifications about deals and updates across all your devices'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1 h-9" onClick={handleDismissGuestPrompt}>
                {isArabic ? 'لاحقاً' : 'Later'}
              </Button>
              <Button variant="default" size="sm" className="flex-1 h-9" onClick={handleSignIn}>
                <LogIn className="h-4 w-4 mr-1.5" />
                {isArabic ? 'تسجيل الدخول' : 'Sign In'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activePopups.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] px-4 pt-4 pointer-events-none flex flex-col gap-2" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      {activePopups.map(popup => {
        const title = isArabic && popup.notification.titleAr ? popup.notification.titleAr : popup.notification.title;
        const message = isArabic && popup.notification.messageAr ? popup.notification.messageAr : popup.notification.message;
        return (
          <div
            key={popup.notification.id}
            className={`max-w-md mx-auto w-full bg-card border border-border rounded-xl shadow-lg pointer-events-auto ${popup.isDragging ? '' : 'transition-all duration-300 ease-out'}`}
            style={{ transform: `translateY(${popup.translateY}px)`, opacity: popup.opacity }}
            onTouchStart={e => handleTouchStart(e, popup.notification.id)}
            onTouchMove={e => handleTouchMove(e, popup.notification.id)}
            onTouchEnd={() => handleTouchEnd(popup.notification.id)}
          >
            <div className="flex justify-center py-2 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>
            <div className="px-4 pb-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 animate-scale-in">
                  {getIcon(popup.notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{message}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="default" size="sm" className="flex-1 h-9" onClick={() => handleMarkAsRead(popup.notification.id)}>
                  <Check className="h-4 w-4 mr-1.5" />
                  {isArabic ? 'موافق' : 'OK'}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}