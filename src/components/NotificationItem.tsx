import { useState, useRef } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications, AppNotification } from '@/contexts/NotificationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface NotificationItemProps {
  notification: AppNotification;
  icon: React.ReactNode;
}

export function NotificationItem({ notification, icon }: NotificationItemProps) {
  const { language } = useLanguage();
  const { markAsRead, dismissNotification } = useNotifications();
  const [isDragging, setIsDragging] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const startXRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    // Allow swipe in both directions
    setTranslateX(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const threshold = 100;
    
    if (Math.abs(translateX) > threshold) {
      // Animate out
      setIsExiting(true);
      setTranslateX(translateX > 0 ? 300 : -300);
      setTimeout(() => {
        dismissNotification(notification.id);
      }, 200);
    } else {
      // Snap back
      setTranslateX(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    setIsDragging(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const diff = e.clientX - startXRef.current;
      setTranslateX(diff);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      const threshold = 100;
      
      if (Math.abs(translateX) > threshold) {
        setIsExiting(true);
        setTranslateX(translateX > 0 ? 300 : -300);
        setTimeout(() => {
          dismissNotification(notification.id);
        }, 200);
      } else {
        setTranslateX(0);
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(notification.id);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExiting(true);
    setTranslateX(-300);
    setTimeout(() => {
      dismissNotification(notification.id);
    }, 200);
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg transition-all duration-200 ${
        isExiting ? 'h-0 opacity-0 mb-0' : 'h-auto opacity-100'
      }`}
    >
      {/* Swipe background indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-4 bg-muted/50">
        <Trash2 className={`h-5 w-5 text-muted-foreground transition-opacity ${translateX > 30 ? 'opacity-100' : 'opacity-0'}`} />
        <Trash2 className={`h-5 w-5 text-muted-foreground transition-opacity ${translateX < -30 ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {/* Notification content */}
      <div
        className={`relative flex gap-3 p-3 rounded-lg border cursor-grab active:cursor-grabbing select-none transition-transform ${
          notification.isRead 
            ? 'bg-muted/30 border-border' 
            : 'bg-card border-primary/20 shadow-sm'
        } ${!isDragging ? 'transition-transform duration-200' : ''}`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* Unread indicator */}
        {!notification.isRead && (
          <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
        )}

        {/* Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${!notification.isRead ? 'ml-3' : ''}`}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-medium truncate ${
              notification.isRead ? 'text-muted-foreground' : 'text-foreground'
            }`}>
              {title}
            </h4>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {timeAgo}
            </span>
          </div>
          <p className={`text-xs mt-0.5 line-clamp-2 ${
            notification.isRead ? 'text-muted-foreground/70' : 'text-muted-foreground'
          }`}>
            {message}
          </p>

          {/* Action buttons */}
          {!notification.isRead && (
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleMarkAsRead}
              >
                <Check className="h-3 w-3 mr-1" />
                {isArabic ? 'موافق' : 'OK'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={handleDismiss}
              >
                <X className="h-3 w-3 mr-1" />
                {isArabic ? 'إزالة' : 'Dismiss'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
