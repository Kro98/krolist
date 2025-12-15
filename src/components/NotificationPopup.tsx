import { useEffect, useState } from 'react';
import { X, Check, Package, TrendingDown, Smartphone, ShoppingBag, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications, AppNotification } from '@/contexts/NotificationContext';
import { useLanguage } from '@/contexts/LanguageContext';

export function NotificationPopup() {
  const { language } = useLanguage();
  const { notifications, markAsRead, dismissNotification } = useNotifications();
  const [currentPopup, setCurrentPopup] = useState<AppNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [translateY, setTranslateY] = useState(-100);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);

  const isArabic = language === 'ar';

  // Show popup for unread notifications
  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    const latestUnread = unreadNotifications[0];
    
    if (latestUnread && (!currentPopup || currentPopup.id !== latestUnread.id)) {
      // Check if this notification was shown recently (within last 5 seconds)
      const shownKey = `notification_shown_${latestUnread.id}`;
      const wasShown = sessionStorage.getItem(shownKey);
      
      if (!wasShown) {
        sessionStorage.setItem(shownKey, 'true');
        setCurrentPopup(latestUnread);
        setIsVisible(true);
        setTranslateY(0);

        // Auto-dismiss after 8 seconds
        const timer = setTimeout(() => {
          handleDismiss();
        }, 8000);

        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);

  const handleDismiss = () => {
    setTranslateY(-100);
    setTimeout(() => {
      setIsVisible(false);
      setCurrentPopup(null);
    }, 300);
  };

  const handleMarkAsRead = () => {
    if (currentPopup) {
      markAsRead(currentPopup.id);
      handleDismiss();
    }
  };

  const handleRemove = () => {
    if (currentPopup) {
      dismissNotification(currentPopup.id);
      handleDismiss();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientY - startY;
    if (diff < 0) {
      setTranslateY(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (translateY < -50) {
      handleDismiss();
    } else {
      setTranslateY(0);
    }
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

  if (!isVisible || !currentPopup) return null;

  const title = isArabic && currentPopup.titleAr ? currentPopup.titleAr : currentPopup.title;
  const message = isArabic && currentPopup.messageAr ? currentPopup.messageAr : currentPopup.message;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[100] px-4 pt-4 pointer-events-none"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
    >
      <div
        className={`max-w-md mx-auto bg-card border border-border rounded-xl shadow-lg pointer-events-auto transition-transform ${
          isDragging ? '' : 'duration-300 ease-out'
        }`}
        style={{ transform: `translateY(${translateY}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe indicator */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        <div className="px-4 pb-4">
          <div className="flex gap-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              {getIcon(currentPopup.type)}
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
              onClick={handleDismiss}
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
              onClick={handleMarkAsRead}
            >
              <Check className="h-4 w-4 mr-1.5" />
              {isArabic ? 'موافق' : 'OK'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
