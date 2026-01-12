import { useState } from 'react';
import { Bell, Package, TrendingDown, Smartphone, ShoppingBag, Trash2, Tag, Calendar, Sparkles, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, AppNotification } from '@/contexts/NotificationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationItem } from './NotificationItem';
import { AuthModal } from '@/components/AuthModal';

export function NotificationCenter() {
  const { language, t } = useLanguage();
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
    const iconClasses = "h-5 w-5";
    switch (type) {
      case 'new_product':
        return <Package className={`${iconClasses} text-primary`} />;
      case 'price_update':
        return <TrendingDown className={`${iconClasses} text-success`} />;
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

  const getTypeColor = (type: AppNotification['type']) => {
    switch (type) {
      case 'new_product': return 'from-primary/20 to-primary/5';
      case 'price_update': return 'from-emerald-500/20 to-emerald-500/5';
      case 'app_update': return 'from-blue-500/20 to-blue-500/5';
      case 'order_update': return 'from-orange-500/20 to-orange-500/5';
      case 'promo_code': return 'from-emerald-500/20 to-emerald-500/5';
      case 'event': return 'from-violet-500/20 to-violet-500/5';
      default: return 'from-muted/50 to-muted/20';
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="relative group overflow-hidden"
        onClick={handleBellClick}
      >
        <Bell className="h-5 w-5 transition-transform group-hover:scale-110" />
        {(unreadCount > 0 || hasNewGlobalNotification) && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
          </span>
        )}
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-2 -right-2 h-5 min-w-5 p-0 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground border-2 border-background shadow-sm"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden border-0 shadow-2xl">
          {/* Header with gradient */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background p-5 pb-4">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center text-[9px] font-bold bg-primary text-primary-foreground rounded-full">
                      {unreadCount}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {t('notifications.title')}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {notifications.length === 0 
                      ? t('notifications.noNotifications')
                      : `${notifications.length} ${notifications.length === 1 ? t('notifications.notification') : t('notifications.notifications')}`
                    }
                  </p>
                </div>
              </div>
              
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="h-9 px-3 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 rounded-lg"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('notifications.clear')}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Notifications list */}
          <ScrollArea className="flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="relative mb-6">
                  <div className="p-5 rounded-2xl bg-muted/50 border border-border">
                    <BellOff className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <div className="absolute -top-1 -right-1 p-1.5 rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary/60" />
                  </div>
                </div>
                <h3 className="text-base font-medium text-foreground mb-1">
                  {t('notifications.allCaughtUp')}
                </h3>
                <p className="text-sm text-muted-foreground max-w-[200px]">
                  {t('notifications.priceDropsWillAppear')}
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {notifications.map((notification, index) => (
                  <div 
                    key={notification.id}
                    className="animate-in fade-in slide-in-from-top-2 duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <NotificationItem
                      notification={notification}
                      icon={getNotificationIcon(notification.type)}
                      gradientClass={getTypeColor(notification.type)}
                    />
                  </div>
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
