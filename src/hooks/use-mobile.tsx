import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1280;

export function useIsMobile() {
  // Initialize with actual value to avoid hydration mismatch in PWA
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    return false;
  });

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", checkMobile);
    
    // Check immediately in case initial state was wrong
    checkMobile();
    
    return () => mql.removeEventListener("change", checkMobile);
  }, []);

  return isMobile;
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      return width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
    }
    return false;
  });

  React.useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT);
    };
    
    const mql = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", checkTablet);
    
    checkTablet();
    
    return () => mql.removeEventListener("change", checkTablet);
  }, []);

  return isTablet;
}

// Returns true for mobile OR tablet (anything that should use sheet sidebar)
export function useIsMobileOrTablet() {
  const [isMobileOrTablet, setIsMobileOrTablet] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < TABLET_BREAKPOINT;
    }
    return false;
  });

  React.useEffect(() => {
    const check = () => {
      setIsMobileOrTablet(window.innerWidth < TABLET_BREAKPOINT);
    };
    
    const mql = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", check);
    
    check();
    
    return () => mql.removeEventListener("change", check);
  }, []);

  return isMobileOrTablet;
}
