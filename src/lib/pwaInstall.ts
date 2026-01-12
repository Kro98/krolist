// Unified PWA Installation Service
// Handles device/browser detection, installation prompts, and tracking

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type DeviceType = 
  | 'iphone' 
  | 'ipad' 
  | 'android-phone' 
  | 'android-tablet' 
  | 'windows' 
  | 'mac' 
  | 'linux' 
  | 'chromebook' 
  | 'unknown';

export type BrowserType = 
  | 'safari' 
  | 'chrome' 
  | 'firefox' 
  | 'edge' 
  | 'opera' 
  | 'samsung-internet' 
  | 'brave'
  | 'in-app-browser'
  | 'unknown';

export interface DeviceInfo {
  device: DeviceType;
  browser: BrowserType;
  isStandalone: boolean;
  supportsNativePrompt: boolean;
  isInAppBrowser: boolean;
}

// Detect device type
export function getDeviceType(): DeviceType {
  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator as any).userAgentData?.platform?.toLowerCase() || '';
  
  // Check for tablets first
  const isTablet = /ipad|tablet|playbook|silk/i.test(navigator.userAgent) || 
                   (ua.includes('android') && !ua.includes('mobile'));
  
  // iPad detection (including newer iPads that report as Mac)
  if (/ipad/.test(ua) || 
      (ua.includes('mac') && 'ontouchend' in document && isTablet)) {
    return 'ipad';
  }
  
  // Android tablet
  if (isTablet && ua.includes('android')) {
    return 'android-tablet';
  }
  
  // iPhone/iPod
  if (/iphone|ipod/.test(ua)) {
    return 'iphone';
  }
  
  // Android phone
  if (ua.includes('android')) {
    return 'android-phone';
  }
  
  // ChromeOS
  if (ua.includes('cros')) {
    return 'chromebook';
  }
  
  // Windows
  if (ua.includes('win') || platform === 'windows') {
    return 'windows';
  }
  
  // Mac
  if (ua.includes('mac') || platform === 'macos') {
    return 'mac';
  }
  
  // Linux
  if (ua.includes('linux')) {
    return 'linux';
  }
  
  return 'unknown';
}

// Detect browser type
export function getBrowserType(): BrowserType {
  const ua = navigator.userAgent.toLowerCase();
  
  // Check for in-app browsers first (Facebook, Instagram, etc.)
  if (/fbav|fban|instagram|twitter|line|snapchat|pinterest/i.test(navigator.userAgent)) {
    return 'in-app-browser';
  }
  
  // Samsung Internet
  if (ua.includes('samsungbrowser')) {
    return 'samsung-internet';
  }
  
  // Brave (has to be checked before Chrome as it uses Chrome's engine)
  if ((navigator as any).brave !== undefined) {
    return 'brave';
  }
  
  // Edge (Chromium-based)
  if (ua.includes('edg/')) {
    return 'edge';
  }
  
  // Opera
  if (ua.includes('opr/') || ua.includes('opera')) {
    return 'opera';
  }
  
  // Firefox
  if (ua.includes('firefox') || ua.includes('fxios')) {
    return 'firefox';
  }
  
  // Chrome (check after Edge and Opera as they also contain 'chrome')
  if (ua.includes('chrome') || ua.includes('crios')) {
    return 'chrome';
  }
  
  // Safari (check last as many browsers include 'safari')
  if (ua.includes('safari') && !ua.includes('chrome')) {
    return 'safari';
  }
  
  return 'unknown';
}

// Check if app is running in standalone mode
export function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://") ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches;
}

// Get comprehensive device info
export function getDeviceInfo(): DeviceInfo {
  const device = getDeviceType();
  const browser = getBrowserType();
  const standalone = isStandalone();
  
  // Native prompt is supported in Chrome, Edge, Samsung Internet on Android/Desktop
  // NOT supported in Safari, Firefox, or any iOS browser
  const supportsNativePrompt = 
    !device.includes('iphone') && 
    !device.includes('ipad') && 
    browser !== 'firefox' && 
    browser !== 'safari' &&
    browser !== 'in-app-browser';
  
  return {
    device,
    browser,
    isStandalone: standalone,
    supportsNativePrompt,
    isInAppBrowser: browser === 'in-app-browser'
  };
}

// Installation instructions for each device/browser combination
export interface InstallStep {
  text: { en: string; ar: string };
  icon?: string; // Icon name from lucide-react
}

export interface InstallInstructions {
  title: { en: string; ar: string };
  steps: InstallStep[];
  hint?: { en: string; ar: string };
  browserNote?: { en: string; ar: string };
}

