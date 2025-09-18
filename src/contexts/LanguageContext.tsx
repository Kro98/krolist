import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'ar';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'JPY' | 'AUD' | 'SAR';

interface LanguageContextType {
  language: Language;
  currency: Currency;
  setLanguage: (language: Language) => void;
  setCurrency: (currency: Currency) => void;
  t: (key: string) => string;
  getCurrencySymbol: (curr?: Currency) => string;
}

const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.products': 'Products',
    'nav.analytics': 'Analytics',
    'nav.promoCodes': 'Promo Codes',
    'nav.donation': 'Support Dev',
    'nav.settings': 'Settings',
    'nav.addProduct': 'Add Product',
    
    // Dashboard
    'dashboard.welcome': 'Welcome to PriceTracker',
    'dashboard.subtitle': 'Track your favorite products and never miss a deal again',
    'dashboard.totalProducts': 'Total Products',
    'dashboard.priceDrops': 'Price Drops',
    'dashboard.priceIncreases': 'Price Increases',
    'dashboard.watching': 'Watching',
    'dashboard.recentAlerts': 'Recent Price Alerts',
    'dashboard.latestChanges': 'Latest price changes on your tracked products',
    'dashboard.overview': 'Overview',
    
    // Products
    'products.title': 'Your Products',
    'products.subtitle': 'Track and manage your favorite products',
    'products.noProducts': 'No products tracked yet',
    'products.startTracking': 'Start tracking products to see them here',
    'products.viewDetails': 'View Details',
    'products.searchPlaceholder': 'Search products, stores, or categories...',
    'products.noResults': 'No products found',
    'products.noResultsDesc': 'Try adjusting your search terms',
    
    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your account preferences and app settings',
    'settings.languageRegion': 'Language & Region',
    'settings.languageDesc': 'Configure your preferred language and default currency',
    'settings.language': 'Language',
    'settings.currency': 'Default Currency',
    'settings.notifications': 'Notifications',
    'settings.notificationsDesc': 'Choose what notifications you want to receive',
    'settings.enableNotifications': 'Enable Notifications',
    'settings.enableNotificationsDesc': 'Receive notifications about price changes and updates',
    'settings.priceDropAlerts': 'Price Drop Alerts',
    'settings.priceDropAlertsDesc': 'Get notified when tracked product prices decrease',
    'settings.weeklyReports': 'Weekly Reports',
    'settings.weeklyReportsDesc': 'Receive weekly summaries of your tracked products',
    'settings.appearance': 'Appearance',
    'settings.appearanceDesc': 'Customize the look and feel of the application',
    'settings.theme': 'Theme',
    'settings.account': 'Account',
    'settings.accountDesc': 'Manage your account information',
    'settings.email': 'Email',
    'settings.displayName': 'Display Name',
    'settings.saveSettings': 'Save Settings',
    'settings.settingsSaved': 'Settings Saved',
    'settings.settingsSavedDesc': 'Your preferences have been updated successfully.',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    
    // Theme options
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
    
    // Languages
    'language.en': 'English',
    'language.ar': 'العربية',
    
    // Currencies
    'currency.USD': 'USD - US Dollar',
    'currency.EUR': 'EUR - Euro',
    'currency.GBP': 'GBP - British Pound',
    'currency.CAD': 'CAD - Canadian Dollar',
    'currency.JPY': 'JPY - Japanese Yen',
    'currency.AUD': 'AUD - Australian Dollar',
    'currency.SAR': 'SAR - Saudi Riyal',

    // Analytics
    'analytics.trends': 'Price Trends',
    'analytics.stores': 'Store Performance',
    'analytics.categories': 'Categories',
    'analytics.patterns': 'Price Patterns',
    'analytics.trendsDesc': 'Track price movements over time',
    'analytics.storesDesc': 'Compare store savings and reliability',
    'analytics.categoriesDesc': 'Analyze products by category',
    'analytics.patternsDesc': 'Discover when prices drop most',
    'analytics.avgSavings': 'Avg Savings',
    'analytics.reliability': 'Reliability',
    
    // UI Controls
    'ui.fontSize': 'Font Size',
    'ui.iconSize': 'Icon Size',
    'ui.display': 'Display',
    'ui.displayDesc': 'Customize font and icon sizes',
    'ui.small': 'Small',
    'ui.medium': 'Medium',
    'ui.large': 'Large',

    // Shop Management
    'settings.shopManagement': 'Shop Management',
    'settings.shopManagementDesc': 'Organize and customize your tracked shops',
    'settings.addNewShop': 'Add new shop...',
    'settings.dragToReorder': 'Drag to reorder',
    'status.active': 'Active',
    'search.placeholder': 'Search shops...',

    // Shops
    'shops.shein': 'SHEIN',
    'shops.noon': 'NOON',
    'shops.amazon': 'Amazon',
    'shops.ikea': 'IKEA',
    'shops.abyat': 'ABYAT',
    'shops.namshi': 'NAMSHI',
    'shops.trendyol': 'TRENDYOL',
    'shops.asos': 'ASOS',
    'shops.title': 'Shops',
    
    'settings.other': 'Other',
  },
  ar: {
    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.products': 'المنتجات',
    'nav.analytics': 'التحليلات',
    'nav.promoCodes': 'أكواد الخصم',
    'nav.donation': 'دعم المطور',
    'nav.settings': 'الإعدادات',
    'nav.addProduct': 'إضافة منتج',
    
    // Dashboard
    'dashboard.welcome': 'مرحباً بك في متتبع الأسعار',
    'dashboard.subtitle': 'تابع منتجاتك المفضلة ولا تفوت أي عرض',
    'dashboard.totalProducts': 'إجمالي المنتجات',
    'dashboard.priceDrops': 'انخفاض الأسعار',
    'dashboard.priceIncreases': 'ارتفاع الأسعار',
    'dashboard.watching': 'قيد المتابعة',
    'dashboard.recentAlerts': 'تنبيهات الأسعار الحديثة',
    'dashboard.latestChanges': 'آخر تغييرات الأسعار على منتجاتك المتابعة',
    'dashboard.overview': 'نظرة عامة',
    
    // Products
    'products.title': 'منتجاتك',
    'products.subtitle': 'تابع وأدر منتجاتك المفضلة',
    'products.noProducts': 'لا توجد منتجات متابعة حتى الآن',
    'products.startTracking': 'ابدأ بمتابعة المنتجات لرؤيتها هنا',
    'products.viewDetails': 'عرض التفاصيل',
    'products.searchPlaceholder': 'البحث في المنتجات أو المتاجر أو الفئات...',
    'products.noResults': 'لم يتم العثور على منتجات',
    'products.noResultsDesc': 'جرب تعديل مصطلحات البحث',
    
    // Settings
    'settings.title': 'الإعدادات',
    'settings.subtitle': 'إدارة تفضيلات حسابك وإعدادات التطبيق',
    'settings.languageRegion': 'اللغة والمنطقة',
    'settings.languageDesc': 'تكوين لغتك المفضلة والعملة الافتراضية',
    'settings.language': 'اللغة',
    'settings.currency': 'العملة الافتراضية',
    'settings.notifications': 'الإشعارات',
    'settings.notificationsDesc': 'اختر الإشعارات التي تريد استقبالها',
    'settings.enableNotifications': 'تمكين الإشعارات',
    'settings.enableNotificationsDesc': 'استقبل إشعارات حول تغييرات الأسعار والتحديثات',
    'settings.priceDropAlerts': 'تنبيهات انخفاض الأسعار',
    'settings.priceDropAlertsDesc': 'احصل على إشعار عندما تنخفض أسعار المنتجات المتابعة',
    'settings.weeklyReports': 'التقارير الأسبوعية',
    'settings.weeklyReportsDesc': 'استقبل ملخصات أسبوعية لمنتجاتك المتابعة',
    'settings.appearance': 'المظهر',
    'settings.appearanceDesc': 'تخصيص شكل ومظهر التطبيق',
    'settings.theme': 'السمة',
    'settings.account': 'الحساب',
    'settings.accountDesc': 'إدارة معلومات حسابك',
    'settings.email': 'البريد الإلكتروني',
    'settings.displayName': 'الاسم المعروض',
    'settings.saveSettings': 'حفظ الإعدادات',
    'settings.settingsSaved': 'تم حفظ الإعدادات',
    'settings.settingsSavedDesc': 'تم تحديث تفضيلاتك بنجاح.',
    
    // Common
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.loading': 'جارٍ التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجح',
    
    // Theme options
    'theme.light': 'فاتح',
    'theme.dark': 'داكن',
    'theme.system': 'النظام',
    
    // Languages
    'language.en': 'English',
    'language.ar': 'العربية',
    
    // Currencies
    'currency.USD': 'دولار أمريكي - USD',
    'currency.EUR': 'يورو - EUR',
    'currency.GBP': 'جنيه إسترليني - GBP',
    'currency.CAD': 'دولار كندي - CAD',
    'currency.JPY': 'ين ياباني - JPY',
    'currency.AUD': 'دولار أسترالي - AUD',
    'currency.SAR': 'ريال سعودي - SAR',

    // Analytics
    'analytics.trends': 'اتجاهات الأسعار',
    'analytics.stores': 'أداء المتاجر',
    'analytics.categories': 'الفئات',
    'analytics.patterns': 'أنماط الأسعار',
    'analytics.trendsDesc': 'تتبع حركات الأسعار عبر الزمن',
    'analytics.storesDesc': 'مقارنة وفورات وموثوقية المتاجر',
    'analytics.categoriesDesc': 'تحليل المنتجات حسب الفئة',
    'analytics.patternsDesc': 'اكتشف متى تنخفض الأسعار أكثر',
    'analytics.avgSavings': 'متوسط الوفورات',
    'analytics.reliability': 'الموثوقية',
    
    // UI Controls
    'ui.fontSize': 'حجم الخط',
    'ui.iconSize': 'حجم الأيقونات',
    'ui.display': 'العرض',
    'ui.displayDesc': 'تخصيص أحجام الخط والأيقونات',
    'ui.small': 'صغير',
    'ui.medium': 'متوسط',
    'ui.large': 'كبير',

    // Shop Management
    'settings.shopManagement': 'إدارة المتاجر',
    'settings.shopManagementDesc': 'تنظيم وتخصيص المتاجر المتتبعة',
    'settings.addNewShop': 'إضافة متجر جديد...',
    'settings.dragToReorder': 'اسحب لإعادة الترتيب',
    'status.active': 'نشط',
    'search.placeholder': 'البحث في المتاجر...',

    // Shops
    'shops.shein': 'شي إن',
    'shops.noon': 'نون',
    'shops.amazon': 'أمازون',
    'shops.ikea': 'إيكيا',
    'shops.abyat': 'أبيات',
    'shops.namshi': 'نمشي',
    'shops.trendyol': 'تريندي يول',
    'shops.asos': 'إيسوس',
    'shops.title': 'المتاجر',
    
    'settings.other': 'أخرى',
  }
};

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  JPY: '¥',
  AUD: 'A$',
  SAR: '﷼'
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'en';
  });
  
  const [currency, setCurrency] = useState<Currency>(() => {
    return (localStorage.getItem('currency') as Currency) || 'USD';
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    // Update document direction for RTL languages
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const handleSetCurrency = (curr: Currency) => {
    setCurrency(curr);
    localStorage.setItem('currency', curr);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  const getCurrencySymbol = (curr?: Currency): string => {
    return currencySymbols[curr || currency];
  };

  // Set initial direction
  React.useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider 
      value={{ 
        language, 
        currency, 
        setLanguage: handleSetLanguage, 
        setCurrency: handleSetCurrency, 
        t, 
        getCurrencySymbol 
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};