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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'krolist_notifications';
const SEEN_GLOBAL_KEY = 'krolist_seen_global_notifications';
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
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [seenGlobalIds, setSeenGlobalIds] = useState<Set<string>>(new Set());
  const [hasNewGlobalNotification, setHasNewGlobalNotification] = useState(false);

  // Load notifications and seen IDs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt)
        })));
      } catch (e) {
        console.error('Failed to parse notifications:', e);
      }
    }

    const seenGlobal = localStorage.getItem(SEEN_GLOBAL_KEY);
    if (seenGlobal) {
      try {
        setSeenGlobalIds(new Set(JSON.parse(seenGlobal)));
      } catch (e) {
        console.error('Failed to parse seen global IDs:', e);
      }
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // Save seen global IDs to localStorage
  useEffect(() => {
    localStorage.setItem(SEEN_GLOBAL_KEY, JSON.stringify([...seenGlobalIds]));
  }, [seenGlobalIds]);

  // Fetch global notifications
  useEffect(() => {
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
            type: n.type as AppNotification['type'],
            title: n.title,
            titleAr: n.title_ar,
            message: n.message,
            messageAr: n.message_ar,
            isRead: seenGlobalIds.has(n.id),
            createdAt: new Date(n.created_at),
            data: n.data,
            isGlobal: true
          }));

          // Check if there are new unseen notifications
          const hasNew = deduplicatedData.some((n: any) => !seenGlobalIds.has(n.id));
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
  }, [seenGlobalIds]);

  // Check for today's events and add notifications
  useEffect(() => {
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
  }, []);

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

  const markAsRead = useCallback((id: string) => {
    // If it's a global notification, track it in seenGlobalIds
    if (id.startsWith('global_')) {
      const globalId = id.replace('global_', '');
      setSeenGlobalIds(prev => new Set([...prev, globalId]));
    }
    
    // If it's an event notification, mark it as seen
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
  }, []);

  const markAllAsRead = useCallback(() => {
    // Mark all global notifications as seen
    const globalIds = notifications
      .filter(n => n.isGlobal)
      .map(n => n.id.replace('global_', ''));
    setSeenGlobalIds(prev => new Set([...prev, ...globalIds]));
    
    // Mark all event notifications as seen
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
  }, [notifications]);

  const dismissNotification = useCallback((id: string) => {
    // If it's a global notification, track it in seenGlobalIds
    if (id.startsWith('global_')) {
      const globalId = id.replace('global_', '');
      setSeenGlobalIds(prev => new Set([...prev, globalId]));
    }
    
    // If it's an event notification, mark it as seen
    if (id.startsWith('event_')) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const seenEventsStr = localStorage.getItem(SEEN_EVENTS_KEY);
      const seenEvents: Record<string, string> = seenEventsStr ? JSON.parse(seenEventsStr) : {};
      const eventKey = id.replace('event_', '').replace(`_${todayStr}`, '');
      seenEvents[`${eventKey}_${todayStr}`] = todayStr;
      localStorage.setItem(SEEN_EVENTS_KEY, JSON.stringify(seenEvents));
    }
    
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    // Mark all global notifications as seen before clearing
    const globalIds = notifications
      .filter(n => n.isGlobal)
      .map(n => n.id.replace('global_', ''));
    setSeenGlobalIds(prev => new Set([...prev, ...globalIds]));
    
    // Mark all event notifications as seen
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const seenEventsStr = localStorage.getItem(SEEN_EVENTS_KEY);
    const seenEvents: Record<string, string> = seenEventsStr ? JSON.parse(seenEventsStr) : {};
    
    notifications.forEach(n => {
      if (n.id.startsWith('event_')) {
        const eventKey = n.id.replace('event_', '').replace(`_${todayStr}`, '');
        seenEvents[`${eventKey}_${todayStr}`] = todayStr;
      }
    });
    localStorage.setItem(SEEN_EVENTS_KEY, JSON.stringify(seenEvents));
    
    setNotifications([]);
    setHasNewGlobalNotification(false);
  }, [notifications]);

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
      hasNewGlobalNotification
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
