import { useState, useRef } from 'react';
import { Check, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications, AppNotification } from '@/contexts/NotificationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface NotificationItemProps {
  notification: AppNotification;
  icon: React.ReactNode;
  gradientClass?: string;
}

export function NotificationItem({ notification, icon, gradientClass = 'from-muted/50 to-muted/20' }: NotificationItemProps) {
  const { language } = useLanguage();
  const { markAsRead, dismissNotification } = useNotifications();
  const [isDragging, setIsDragging] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const startXRef = useRef(0);

  const isArabic = language === 'ar';
  const title = isArabic && notification.titleAr ? notification.titleAr : notification.title;
  const message = isArabic && notification.messageAr ? notification.messageAr : notification.message;

  const timeAgo = formatDistanceToNow(notification.createdAt, {
    addSuffix: true,
    locale: isArabic ? ar : undefined
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startXRef.current;
    setTranslateX(Math.max(-120, Math.min(120, diff)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(translateX) > 80) {
      setIsExiting(true);
      setTranslateX(translateX > 0 ? 400 : -400);
      setTimeout(() => dismissNotification(notification.id), 250);
    } else {
      setTranslateX(0);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(notification.id);
    setShowActions(false);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExiting(true);
    setTimeout(() => dismissNotification(notification.id), 250);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl transition-all duration-300 ease-out ${
        isExiting ? 'h-0 opacity-0 scale-95 mb-0' : 'h-auto opacity-100 scale-100'
      }`}
    >
      {/* Swipe action indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        <div className={`flex items-center gap-2 text-destructive transition-opacity ${translateX > 40 ? 'opacity-100' : 'opacity-0'}`}>
          <X className="h-5 w-5" />
          <span className="text-xs font-medium">{isArabic ? 'حذف' : 'Delete'}</span>
        </div>
        <div className={`flex items-center gap-2 text-destructive transition-opacity ${translateX < -40 ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-xs font-medium">{isArabic ? 'حذف' : 'Delete'}</span>
          <X className="h-5 w-5" />
        </div>
      </div>

      {/* Main content */}
      <div
        className={`relative bg-gradient-to-r ${gradientClass} border rounded-xl p-3.5 cursor-pointer select-none touch-pan-y ${
          notification.isRead 
            ? 'border-border/50 opacity-70' 
            : 'border-border shadow-sm'
        } ${!isDragging ? 'transition-transform duration-200' : ''}`}
        style={{ transform: `translateX(${translateX}px)` }}
        onClick={() => !notification.isRead && setShowActions(!showActions)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex gap-3">
          {/* Icon container */}
          <div className={`relative flex-shrink-0 p-2.5 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm ${
            !notification.isRead ? 'ring-2 ring-primary/20' : ''
          }`}>
            {icon}
            {!notification.isRead && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-background animate-pulse" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 py-0.5">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className={`text-sm font-semibold leading-tight line-clamp-1 ${
                notification.isRead ? 'text-muted-foreground' : 'text-foreground'
              }`}>
                {title}
              </h4>
              {!notification.isRead && (
                <ChevronRight className={`h-4 w-4 text-muted-foreground/50 flex-shrink-0 transition-transform ${
                  showActions ? 'rotate-90' : ''
                }`} />
              )}
            </div>
            
            <p className={`text-xs leading-relaxed line-clamp-2 mb-2 ${
              notification.isRead ? 'text-muted-foreground/60' : 'text-muted-foreground'
            }`}>
              {message}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wide">
                {timeAgo}
              </span>
              
              {notification.isRead && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                  <Check className="h-3 w-3" />
                  {isArabic ? 'مقروء' : 'Read'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expandable actions */}
        {!notification.isRead && showActions && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-border/50 animate-in fade-in slide-in-from-top-1 duration-200">
            <Button
              variant="default"
              size="sm"
              className="flex-1 h-8 text-xs font-medium gap-1.5 rounded-lg"
              onClick={handleMarkAsRead}
            >
              <Check className="h-3.5 w-3.5" />
              {isArabic ? 'تم' : 'Mark as read'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
              onClick={handleDismiss}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