export function getInstallInstructions(device: DeviceType, browser: BrowserType): InstallInstructions {
  // iOS devices (Safari is the only browser that supports PWA on iOS)
  if (device === 'iphone' || device === 'ipad') {
    if (browser !== 'safari') {
      return {
        title: {
          en: 'Open in Safari to Install',
          ar: 'افتح في Safari للتثبيت'
        },
        steps: [
          { text: { en: 'Copy this page URL', ar: 'انسخ رابط هذه الصفحة' }, icon: 'copy' },
          { text: { en: 'Open Safari browser', ar: 'افتح متصفح Safari' }, icon: 'compass' },
          { text: { en: 'Paste the URL and go', ar: 'الصق الرابط واذهب' }, icon: 'link' }
        ],
        browserNote: {
          en: 'iOS only allows installing apps from Safari',
          ar: 'iOS يسمح فقط بتثبيت التطبيقات من Safari'
        }
      };
    }
    
    return {
      title: {
        en: device === 'iphone' ? 'Install on iPhone' : 'Install on iPad',
        ar: device === 'iphone' ? 'تثبيت على iPhone' : 'تثبيت على iPad'
      },
      steps: [
        { text: { en: 'Tap the Share button', ar: 'اضغط على زر المشاركة' }, icon: 'share' },
        { text: { en: 'Scroll down the menu', ar: 'مرر للأسفل في القائمة' }, icon: 'chevron-down' },
        { text: { en: 'Tap "Add to Home Screen"', ar: 'اضغط على "إضافة إلى الشاشة الرئيسية"' }, icon: 'plus-square' },
        { text: { en: 'Tap "Add" to confirm', ar: 'اضغط على "إضافة" للتأكيد' }, icon: 'check' }
      ],
      hint: {
        en: device === 'iphone' 
          ? 'The Share button is at the bottom of Safari'
          : 'The Share button is at the top of Safari',
        ar: device === 'iphone'
          ? 'زر المشاركة في أسفل Safari'
          : 'زر المشاركة في أعلى Safari'
      }
    };
  }
  
  // Android devices
  if (device === 'android-phone' || device === 'android-tablet') {
    if (browser === 'samsung-internet') {
      return {
        title: {
          en: 'Install on Samsung',
          ar: 'تثبيت على سامسونج'
        },
        steps: [
          { text: { en: 'Tap the menu (☰) button', ar: 'اضغط على زر القائمة (☰)' }, icon: 'menu' },
          { text: { en: 'Tap "Add page to"', ar: 'اضغط على "إضافة الصفحة إلى"' }, icon: 'plus' },
          { text: { en: 'Select "Home screen"', ar: 'اختر "الشاشة الرئيسية"' }, icon: 'home' },
          { text: { en: 'Tap "Add" to confirm', ar: 'اضغط على "إضافة" للتأكيد' }, icon: 'check' }
        ]
      };
    }
    
    if (browser === 'firefox') {
      return {
        title: {
          en: 'Install on Android',
          ar: 'تثبيت على أندرويد'
        },
        steps: [
          { text: { en: 'Tap the menu (⋮) button', ar: 'اضغط على زر القائمة (⋮)' }, icon: 'more-vertical' },
          { text: { en: 'Tap "Install"', ar: 'اضغط على "تثبيت"' }, icon: 'download' },
          { text: { en: 'Confirm installation', ar: 'أكد التثبيت' }, icon: 'check' }
        ],
        browserNote: {
          en: 'Firefox has limited PWA support. Try Chrome for best experience.',
          ar: 'Firefox لديه دعم محدود. جرب Chrome للحصول على أفضل تجربة.'
        }
      };
    }
    
    return {
      title: {
        en: device === 'android-phone' ? 'Install on Android' : 'Install on Tablet',
        ar: device === 'android-phone' ? 'تثبيت على أندرويد' : 'تثبيت على الجهاز اللوحي'
      },
      steps: [
        { text: { en: 'Tap the menu (⋮) button', ar: 'اضغط على زر القائمة (⋮)' }, icon: 'more-vertical' },
        { text: { en: 'Tap "Install app" or "Add to Home screen"', ar: 'اضغط على "تثبيت التطبيق" أو "إضافة للشاشة"' }, icon: 'download' },
        { text: { en: 'Tap "Install" to confirm', ar: 'اضغط على "تثبيت" للتأكيد' }, icon: 'check' }
      ]
    };
  }
  
  // Desktop browsers
  if (browser === 'safari') {
    return {
      title: {
        en: 'Install on Mac',
        ar: 'تثبيت على ماك'
      },
      steps: [
        { text: { en: 'Click File in the menu bar', ar: 'اضغط على ملف في شريط القوائم' }, icon: 'file' },
        { text: { en: 'Click "Add to Dock..."', ar: 'اضغط على "إضافة إلى Dock..."' }, icon: 'plus' },
        { text: { en: 'Click "Add" to confirm', ar: 'اضغط على "إضافة" للتأكيد' }, icon: 'check' }
      ],
      browserNote: {
        en: 'macOS Sonoma or later required',
        ar: 'يتطلب macOS Sonoma أو أحدث'
      }
    };
  }
  
  if (browser === 'firefox') {
    return {
      title: {
        en: 'Install Krolist',
        ar: 'تثبيت كروليست'
      },
      steps: [
        { text: { en: 'Firefox has limited PWA support', ar: 'Firefox لديه دعم محدود' }, icon: 'info' },
        { text: { en: 'Try using Chrome or Edge for best experience', ar: 'جرب Chrome أو Edge للحصول على أفضل تجربة' }, icon: 'chrome' }
      ],
      browserNote: {
        en: 'We recommend Chrome or Edge for the best installation experience',
        ar: 'نوصي بـ Chrome أو Edge للحصول على أفضل تجربة تثبيت'
      }
    };
  }
  
  // Chrome, Edge, Brave, Opera on desktop
  return {
    title: {
      en: 'Install Krolist',
      ar: 'تثبيت كروليست'
    },
    steps: [
      { text: { en: 'Click the install icon in the address bar', ar: 'اضغط على أيقونة التثبيت في شريط العنوان' }, icon: 'download' },
      { text: { en: 'Or click menu (⋮) → "Install Krolist"', ar: 'أو اضغط القائمة (⋮) ← "تثبيت كروليست"' }, icon: 'more-vertical' },
      { text: { en: 'Click "Install" to confirm', ar: 'اضغط على "تثبيت" للتأكيد' }, icon: 'check' }
    ]
  };
}

