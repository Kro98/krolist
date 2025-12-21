// Notification Context - manages app notifications
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { format, isSameDay } from 'date-fns';

export interface AppNotification {
  id: string;
  type: 'new_product' | 'price_update' | 'app_update' | 'order_update' | 'promo_code' | 'event';
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  isRead: boolean;
  createdAt: Date;
  data?: Record<string, any>;
  isGlobal?: boolean;
  globalId?: string; // Store the actual global notification ID for DB sync
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
  hasNewGlobalNotification: boolean;
  isGuest: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const SEEN_EVENTS_KEY = 'krolist_seen_events';

// Default events that should trigger notifications today
const DEFAULT_EVENTS = [
  { id: "amazon-prime-day", name: "Amazon Prime Day", date: "2025-07-15", emoji: "📦" },
  { id: "black-friday", name: "Black Friday", date: "2025-11-28", emoji: "🛍️" },
  { id: "cyber-monday", name: "Cyber Monday", date: "2025-12-01", emoji: "💻" },
  { id: "singles-day", name: "Single's Day", date: "2025-11-11", emoji: "🎊" },
  { id: "boxing-day", name: "Boxing Day", date: "2025-12-26", emoji: "🎁" },
  { id: "saudi-national-day", name: "Saudi National Day", date: "2025-09-23", emoji: "🇸🇦" },
  { id: "uae-national-day", name: "UAE National Day", date: "2025-12-02", emoji: "🇦🇪" },
  { id: "christmas-sales", name: "Christmas Sales", date: "2025-12-25", emoji: "🎄" },
  { id: "valentines-day", name: "Valentine's Day Sales", date: "2025-02-14", emoji: "💝" },
  { id: "fathers-day", name: "Father's Day Sales", date: "2025-06-15", emoji: "👨‍👧‍👦" },
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isGuest } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const [hasNewGlobalNotification, setHasNewGlobalNotification] = useState(false);
  const [isLoadingReads, setIsLoadingReads] = useState(true);

