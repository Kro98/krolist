import { useState, useEffect } from "react";

export function useAdBlockDetection() {
  const [hasAdBlock, setHasAdBlock] = useState<boolean | null>(null);
  const [userChoice, setUserChoice] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has already made a choice
    const storedChoice = localStorage.getItem("adblock-preference");
    setUserChoice(storedChoice);

    // Only detect if user hasn't made a choice or chose to allow ads
    if (!storedChoice || storedChoice === "allow-ads") {
      detectAdBlock();
    }
  }, []);

  const detectAdBlock = async () => {
    try {
      // Method 1: Try to fetch a known ad script
      const response = await fetch(
        "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
        {
          method: "HEAD",
          mode: "no-cors",
        }
      );
      setHasAdBlock(false);
    } catch (error) {
      setHasAdBlock(true);
    }

    // Method 2: Check if AdSense script loaded
    if (!window.adsbygoogle || window.adsbygoogle.length === 0) {
      setHasAdBlock(true);
    }
  };

  const setPreference = (preference: "allow-ads" | "block-ads") => {
    localStorage.setItem("adblock-preference", preference);
    setUserChoice(preference);
  };

  return {
    hasAdBlock,
    userChoice,
    setPreference,
    shouldShowDialog: hasAdBlock && !userChoice,
  };
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}
