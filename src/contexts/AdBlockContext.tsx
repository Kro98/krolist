import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface AdBlockContextType {
  isAdBlockDetected: boolean;
  hasUserDeclined: boolean;
  shouldShowAds: boolean;
  showAdBlockPrompt: boolean;
  setShowAdBlockPrompt: (show: boolean) => void;
  handleUserDecision: (allowAds: boolean) => void;
  recheckAdBlock: () => void;
}

const AdBlockContext = createContext<AdBlockContextType | undefined>(undefined);

const STORAGE_KEY = 'krolist_adblock_preference';

export function AdBlockProvider({ children }: { children: ReactNode }) {
  const [isAdBlockDetected, setIsAdBlockDetected] = useState(false);
  const [hasUserDeclined, setHasUserDeclined] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'declined';
  });
  const [showAdBlockPrompt, setShowAdBlockPrompt] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Detect ad blocker
  const detectAdBlocker = useCallback(async () => {
    try {
      // Method 1: Try to fetch a known ad script
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
        // Small delay to let the page load first
        setTimeout(() => setShowAdBlockPrompt(true), 1500);
      }

      return detected;
    } catch (error) {
      console.error('Error detecting ad blocker:', error);
      setHasChecked(true);
      return false;
    }
  }, []);

  const recheckAdBlock = useCallback(() => {
    detectAdBlocker();
  }, [detectAdBlocker]);

  useEffect(() => {
    detectAdBlocker();
  }, [detectAdBlocker]);

  const handleUserDecision = useCallback((allowAds: boolean) => {
    if (allowAds) {
      // User agreed to whitelist - we'll assume they will
      localStorage.setItem(STORAGE_KEY, 'allowed');
      setHasUserDeclined(false);
    } else {
      // User declined
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
