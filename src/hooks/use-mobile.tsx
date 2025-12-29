import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1280;
const LAPTOP_BREAKPOINT = 1536;

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

// Returns true for laptop screens (1280px - 1535px)
export function useIsLaptop() {
  const [isLaptop, setIsLaptop] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      return width >= TABLET_BREAKPOINT && width < LAPTOP_BREAKPOINT;
    }
    return false;
  });

  React.useEffect(() => {
    const checkLaptop = () => {
      const width = window.innerWidth;
      setIsLaptop(width >= TABLET_BREAKPOINT && width < LAPTOP_BREAKPOINT);
    };
    
    const mql = window.matchMedia(`(min-width: ${TABLET_BREAKPOINT}px) and (max-width: ${LAPTOP_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", checkLaptop);
    
    checkLaptop();
    
    return () => mql.removeEventListener("change", checkLaptop);
  }, []);

  return isLaptop;
}

// Returns true for desktop/PC screens (1536px+)
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= LAPTOP_BREAKPOINT;
    }
    return false;
  });

  React.useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= LAPTOP_BREAKPOINT);
    };
    
    const mql = window.matchMedia(`(min-width: ${LAPTOP_BREAKPOINT}px)`);
    mql.addEventListener("change", checkDesktop);
    
    checkDesktop();
    
    return () => mql.removeEventListener("change", checkDesktop);
  }, []);

  return isDesktop;
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

// Returns true for laptop OR desktop (PC-like experience with sidebar)
export function useIsLaptopOrDesktop() {
  const [isLaptopOrDesktop, setIsLaptopOrDesktop] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= TABLET_BREAKPOINT;
    }
    return false;
  });

  React.useEffect(() => {
    const check = () => {
      setIsLaptopOrDesktop(window.innerWidth >= TABLET_BREAKPOINT);
    };
    
    const mql = window.matchMedia(`(min-width: ${TABLET_BREAKPOINT}px)`);
    mql.addEventListener("change", check);
    
    check();
    
    return () => mql.removeEventListener("change", check);
  }, []);

  return isLaptopOrDesktop;
}
