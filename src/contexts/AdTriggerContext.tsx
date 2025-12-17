import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AdTriggerContextType {
  showAd: () => void;
  triggerPageOpen: () => void;
  triggerAuthEvent: () => void;
  triggerFavoriteAdd: () => void;
  triggerRefresh: () => void;
  triggerPromoCopy: () => void;
  triggerShopOpen: () => void;
  triggerClick: () => void;
  triggerLoadScreen: () => void;
  isAdVisible: boolean;
  closeAd: () => void;
}

const AdTriggerContext = createContext<AdTriggerContextType | undefined>(undefined);

const STORAGE_KEYS = {
  FAVORITE_COUNT: 'ad_favorite_count',
  REFRESH_COUNT: 'ad_refresh_count',
  CLICK_COUNT: 'ad_click_count',
  LOAD_SCREEN_COUNT: 'ad_load_screen_count',
  LAST_AD_TIME: 'ad_last_shown_time',
};

const DEFAULT_COOLDOWN_MS = 30000; // 30 seconds default

export function AdTriggerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isAdVisible, setIsAdVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adsDisabledForAdmins, setAdsDisabledForAdmins] = useState(true);
  const [cooldownMs, setCooldownMs] = useState(DEFAULT_COOLDOWN_MS);
  const [favoriteCount, setFavoriteCount] = useState(() => {
    return parseInt(localStorage.getItem(STORAGE_KEYS.FAVORITE_COUNT) || '0', 10);
  });
  const [refreshCount, setRefreshCount] = useState(() => {
    return parseInt(localStorage.getItem(STORAGE_KEYS.REFRESH_COUNT) || '0', 10);
  });
  const [loadScreenCount, setLoadScreenCount] = useState(() => {
    return parseInt(localStorage.getItem(STORAGE_KEYS.LOAD_SCREEN_COUNT) || '0', 10);
  });

  // Fetch ad settings from database
  useEffect(() => {
    const fetchAdSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('ad_settings')
          .select('setting_key, setting_value');

        if (!error && data) {
          data.forEach((setting) => {
            if (setting.setting_key === 'ad_cooldown_seconds') {
              setCooldownMs(parseInt(setting.setting_value, 10) * 1000);
            } else if (setting.setting_key === 'ads_disabled_for_admins') {
              setAdsDisabledForAdmins(setting.setting_value === 'true');
            }
          });
        }
      } catch (error) {
        console.error('Error fetching ad settings:', error);
      }
    };

    fetchAdSettings();
  }, []);

  // Check if user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (!error) {
          setIsAdmin(!!data);
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      }
    };

    checkAdminRole();
  }, [user]);

  // Show the ad (with cooldown check and admin check)
  const showAd = useCallback(() => {
    // Skip ads for admins if setting is enabled
    if (isAdmin && adsDisabledForAdmins) {
      return;
    }

    const lastAdTime = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_AD_TIME) || '0', 10);
    const now = Date.now();
    
    if (now - lastAdTime >= cooldownMs) {
      setIsAdVisible(true);
      localStorage.setItem(STORAGE_KEYS.LAST_AD_TIME, now.toString());
    }
  }, [isAdmin, adsDisabledForAdmins, cooldownMs]);

  const closeAd = useCallback(() => {
    setIsAdVisible(false);
  }, []);

  // Trigger: Page open - always show ad
  const triggerPageOpen = useCallback(() => {
    showAd();
  }, [showAd]);

  // Trigger: Login/logout - always show ad
  const triggerAuthEvent = useCallback(() => {
    showAd();
  }, [showAd]);

  // Trigger: Add to favorites - every 2 products
  const triggerFavoriteAdd = useCallback(() => {
    const newCount = favoriteCount + 1;
    setFavoriteCount(newCount);
    localStorage.setItem(STORAGE_KEYS.FAVORITE_COUNT, newCount.toString());
    
    if (newCount >= 2) {
      showAd();
      setFavoriteCount(0);
      localStorage.setItem(STORAGE_KEYS.FAVORITE_COUNT, '0');
    }
  }, [favoriteCount, showAd]);

  // Trigger: Refresh - every 3 refreshes
  const triggerRefresh = useCallback(() => {
    const newCount = refreshCount + 1;
    setRefreshCount(newCount);
    localStorage.setItem(STORAGE_KEYS.REFRESH_COUNT, newCount.toString());
    
    if (newCount >= 3) {
      showAd();
      setRefreshCount(0);
      localStorage.setItem(STORAGE_KEYS.REFRESH_COUNT, '0');
    }
  }, [refreshCount, showAd]);

  // Trigger: Copy promo code - always show ad
  const triggerPromoCopy = useCallback(() => {
    showAd();
  }, [showAd]);

  // Trigger: Open shop - always show ad
  const triggerShopOpen = useCallback(() => {
    showAd();
  }, [showAd]);

  // Trigger: Click - every click shows ad
  const triggerClick = useCallback(() => {
    showAd();
  }, [showAd]);

  // Trigger: Load screen - every 5 times
  const triggerLoadScreen = useCallback(() => {
    const newCount = loadScreenCount + 1;
    setLoadScreenCount(newCount);
    localStorage.setItem(STORAGE_KEYS.LOAD_SCREEN_COUNT, newCount.toString());
    
    if (newCount >= 5) {
      showAd();
      setLoadScreenCount(0);
      localStorage.setItem(STORAGE_KEYS.LOAD_SCREEN_COUNT, '0');
    }
  }, [loadScreenCount, showAd]);

  // Track page refresh on mount
  useEffect(() => {
    triggerRefresh();
  }, []);

  return (
    <AdTriggerContext.Provider
      value={{
        showAd,
        triggerPageOpen,
        triggerAuthEvent,
        triggerFavoriteAdd,
        triggerRefresh,
        triggerPromoCopy,
        triggerShopOpen,
        triggerClick,
        triggerLoadScreen,
        isAdVisible,
        closeAd,
      }}
    >
      {children}
    </AdTriggerContext.Provider>
  );
}

export function useAdTrigger() {
  const context = useContext(AdTriggerContext);
  if (context === undefined) {
    throw new Error("useAdTrigger must be used within an AdTriggerProvider");
  }
  return context;
}
