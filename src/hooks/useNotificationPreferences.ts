import { useState, useEffect, useCallback } from 'react';

export interface NotificationPreferences {
  priceUpdates: boolean;
  promoAlerts: boolean;
  appUpdates: boolean;
  eventReminders: boolean;
  orderUpdates: boolean;
}

const NOTIFICATION_PREFS_KEY = 'krolist_notification_preferences';

const defaultPreferences: NotificationPreferences = {
  priceUpdates: true,
  promoAlerts: true,
  appUpdates: true,
  eventReminders: true,
  orderUpdates: true,
};

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY);
      if (stored) {
        return { ...defaultPreferences, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load notification preferences:', e);
    }
    return defaultPreferences;
  });

  const updatePreference = useCallback(<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save notification preferences:', e);
      }
      return updated;
    });
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    try {
      localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(defaultPreferences));
    } catch (e) {
      console.error('Failed to reset notification preferences:', e);
    }
  }, []);

  return {
    preferences,
    updatePreference,
    resetPreferences,
  };
}

// Helper to check if a notification type is enabled
export function getNotificationPreferences(): NotificationPreferences {
  try {
    const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load notification preferences:', e);
  }
  return defaultPreferences;
}
