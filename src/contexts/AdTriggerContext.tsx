import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

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
};

export function AdTriggerProvider({ children }: { children: ReactNode }) {
  const [isAdVisible, setIsAdVisible] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(() => {
    return parseInt(localStorage.getItem(STORAGE_KEYS.FAVORITE_COUNT) || '0', 10);
  });
  const [refreshCount, setRefreshCount] = useState(() => {
    return parseInt(localStorage.getItem(STORAGE_KEYS.REFRESH_COUNT) || '0', 10);
  });
  const [loadScreenCount, setLoadScreenCount] = useState(() => {
    return parseInt(localStorage.getItem(STORAGE_KEYS.LOAD_SCREEN_COUNT) || '0', 10);
  });

  // Show the ad
  const showAd = useCallback(() => {
    setIsAdVisible(true);
  }, []);

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
