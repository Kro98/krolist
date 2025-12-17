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
const DEFAULT_FAVORITE_THRESHOLD = 2;
const DEFAULT_REFRESH_THRESHOLD = 3;
const DEFAULT_LOAD_SCREEN_THRESHOLD = 5;

type AdVisibilityMode = 'all' | 'guests_only' | 'users_only' | 'admins_only' | 'disabled';

export function AdTriggerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isAdVisible, setIsAdVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adsDisabledForAdmins, setAdsDisabledForAdmins] = useState(true);
  const [visibilityMode, setVisibilityMode] = useState<AdVisibilityMode>('all');
  const [cooldownMs, setCooldownMs] = useState(DEFAULT_COOLDOWN_MS);
  const [favoriteThreshold, setFavoriteThreshold] = useState(DEFAULT_FAVORITE_THRESHOLD);
  const [refreshThreshold, setRefreshThreshold] = useState(DEFAULT_REFRESH_THRESHOLD);
  const [loadScreenThreshold, setLoadScreenThreshold] = useState(DEFAULT_LOAD_SCREEN_THRESHOLD);
  
  // Trigger enable states
  const [triggers, setTriggers] = useState({
    pageOpen: true,
    authEvent: true,
    favoriteAdd: true,
    refresh: true,
    promoCopy: true,
    shopOpen: true,
    click: true,
    loadScreen: true,
  });

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
          const newTriggers = { ...triggers };
          data.forEach((setting) => {
            if (setting.setting_key === 'ad_cooldown_seconds') {
              setCooldownMs(parseInt(setting.setting_value, 10) * 1000);
            } else if (setting.setting_key === 'ads_disabled_for_admins') {
              setAdsDisabledForAdmins(setting.setting_value === 'true');
            } else if (setting.setting_key === 'ad_visibility_mode') {
              setVisibilityMode(setting.setting_value as AdVisibilityMode);
            } else if (setting.setting_key === 'favorite_count_threshold') {
              setFavoriteThreshold(parseInt(setting.setting_value, 10));
            } else if (setting.setting_key === 'refresh_count_threshold') {
              setRefreshThreshold(parseInt(setting.setting_value, 10));
            } else if (setting.setting_key === 'load_screen_count_threshold') {
              setLoadScreenThreshold(parseInt(setting.setting_value, 10));
            } else if (setting.setting_key === 'trigger_page_open_enabled') {
              newTriggers.pageOpen = setting.setting_value === 'true';
            } else if (setting.setting_key === 'trigger_auth_event_enabled') {
              newTriggers.authEvent = setting.setting_value === 'true';
            } else if (setting.setting_key === 'trigger_favorite_add_enabled') {
              newTriggers.favoriteAdd = setting.setting_value === 'true';
            } else if (setting.setting_key === 'trigger_refresh_enabled') {
              newTriggers.refresh = setting.setting_value === 'true';
            } else if (setting.setting_key === 'trigger_promo_copy_enabled') {
              newTriggers.promoCopy = setting.setting_value === 'true';
            } else if (setting.setting_key === 'trigger_shop_open_enabled') {
              newTriggers.shopOpen = setting.setting_value === 'true';
            } else if (setting.setting_key === 'trigger_click_enabled') {
              newTriggers.click = setting.setting_value === 'true';
            } else if (setting.setting_key === 'trigger_load_screen_enabled') {
              newTriggers.loadScreen = setting.setting_value === 'true';
            }
          });
          setTriggers(newTriggers);
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

  // Check if user should see ads based on visibility mode
  const shouldShowAds = useCallback(() => {
    if (visibilityMode === 'disabled') return false;
    if (visibilityMode === 'guests_only') return !user;
    if (visibilityMode === 'users_only') return !!user && !isAdmin;
    if (visibilityMode === 'admins_only') return isAdmin;
    // 'all' mode - check admin exemption
    if (isAdmin && adsDisabledForAdmins) return false;
    return true;
  }, [visibilityMode, user, isAdmin, adsDisabledForAdmins]);

  // Show the ad (with cooldown check and visibility check)
  const showAd = useCallback(() => {
    if (!shouldShowAds()) return;

    const lastAdTime = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_AD_TIME) || '0', 10);
    const now = Date.now();
    
    if (now - lastAdTime >= cooldownMs) {
      setIsAdVisible(true);
      localStorage.setItem(STORAGE_KEYS.LAST_AD_TIME, now.toString());
    }
  }, [shouldShowAds, cooldownMs]);

  const closeAd = useCallback(() => {
    setIsAdVisible(false);
  }, []);

  // Trigger: Page open
  const triggerPageOpen = useCallback(() => {
    if (triggers.pageOpen) showAd();
  }, [showAd, triggers.pageOpen]);

  // Trigger: Login/logout
  const triggerAuthEvent = useCallback(() => {
    if (triggers.authEvent) showAd();
  }, [showAd, triggers.authEvent]);

  // Trigger: Add to favorites - configurable threshold
  const triggerFavoriteAdd = useCallback(() => {
    if (!triggers.favoriteAdd) return;
    const newCount = favoriteCount + 1;
    setFavoriteCount(newCount);
    localStorage.setItem(STORAGE_KEYS.FAVORITE_COUNT, newCount.toString());
    
    if (newCount >= favoriteThreshold) {
      showAd();
      setFavoriteCount(0);
      localStorage.setItem(STORAGE_KEYS.FAVORITE_COUNT, '0');
    }
  }, [favoriteCount, favoriteThreshold, showAd, triggers.favoriteAdd]);

  // Trigger: Refresh - configurable threshold
  const triggerRefresh = useCallback(() => {
    if (!triggers.refresh) return;
    const newCount = refreshCount + 1;
    setRefreshCount(newCount);
    localStorage.setItem(STORAGE_KEYS.REFRESH_COUNT, newCount.toString());
    
    if (newCount >= refreshThreshold) {
      showAd();
      setRefreshCount(0);
      localStorage.setItem(STORAGE_KEYS.REFRESH_COUNT, '0');
    }
  }, [refreshCount, refreshThreshold, showAd, triggers.refresh]);

  // Trigger: Copy promo code
  const triggerPromoCopy = useCallback(() => {
    if (triggers.promoCopy) showAd();
  }, [showAd, triggers.promoCopy]);

  // Trigger: Open shop
  const triggerShopOpen = useCallback(() => {
    if (triggers.shopOpen) showAd();
  }, [showAd, triggers.shopOpen]);

  // Trigger: Click
  const triggerClick = useCallback(() => {
    if (triggers.click) showAd();
  }, [showAd, triggers.click]);

  // Trigger: Load screen - configurable threshold
  const triggerLoadScreen = useCallback(() => {
    if (!triggers.loadScreen) return;
    const newCount = loadScreenCount + 1;
    setLoadScreenCount(newCount);
    localStorage.setItem(STORAGE_KEYS.LOAD_SCREEN_COUNT, newCount.toString());
    
    if (newCount >= loadScreenThreshold) {
      showAd();
      setLoadScreenCount(0);
      localStorage.setItem(STORAGE_KEYS.LOAD_SCREEN_COUNT, '0');
    }
  }, [loadScreenCount, loadScreenThreshold, showAd, triggers.loadScreen]);

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
