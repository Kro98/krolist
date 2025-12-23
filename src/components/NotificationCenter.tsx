import { useState } from 'react';
import { Bell, Package, TrendingDown, Smartphone, ShoppingBag, Trash2, Tag, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, AppNotification } from '@/contexts/NotificationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationItem } from './NotificationItem';
import { AuthModal } from '@/components/AuthModal';

export function NotificationCenter() {
  const { language } = useLanguage();
  const { user, isGuest } = useAuth();
  const { notifications, unreadCount, clearAll, hasNewGlobalNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isArabic = language === 'ar';

  const handleBellClick = () => {
    if (!user || isGuest) {
      setShowAuthModal(true);
    } else {
      setOpen(true);
    }
  };

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'new_product':
        return <Package className="h-5 w-5 text-primary" />;
      case 'price_update':
        return <TrendingDown className="h-5 w-5 text-success" />;
      case 'app_update':
        return <Smartphone className="h-5 w-5 text-blue-500" />;
      case 'order_update':
        return <ShoppingBag className="h-5 w-5 text-orange-500" />;
      case 'promo_code':
        return <Tag className="h-5 w-5 text-green-500" />;
      case 'event':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="relative"
        onClick={handleBellClick}
      >
        <Bell className="h-5 w-5" />
        {(unreadCount > 0 || hasNewGlobalNotification) && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
          </span>
        )}
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {isArabic ? 'الإشعارات' : 'Notifications'}
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount} {isArabic ? 'جديد' : 'new'}
                  </Badge>
                )}
              </DialogTitle>
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  {isArabic ? 'مسح الكل' : 'Clear all'}
                </Button>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-4 py-2">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  {isArabic ? 'لا توجد إشعارات' : 'No notifications yet'}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {isArabic 
                    ? 'ستظهر هنا تحديثات الأسعار والمنتجات الجديدة' 
                    : 'Price updates and new products will appear here'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    icon={getNotificationIcon(notification.type)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}