// Get in-app browser instructions
export function getInAppBrowserInstructions(): InstallInstructions {
  return {
    title: {
      en: 'Open in Browser',
      ar: 'افتح في المتصفح'
    },
    steps: [
      { text: { en: 'Tap the menu (⋯) or share button', ar: 'اضغط على القائمة (⋯) أو زر المشاركة' }, icon: 'more-horizontal' },
      { text: { en: 'Select "Open in Browser" or "Open in Chrome/Safari"', ar: 'اختر "فتح في المتصفح" أو "فتح في Chrome/Safari"' }, icon: 'external-link' },
      { text: { en: 'Then follow the install steps', ar: 'ثم اتبع خطوات التثبيت' }, icon: 'arrow-right' }
    ],
    browserNote: {
      en: 'In-app browsers don\'t support installing apps',
      ar: 'المتصفحات داخل التطبيقات لا تدعم تثبيت التطبيقات'
    }
  };
}

// Device label for UI
export function getDeviceLabel(device: DeviceType, language: 'en' | 'ar'): string {
  const labels: Record<DeviceType, { en: string; ar: string }> = {
    'iphone': { en: 'iPhone', ar: 'آيفون' },
    'ipad': { en: 'iPad', ar: 'آيباد' },
    'android-phone': { en: 'Android', ar: 'أندرويد' },
    'android-tablet': { en: 'Android Tablet', ar: 'جهاز أندرويد لوحي' },
    'windows': { en: 'Windows', ar: 'ويندوز' },
    'mac': { en: 'Mac', ar: 'ماك' },
    'linux': { en: 'Linux', ar: 'لينكس' },
    'chromebook': { en: 'Chromebook', ar: 'كروم بوك' },
    'unknown': { en: 'Your Device', ar: 'جهازك' }
  };
  return labels[device][language];
}

// Browser label for UI
export function getBrowserLabel(browser: BrowserType, language: 'en' | 'ar'): string {
  const labels: Record<BrowserType, { en: string; ar: string }> = {
    'safari': { en: 'Safari', ar: 'سفاري' },
    'chrome': { en: 'Chrome', ar: 'كروم' },
    'firefox': { en: 'Firefox', ar: 'فايرفوكس' },
    'edge': { en: 'Edge', ar: 'إيدج' },
    'opera': { en: 'Opera', ar: 'أوبرا' },
    'samsung-internet': { en: 'Samsung Internet', ar: 'سامسونج إنترنت' },
    'brave': { en: 'Brave', ar: 'بريف' },
    'in-app-browser': { en: 'In-App Browser', ar: 'متصفح داخلي' },
    'unknown': { en: 'Browser', ar: 'المتصفح' }
  };
  return labels[browser][language];
}

// Global state for deferred prompt
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners: ((prompt: BeforeInstallPromptEvent | null) => void)[] = [];

// Initialize prompt listener (call once on app start)
export function initPWAPromptListener(): void {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach(listener => listener(deferredPrompt));
  });
  
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    promptListeners.forEach(listener => listener(null));
  });
}

// Subscribe to prompt changes
export function subscribeToPrompt(callback: (prompt: BeforeInstallPromptEvent | null) => void): () => void {
  promptListeners.push(callback);
  // Immediately call with current state
  callback(deferredPrompt);
  
  // Return unsubscribe function
  return () => {
    const index = promptListeners.indexOf(callback);
    if (index > -1) {
      promptListeners.splice(index, 1);
    }
  };
}

// Get current deferred prompt
export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

// Clear deferred prompt after use
export function clearDeferredPrompt(): void {
  deferredPrompt = null;
  promptListeners.forEach(listener => listener(null));
}

// Trigger native install prompt if available
export async function triggerNativeInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) {
    return 'unavailable';
  }
  
  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      clearDeferredPrompt();
    }
    
    return outcome;
  } catch (error) {
    console.error('Native install prompt failed:', error);
    return 'unavailable';
  }
}