  // Fetch user's read notifications from database
  useEffect(() => {
    const fetchReadNotifications = async () => {
      if (!user) {
        setReadNotificationIds(new Set());
        setIsLoadingReads(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_notification_reads')
          .select('notification_id')
          .eq('user_id', user.id);

        if (error) throw error;

        const readIds = new Set(data?.map(r => r.notification_id) || []);
        setReadNotificationIds(readIds);
      } catch (error) {
        console.error('Failed to fetch read notifications:', error);
      } finally {
        setIsLoadingReads(false);
      }
    };

    fetchReadNotifications();
  }, [user]);

  // Fetch global notifications
  useEffect(() => {
    if (isLoadingReads) return;

    const fetchGlobalNotifications = async () => {
      try {
        // Fetch notifications from the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data, error } = await supabase
          .from('global_notifications')
          .select('*')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          // Deduplicate by type - keep only the latest notification of each type
          const latestByType = new Map<string, any>();
          data.forEach((n: any) => {
            const existing = latestByType.get(n.type);
            if (!existing || new Date(n.created_at) > new Date(existing.created_at)) {
              latestByType.set(n.type, n);
            }
          });
          
          const deduplicatedData = Array.from(latestByType.values());
          
          const globalNotifications: AppNotification[] = deduplicatedData.map((n: any) => ({
            id: `global_${n.id}`,
            globalId: n.id,
            type: n.type as AppNotification['type'],
            title: n.title,
            titleAr: n.title_ar,
            message: n.message,
            messageAr: n.message_ar,
            isRead: readNotificationIds.has(n.id),
            createdAt: new Date(n.created_at),
            data: n.data,
            isGlobal: true
          }));

          // Check if there are new unseen notifications
          const hasNew = deduplicatedData.some((n: any) => !readNotificationIds.has(n.id));
          setHasNewGlobalNotification(hasNew);

          // Merge with existing notifications, avoiding duplicates
          setNotifications(prev => {
            const localNotifications = prev.filter(n => !n.isGlobal);
            
            return [...globalNotifications, ...localNotifications]
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
              .slice(0, 50);
          });
        }
      } catch (error) {
        console.error('Failed to fetch global notifications:', error);
      }
    };

    fetchGlobalNotifications();

    // Subscribe to real-time updates for global notifications
    const channel = supabase
      .channel('global-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'global_notifications'
        },
        (payload) => {
          const data = payload.new as any;
          const newNotification: AppNotification = {
            id: `global_${data.id}`,
            globalId: data.id,
            type: data.type as AppNotification['type'],
            title: data.title,
            titleAr: data.title_ar,
            message: data.message,
            messageAr: data.message_ar,
            isRead: false,
            createdAt: new Date(data.created_at),
            data: data.data,
            isGlobal: true
          };
          
          // Replace existing notification of same type with the new one
          setNotifications(prev => {
            const filtered = prev.filter(n => !(n.isGlobal && n.type === newNotification.type));
            return [newNotification, ...filtered].slice(0, 50);
          });
          setHasNewGlobalNotification(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [readNotificationIds, isLoadingReads]);

  // Check for today's events and add notifications (only for authenticated users)
  useEffect(() => {
    if (!user) return;

    const checkTodayEvents = () => {
      const today = new Date();
      const seenEventsStr = localStorage.getItem(SEEN_EVENTS_KEY);
      const seenEvents: Record<string, string> = seenEventsStr ? JSON.parse(seenEventsStr) : {};
      const todayStr = format(today, 'yyyy-MM-dd');

      DEFAULT_EVENTS.forEach(event => {
        const eventDate = new Date(event.date);
        if (isSameDay(today, eventDate)) {
          const eventKey = `${event.id}_${todayStr}`;
          
          // Only add if not already seen today
          if (!seenEvents[eventKey]) {
            const eventNotification: AppNotification = {
              id: `event_${event.id}_${todayStr}`,
              type: 'event',
              title: `${event.emoji} ${event.name} Today!`,
              titleAr: `${event.emoji} ${event.name} اليوم!`,
              message: `Don't miss the special deals for ${event.name}!`,
              messageAr: `لا تفوت العروض الخاصة لـ ${event.name}!`,
              isRead: false,
              createdAt: new Date(),
              data: { eventId: event.id }
            };

            setNotifications(prev => {
              // Check if event notification already exists
              const exists = prev.some(n => n.id === eventNotification.id);
              if (exists) return prev;
              return [eventNotification, ...prev].slice(0, 50);
            });
          }
        }
      });

      // Clean up old event entries (older than today)
      const cleanedSeenEvents: Record<string, string> = {};
      Object.entries(seenEvents).forEach(([key, date]) => {
        if (date === todayStr) {
          cleanedSeenEvents[key] = date;
        }
      });
      localStorage.setItem(SEEN_EVENTS_KEY, JSON.stringify(cleanedSeenEvents));
    };

    checkTodayEvents();
  }, [user]);

  // Listen for order notifications if user is logged in
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('order-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const data = payload.new as any;
          addNotification({
            type: 'order_update',
            title: 'Order Update',
            titleAr: 'تحديث الطلب',
            message: data.message_en,
            messageAr: data.message_ar,
            data: { orderId: data.order_id }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: crypto.randomUUID(),
      isRead: false,
      createdAt: new Date()
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
  }, []);

  // Mark as read - saves to database for authenticated users
  const markAsRead = useCallback(async (id: string) => {
    // If it's a global notification and user is logged in, save to database
    if (id.startsWith('global_') && user) {
      const globalId = id.replace('global_', '');
      
      try {
        await supabase
          .from('user_notification_reads')
          .insert({
            user_id: user.id,
            notification_id: globalId
          });
        
        setReadNotificationIds(prev => new Set([...prev, globalId]));
      } catch (error) {
        console.error('Failed to save read status:', error);
      }
    }
    
    // If it's an event notification, mark it as seen locally
    if (id.startsWith('event_')) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const seenEventsStr = localStorage.getItem(SEEN_EVENTS_KEY);
      const seenEvents: Record<string, string> = seenEventsStr ? JSON.parse(seenEventsStr) : {};
      const eventKey = id.replace('event_', '').replace(`_${todayStr}`, '');
      seenEvents[`${eventKey}_${todayStr}`] = todayStr;
      localStorage.setItem(SEEN_EVENTS_KEY, JSON.stringify(seenEvents));
    }

    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    setHasNewGlobalNotification(false);
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (user) {
      // Mark all global notifications as read in database
      const globalNotifications = notifications.filter(n => n.isGlobal && n.globalId && !readNotificationIds.has(n.globalId));
      
      if (globalNotifications.length > 0) {
        try {
          const inserts = globalNotifications.map(n => ({
            user_id: user.id,
            notification_id: n.globalId!
          }));
          
          await supabase
            .from('user_notification_reads')
            .insert(inserts);
          
          const newReadIds = new Set([...readNotificationIds, ...globalNotifications.map(n => n.globalId!)]);
          setReadNotificationIds(newReadIds);
        } catch (error) {
          console.error('Failed to mark all as read:', error);
        }
      }
    }
    
    // Mark all event notifications as seen locally
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const seenEventsStr = localStorage.getItem(SEEN_EVENTS_KEY);
    const seenEvents: Record<string, string> = seenEventsStr ? JSON.parse(seenEventsStr) : {};
    notifications
      .filter(n => n.id.startsWith('event_'))
      .forEach(n => {
        const eventKey = n.id.replace('event_', '').replace(`_${todayStr}`, '');
        seenEvents[`${eventKey}_${todayStr}`] = todayStr;
      });
    localStorage.setItem(SEEN_EVENTS_KEY, JSON.stringify(seenEvents));
    
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setHasNewGlobalNotification(false);
  }, [notifications, user, readNotificationIds]);

  const dismissNotification = useCallback(async (id: string) => {
    // Dismissing is the same as marking as read
    await markAsRead(id);
    
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, [markAsRead]);

  const clearAll = useCallback(async () => {
    // Mark all as read first
    await markAllAsRead();
    
    // Clear notifications from state
    setNotifications([]);
    setHasNewGlobalNotification(false);
  }, [markAllAsRead]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      dismissNotification,
      clearAll,
      hasNewGlobalNotification,
      isGuest: isGuest || !user
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
