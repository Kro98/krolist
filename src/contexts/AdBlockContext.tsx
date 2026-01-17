import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdBlockContextType {
  isAdBlockDetected: boolean;
  hasUserDeclined: boolean;
  shouldShowAds: boolean;
  showAdBlockPrompt: boolean;
  setShowAdBlockPrompt: (show: boolean) => void;
  handleUserDecision: (allowAds: boolean) => void;
  recheckAdBlock: () => void;
  // Settings from admin
  adBlockDetectionEnabled: boolean;
  bannerEnabled: boolean;
  promptTitleEn: string;
  promptTitleAr: string;
  promptDescriptionEn: string;
  promptDescriptionAr: string;
  bannerMessageEn: string;
  bannerMessageAr: string;
}

const AdBlockContext = createContext<AdBlockContextType | undefined>(undefined);

const STORAGE_KEY = 'krolist_adblock_preference';

const DEFAULT_SETTINGS = {
  adBlockDetectionEnabled: true,
  bannerEnabled: true,
  promptTitleEn: "We noticed you're using an ad blocker",
  promptTitleAr: "لاحظنا أنك تستخدم مانع إعلانات",
  promptDescriptionEn: "Ads help keep Krolist free for everyone. They support our servers, development, and allow us to continue providing price tracking and deals for you.",
  promptDescriptionAr: "الإعلانات تساعد في إبقاء كروليست مجاني للجميع. إنها تدعم خوادمنا وتطويرنا وتسمح لنا بالاستمرار في تقديم تتبع الأسعار والعروض لك.",
  bannerMessageEn: "Enjoying Krolist? Ads help us stay free!",
  bannerMessageAr: "هل تستمتع بكروليست؟ الإعلانات تساعدنا على البقاء مجانيين!",
};

export function AdBlockProvider({ children }: { children: ReactNode }) {
  const [isAdBlockDetected, setIsAdBlockDetected] = useState(false);
  const [hasUserDeclined, setHasUserDeclined] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'declined';
  });
  const [showAdBlockPrompt, setShowAdBlockPrompt] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  
  // Admin-configurable settings
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Fetch settings from database
  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ad_settings')
        .select('setting_key, setting_value');

      if (!error && data) {
        const newSettings = { ...DEFAULT_SETTINGS };
        
        data.forEach((setting) => {
          switch (setting.setting_key) {
            case 'adblock_detection_enabled':
              newSettings.adBlockDetectionEnabled = setting.setting_value === 'true';
              break;
            case 'adblock_banner_enabled':
              newSettings.bannerEnabled = setting.setting_value === 'true';
              break;
            case 'adblock_prompt_title_en':
              newSettings.promptTitleEn = setting.setting_value || DEFAULT_SETTINGS.promptTitleEn;
              break;
            case 'adblock_prompt_title_ar':
              newSettings.promptTitleAr = setting.setting_value || DEFAULT_SETTINGS.promptTitleAr;
              break;
            case 'adblock_prompt_description_en':
              newSettings.promptDescriptionEn = setting.setting_value || DEFAULT_SETTINGS.promptDescriptionEn;
              break;
            case 'adblock_prompt_description_ar':
              newSettings.promptDescriptionAr = setting.setting_value || DEFAULT_SETTINGS.promptDescriptionAr;
              break;
            case 'adblock_banner_message_en':
              newSettings.bannerMessageEn = setting.setting_value || DEFAULT_SETTINGS.bannerMessageEn;
              break;
            case 'adblock_banner_message_ar':
              newSettings.bannerMessageAr = setting.setting_value || DEFAULT_SETTINGS.bannerMessageAr;
              break;
          }
        });
        
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error fetching ad block settings:', error);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    
    // Subscribe to changes
    const channel = supabase
      .channel('adblock_settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ad_settings' }, () => {
        fetchSettings();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  // Detect ad blocker
  const detectAdBlocker = useCallback(async () => {
    if (!settings.adBlockDetectionEnabled) {
      setHasChecked(true);
      return false;
    }

    try {
      // Method 1: Try to create a bait element
      const testAd = document.createElement('div');
      testAd.innerHTML = '&nbsp;';
      testAd.className = 'adsbox ad-banner ad-placeholder pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links';
      testAd.style.cssText = 'position: absolute; top: -10px; left: -10px; width: 1px; height: 1px;';
      document.body.appendChild(testAd);

      await new Promise(resolve => setTimeout(resolve, 100));

      const isBlocked = testAd.offsetHeight === 0 || 
                       testAd.offsetParent === null ||
                       window.getComputedStyle(testAd).display === 'none' ||
                       window.getComputedStyle(testAd).visibility === 'hidden';

      document.body.removeChild(testAd);

      // Method 2: Check if adsbygoogle is blocked
      let adsbyGoogleBlocked = false;
      try {
        const script = document.createElement('script');
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        script.async = true;
        
        const loadPromise = new Promise((resolve) => {
          script.onload = () => resolve(false);
          script.onerror = () => resolve(true);
          setTimeout(() => resolve(true), 2000);
        });

        document.head.appendChild(script);
        adsbyGoogleBlocked = await loadPromise as boolean;
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      } catch {
        adsbyGoogleBlocked = true;
      }

      const detected = isBlocked || adsbyGoogleBlocked;
      setIsAdBlockDetected(detected);
      setHasChecked(true);

      // Show prompt if ad blocker detected and user hasn't made a decision
      const savedPreference = localStorage.getItem(STORAGE_KEY);
      if (detected && !savedPreference) {
        setTimeout(() => setShowAdBlockPrompt(true), 1500);
      }

      return detected;
    } catch (error) {
      console.error('Error detecting ad blocker:', error);
      setHasChecked(true);
      return false;
    }
  }, [settings.adBlockDetectionEnabled]);

  const recheckAdBlock = useCallback(() => {
    detectAdBlocker();
  }, [detectAdBlocker]);

  useEffect(() => {
    // Wait for settings to load before detecting
    if (settings.adBlockDetectionEnabled !== undefined) {
      detectAdBlocker();
    }
  }, [detectAdBlocker, settings.adBlockDetectionEnabled]);

  const handleUserDecision = useCallback((allowAds: boolean) => {
    if (allowAds) {
      localStorage.setItem(STORAGE_KEY, 'allowed');
      setHasUserDeclined(false);
    } else {
      localStorage.setItem(STORAGE_KEY, 'declined');
      setHasUserDeclined(true);
    }
    setShowAdBlockPrompt(false);
  }, []);

  // Determine if ads should be shown
  const shouldShowAds = !hasUserDeclined && hasChecked;

  return (
    <AdBlockContext.Provider
      value={{
        isAdBlockDetected,
        hasUserDeclined,
        shouldShowAds,
        showAdBlockPrompt,
        setShowAdBlockPrompt,
        handleUserDecision,
        recheckAdBlock,
        adBlockDetectionEnabled: settings.adBlockDetectionEnabled,
        bannerEnabled: settings.bannerEnabled,
        promptTitleEn: settings.promptTitleEn,
        promptTitleAr: settings.promptTitleAr,
        promptDescriptionEn: settings.promptDescriptionEn,
        promptDescriptionAr: settings.promptDescriptionAr,
        bannerMessageEn: settings.bannerMessageEn,
        bannerMessageAr: settings.bannerMessageAr,
      }}
    >
      {children}
    </AdBlockContext.Provider>
  );
}

export function useAdBlock() {
  const context = useContext(AdBlockContext);
  if (context === undefined) {
    throw new Error('useAdBlock must be used within an AdBlockProvider');
  }
  return context;
}
