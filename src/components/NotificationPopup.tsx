import { useEffect, useState } from 'react';
import { X, Check, Package, TrendingDown, Smartphone, ShoppingBag, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications, AppNotification } from '@/contexts/NotificationContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface PopupNotification {
  notification: AppNotification;
  translateY: number;
}

export function NotificationPopup() {
  const { language } = useLanguage();
  const { notifications, markAsRead, dismissNotification } = useNotifications();
  const [activePopups, setActivePopups] = useState<PopupNotification[]>([]);
  const [shownIds, setShownIds] = useState<Set<string>>(new Set());

  const isArabic = language === 'ar';

  // Show popup for new unread notifications - persist until dismissed
  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.isRead && !shownIds.has(n.id));
    
    if (unreadNotifications.length > 0) {
      const newPopups: PopupNotification[] = unreadNotifications.map(n => ({
        notification: n,
        translateY: 0
      }));
      
      setActivePopups(prev => [...newPopups, ...prev].slice(0, 5)); // Max 5 stacked
      setShownIds(prev => {
        const updated = new Set(prev);
        unreadNotifications.forEach(n => updated.add(n.id));
        return updated;
      });
    }
  }, [notifications, shownIds]);

  const handleDismiss = (id: string) => {
    setActivePopups(prev => 
      prev.map(p => p.notification.id === id ? { ...p, translateY: -100 } : p)
    );
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
      default:
        return <Bell className="h-6 w-6" />;
    }
  };

  if (activePopups.length === 0) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[100] px-4 pt-4 pointer-events-none flex flex-col gap-2"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
    >
      {activePopups.map((popup) => {
        const title = isArabic && popup.notification.titleAr ? popup.notification.titleAr : popup.notification.title;
        const message = isArabic && popup.notification.messageAr ? popup.notification.messageAr : popup.notification.message;

        return (
          <div
            key={popup.notification.id}
            className="max-w-md mx-auto w-full bg-card border border-border rounded-xl shadow-lg pointer-events-auto transition-all duration-300 ease-out"
            style={{ 
              transform: `translateY(${popup.translateY}%)`,
              opacity: popup.translateY < 0 ? 0 : 1
            }}
          >
            {/* Swipe indicator */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            <div className="px-4 pb-4">
              <div className="flex gap-3">
                {/* Icon */}
                <div className="flex-shrink-0">
                  {getIcon(popup.notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground">
                    {title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {message}
                  </p>
                </div>

                {/* Close button */}
                <button
                  onClick={() => handleDismiss(popup.notification.id)}
                  className="flex-shrink-0 p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 h-9"
                  onClick={() => handleMarkAsRead(popup.notification.id)}
                >
                  <Check className="h-4 w-4 mr-1.5" />
                  {isArabic ? 'موافق' : 'OK'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => handleRemove(popup.notification.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
