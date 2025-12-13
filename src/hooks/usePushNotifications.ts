import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
        
        // Check existing subscription
        const registration = await navigator.serviceWorker.ready;
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          setSubscription(existingSub);
          setIsSubscribed(true);
        }
      }
    };
    
    const fetchVapidKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-vapid-key');
        if (!error && data?.publicKey) {
          setVapidKey(data.publicKey);
        }
      } catch (error) {
        console.error('Error fetching VAPID key:', error);
      }
    };
    
    checkSupport();
    fetchVapidKey();
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported) return { success: false, error: 'Push notifications not supported' };
    if (!vapidKey) return { success: false, error: 'VAPID key not available' };
    try {
      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult !== 'granted') {
        return { success: false, error: 'Permission denied' };
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });
      
      setSubscription(sub);
      setIsSubscribed(true);
      
      // Save subscription to database
      const subJson = sub.toJSON();
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user?.id || null,
          endpoint: sub.endpoint,
          p256dh: subJson.keys?.p256dh || '',
          auth: subJson.keys?.auth || ''
        }, {
          onConflict: 'endpoint'
        });
      
      if (error) {
        console.error('Error saving subscription:', error);
        return { success: false, error: 'Failed to save subscription' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return { success: false, error: 'Failed to subscribe' };
    }
  }, [isSupported, user?.id, vapidKey]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return { success: false, error: 'Not subscribed' };
    
    try {
      await subscription.unsubscribe();
      
      // Remove from database
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', subscription.endpoint);
      
      setSubscription(null);
      setIsSubscribed(false);
      
      return { success: true };
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return { success: false, error: 'Failed to unsubscribe' };
    }
  }, [subscription]);

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray.buffer;
}
