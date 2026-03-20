import { useState, useEffect, useCallback } from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";

interface Notification {
  id: string;
  title: string;
  title_ar: string | null;
  message: string;
  message_ar: string | null;
  type: string;
  created_at: string;
}

const STORAGE_KEY_READ = "krolist_notif_read";
const STORAGE_KEY_CLEARED = "krolist_notif_cleared";

function getReadIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY_READ) || "[]"));
  } catch {
    return new Set();
  }
}

function getClearedIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY_CLEARED) || "[]"));
  } catch {
    return new Set();
  }
}

function persistReadIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY_READ, JSON.stringify([...ids]));
}

function persistClearedIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY_CLEARED, JSON.stringify([...ids]));
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(getReadIds);
  const [clearedIds, setClearedIds] = useState<Set<string>>(getClearedIds);

  useEffect(() => {
    supabase
      .from("global_notifications")
      .select("id, title, title_ar, message, message_ar, type, created_at")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setNotifications(data);
      });
  }, []);

  const visibleNotifications = notifications.filter(
    (n) => !clearedIds.has(n.id)
  );
  const unreadCount = visibleNotifications.filter(
    (n) => !readIds.has(n.id)
  ).length;

  const markAllRead = useCallback(() => {
    const next = new Set(readIds);
    visibleNotifications.forEach((n) => next.add(n.id));
    setReadIds(next);
    persistReadIds(next);
  }, [readIds, visibleNotifications]);

  const clearAll = useCallback(() => {
    const next = new Set(clearedIds);
    visibleNotifications.forEach((n) => next.add(n.id));
    setClearedIds(next);
    persistClearedIds(next);
  }, [clearedIds, visibleNotifications]);

  // Mark as read when panel opens
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      const timer = setTimeout(markAllRead, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, unreadCount, markAllRead]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "price_update":
        return "💰";
      case "new_product":
        return "🆕";
      case "announcement":
        return "📢";
      default:
        return "🔔";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Top Sheet */}
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className={cn(
              "fixed top-0 inset-x-0 z-[61] max-h-[85vh] overflow-hidden",
              "bg-background border-b border-border rounded-b-3xl shadow-2xl"
            )}
            dir={isArabic ? "rtl" : "ltr"}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-lg font-bold text-foreground">
                {isArabic ? "الإشعارات" : "Notifications"}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/60 hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Actions */}
            {visibleNotifications.length > 0 && (
              <div className="flex items-center gap-2 px-5 pb-3">
                <button
                  onClick={markAllRead}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  <Check className="w-3.5 h-3.5" />
                  {isArabic ? "قراءة الكل" : "Mark all read"}
                </button>
                <button
                  onClick={clearAll}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isArabic ? "مسح الكل" : "Clear all"}
                </button>
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(85vh-8rem)] px-5 pb-6 space-y-2">
              {visibleNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                    <Bell className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isArabic
                      ? "لا توجد إشعارات حالياً"
                      : "No notifications yet"}
                  </p>
                </div>
              ) : (
                visibleNotifications.map((notif) => {
                  const isRead = readIds.has(notif.id);
                  return (
                    <motion.div
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "relative p-3.5 rounded-xl border transition-colors",
                        isRead
                          ? "bg-muted/30 border-border/50"
                          : "bg-primary/5 border-primary/20"
                      )}
                    >
                      {!isRead && (
                        <span className="absolute top-3 end-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5 shrink-0">
                          {getTypeIcon(notif.type)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground leading-snug">
                            {isArabic
                              ? notif.title_ar || notif.title
                              : notif.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {isArabic
                              ? notif.message_ar || notif.message
                              : notif.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                            {format(
                              new Date(notif.created_at),
                              "MMM d, yyyy · h:mm a"
                            )}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Bottom handle */}
            <div className="flex justify-center pb-3">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Standalone bell button for the header */
export function NotificationBell({
  onClick,
  unreadCount,
}: {
  onClick: () => void;
  unreadCount: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-10 h-10 rounded-xl flex items-center justify-center",
        "bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      )}
      aria-label="Notifications"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1">
          <span className="text-[10px] font-bold text-destructive-foreground leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        </span>
      )}
    </button>
  );
}

/** Hook to get unread count for external use */
export function useNotificationCount(
  notifications: Notification[]
): number {
  const readIds = getReadIds();
  const clearedIds = getClearedIds();
  return notifications.filter(
    (n) => !clearedIds.has(n.id) && !readIds.has(n.id)
  ).length;
}
