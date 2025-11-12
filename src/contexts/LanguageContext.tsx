import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'ar';
export type Currency = 'USD' | 'SAR' | 'EGP' | 'AED';

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
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.products': 'Products',
    'nav.analytics': 'Analytics',
    'nav.news': 'News & Updates',
    'nav.events': 'Events',
    'nav.promoCodes': 'Promo Codes',
    'nav.donation': 'Support Krolist',
    'nav.settings': 'Settings',
    'nav.addProduct': 'Add Product',
    
    // Home
    'home.welcome': 'Welcome to Krolist',
    'home.subtitle': 'Discover the best deals across all your favorite stores',
    'home.startShopping': 'Start Shopping',
    'home.myProducts': 'My Products',
    'home.featured': 'Featured Products',
    'home.categories': 'Shop by Category',
    'home.viewAll': 'View All',
    'home.noCategoryProducts': 'No products in this category yet',
    
    // Dashboard
    'dashboard.welcome': 'Welcome to PriceTracker',
    'dashboard.subtitle': 'Track your favorite products and never miss a deal again',
    'dashboard.totalProducts': 'Total Products',
    'dashboard.priceDrops': 'Price Drops',
    'dashboard.priceIncreases': 'Price Increases',
    'dashboard.totalAmount': 'Total Amount of Products',
    'dashboard.watching': 'Watching',
    'dashboard.recentAlerts': 'Recent Price Change',
    'dashboard.latestChanges': 'Latest price changes on your tracked products',
    'dashboard.overview': 'Overview',
    
    // Products
    'products.title': 'Your Products',
    'products.subtitle': 'Track and manage your favorite products',
    'products.noProducts': 'No products tracked yet',
    'products.startTracking': 'Start tracking products to see them here',
    'products.searchProducts': 'Search Products',
    'products.manualEntry': 'Manual Entry',
    'products.viewDetails': 'View Details',
    'products.searchPlaceholder': 'Search products, stores, or categories...',
    'products.noResults': 'No products found',
    'products.noResultsDesc': 'Try adjusting your search terms',
    'products.delete': 'Delete',
    'products.currency': 'Currency',
    'products.refresh': 'Refresh',
    'products.edit': 'Edit',
    'products.description': 'Experience immersive sound quality with noise cancellation.',
    'products.updated': 'Updated',
    'products.showHistory': 'Show history',
    'products.priceDetails': 'Price Details',
    'products.recordedHistory': 'Recorded price history over the last 7 months',
    'products.highest': 'Highest',
    'products.lowest': 'Lowest',
    'products.original': 'Original',
    'products.deleteSuccess': 'Product deleted successfully',
    'products.currencyChanged': 'Currency changed successfully',
    'products.editSuccess': 'Product updated successfully',
    'products.changeCurrency': 'Change Currency',
    'products.selectCurrency': 'Select the currency for this product',
    'products.editProduct': 'Edit Product',
    'products.select': 'Select',
    'products.cancelSelection': 'Cancel',
    'products.addToCart': 'Add to Cart',
    'products.selectedItems': 'items selected',
    'products.selectSameStore': 'Please select products from the same store only',
    'products.editDescription': 'Update the product details below',
    'products.productTitle': 'Product Title',
    'products.enterTitle': 'Enter product title',
    'products.productDescription': 'Product Description',
    'products.enterDescription': 'Enter product description',
    'products.imageUrl': 'Image URL',
    'products.enterImageUrl': 'Enter image URL',
    'products.currentPrice': 'Current Price',
    'products.enterPrice': 'Enter price',
    
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
    'loading': 'Loading...',
    'error': 'Error',
    'save': 'Save',
    'cancel': 'Cancel',
    'success': 'Success',
    'featured': 'Featured',
    
    // User
    'user.guest': 'Guest',
    
    // Admin Dashboard
    'admin.dashboard': 'Admin Dashboard',
    'admin.dashboardDesc': 'Manage Krolist content and settings',
    'admin.accessDenied': 'Access Denied',
    'admin.accessDeniedDesc': 'You need admin privileges to access this page',
    'admin.krolistProducts': 'Krolist Products',
    'admin.krolistProductsDesc': 'Manage curated product selections for all users',
    'admin.promoCodes': 'Promo Codes',
    'admin.krolistPromoCodes': 'Krolist Promo Codes',
    'admin.krolistPromoCodesDesc': 'Manage promo codes visible to all users',
    'admin.newsUpdates': 'News & Updates',
    'admin.newsUpdatesDesc': 'Manage news and announcements',
    'admin.shopManagement': 'Shop Management',
    'admin.shopManagementDesc': 'Manage available shops and affiliate links',
    'admin.addProduct': 'Add Product',
    'admin.editProduct': 'Edit Product',
    'admin.addPromoCode': 'Add Promo Code',
    'admin.editPromoCode': 'Edit Promo Code',
    'admin.addNews': 'Add News',
    'admin.editNews': 'Edit News',
    'admin.confirmDelete': 'Are you sure you want to delete this?',
    'admin.productAdded': 'Product added successfully',
    'admin.productUpdated': 'Product updated successfully',
    'admin.productDeleted': 'Product deleted successfully',
    'admin.promoCodeAdded': 'Promo code added successfully',
    'admin.promoCodeUpdated': 'Promo code updated successfully',
    'admin.promoCodeDeleted': 'Promo code deleted successfully',
    'admin.newsAdded': 'News added successfully',
    'admin.newsUpdated': 'News updated successfully',
    'admin.newsDeleted': 'News deleted successfully',
    'admin.contentSaved': 'Content saved successfully',
    'admin.noChanges': 'No changes to save',
    'admin.mustBeLoggedIn': 'You must be logged in',
    'admin.failedToLoadPromoCodes': 'Failed to load promo codes',
    'admin.titleEnglish': 'Title (English)',
    'admin.titleArabic': 'Title (Arabic)',
    'admin.contentEnglish': 'Content (English)',
    'admin.contentArabic': 'Content (Arabic)',
    'admin.category': 'Category',
    'admin.publishNow': 'Publish Now',
    'admin.draft': 'Draft',
    'admin.published': 'Published',
    'admin.featured': 'Featured',
    'admin.saveAll': 'Save All',
    'admin.searchContent': 'Search content...',
    'admin.allCategories': 'All Categories',
    'admin.modified': 'Modified',
    'admin.englishText': 'English Text',
    'admin.arabicText': 'Arabic Text',
    'admin.noContentFound': 'No content found',
    
    // Filters
    'filters.title': 'Filter Products',
    'filters.priceRange': 'Price Range',
    'filters.upTo': 'Up to',
    'filters.categories': 'Categories',
    'filters.stores': 'Stores',
    'filters.clearAll': 'Clear All Filters',
    
    // Product Fields
    'product.title': 'Title',
    'product.description': 'Description',
    'product.imageUrl': 'Image URL',
    'product.category': 'Category',
    'product.customCategory': 'Custom Category',
    'product.customCategoryPlaceholder': 'Enter custom category (max 16 chars)',
    'product.currentPrice': 'Current Price',
    'product.originalPrice': 'Original Price',
    'product.currency': 'Currency',
    'product.originalCurrency': 'Original Currency',
    'product.store': 'Store',
    'product.productUrl': 'Product URL',
    'product.editProduct': 'Edit Product',
    
    // News Categories
    'news.announcement': 'Announcement',
    'news.feature': 'Feature',
    'news.update': 'Update',
    
    // Theme options
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
    
    // Languages
    'language.en': 'English',
    'language.ar': 'العربية',
    
    // Currencies
    'currency.USD': 'USD - US Dollar',
    'currency.SAR': 'SAR - Saudi Riyal',
    'currency.EGP': 'EGP - Egyptian Pound',
    'currency.AED': 'AED - UAE Dirham',

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
    
    // Products Page
    'products.myProducts': 'MY PRODUCTS',
    'products.featuredProducts': 'FEATURED PRODUCTS',
    'products.krolistSelections': 'KROLIST SELECTIONS',
    'products.expand': 'Expand',
    'products.collapse': 'Collapse',
    
    // UI Controls
    'ui.fontSize': 'Font Size',
    'ui.iconSize': 'Icon Size',
    'ui.display': 'Display',
    'ui.displayDesc': 'Customize font and icon sizes',
    'ui.small': 'Small',
    'ui.medium': 'Medium',
    'ui.large': 'Large',
    
    // Events
    'events.upcoming': 'Upcoming Events',

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
    
    // Dashboard/Analytics (continued)
    'dashboard.title': 'Analytics',
    'dashboard.description': 'Track your product prices and savings',
    'dashboard.totalValue': 'Total Value of Products',
    'dashboard.latestPriceChanges': 'Latest price changes',
    'dashboard.keyMetrics': 'Key metrics at a glance',
    
    // Analytics Extended
    'analytics.addProductsPrompt': 'Add products to view their analytics',
    'analytics.noRecentChanges': 'No recent price changes',
    'analytics.savings': 'Savings',
    'analytics.avgPerProduct': 'Avg/Product',
    'analytics.bestDeal': 'Best Deal',
    'analytics.efficiency': 'Efficiency',
    'analytics.deepInsights': 'Deep insights into your price tracking performance',
    'analytics.storeAnalysis': 'Store Analysis',
    'analytics.priceMovement': 'Price Movement Analysis',
    'analytics.priceMovementDesc': 'Track how prices have changed over different time periods',
    'analytics.increases': 'increases',
    'analytics.decreases': 'decreases',
    'analytics.stable': 'stable',
    'analytics.products': 'products',
    
    // User roles
    'user.admin': 'ADMIN',
    'user.user': 'USER',
    
    // Admin categories
    'admin.categories': 'Categories',
    'admin.loginMessages': 'Login Messages',
    
    // Shopping Cart
    'cart.itemsAdded': '{count} item(s) added to cart',
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
    'dashboard.totalAmount': 'المبلغ الإجمالي للمنتجات',
    'dashboard.watching': 'قيد المتابعة',
    'dashboard.recentAlerts': 'تغيير الأسعار الحديث',
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
    'products.delete': 'حذف',
    'products.currency': 'العملة',
    'products.refresh': 'تحديث',
    'products.edit': 'تعديل',
    'products.description': 'استمتع بجودة صوت غامرة مع إلغاء الضوضاء.',
    'products.updated': 'تم التحديث',
    'products.showHistory': 'عرض السجل',
    'products.priceDetails': 'تفاصيل السعر',
    'products.recordedHistory': 'سجل الأسعار المسجل خلال الـ 7 أشهر الماضية',
    'products.highest': 'الأعلى',
    'products.lowest': 'الأدنى',
    'products.original': 'الأصلي',
    'products.deleteSuccess': 'تم حذف المنتج بنجاح',
    'products.currencyChanged': 'تم تغيير العملة بنجاح',
    'products.editSuccess': 'تم تحديث المنتج بنجاح',
    'products.changeCurrency': 'تغيير العملة',
    'products.selectCurrency': 'اختر العملة لهذا المنتج',
    'products.editProduct': 'تعديل المنتج',
    'products.editDescription': 'قم بتحديث تفاصيل المنتج أدناه',
    'products.productTitle': 'عنوان المنتج',
    'products.enterTitle': 'أدخل عنوان المنتج',
    'products.productDescription': 'وصف المنتج',
    'products.enterDescription': 'أدخل وصف المنتج',
    'products.imageUrl': 'رابط الصورة',
    'products.enterImageUrl': 'أدخل رابط الصورة',
    'products.currentPrice': 'السعر الحالي',
    'products.enterPrice': 'أدخل السعر',
    
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
    
    // Products Page
    'products.myProducts': 'منتجاتي',
    'products.featuredProducts': 'منتجات مميزة',
    'products.krolistSelections': 'اختيارات كروليست',
    'products.expand': 'توسيع',
    'products.collapse': 'طي',
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
    'currency.SAR': 'ريال سعودي - SAR',
    'currency.EGP': 'جنيه مصري - EGP',
    'currency.AED': 'درهم إماراتي - AED',

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
    
    // Admin Dashboard
    'admin.dashboard': 'لوحة تحكم المسؤول',
    'admin.dashboardDesc': 'إدارة محتوى وإعدادات كروليست',
    'admin.accessDenied': 'الوصول مرفوض',
    'admin.accessDeniedDesc': 'تحتاج إلى صلاحيات المسؤول للوصول إلى هذه الصفحة',
    'admin.krolistProducts': 'منتجات كروليست',
    'admin.krolistProductsDesc': 'إدارة اختيارات المنتجات المنسقة لجميع المستخدمين',
    'admin.promoCodes': 'أكواد الخصم',
    'admin.krolistPromoCodes': 'أكواد خصم كروليست',
    'admin.krolistPromoCodesDesc': 'إدارة أكواد الخصم المرئية لجميع المستخدمين',
    'admin.newsUpdates': 'الأخبار والتحديثات',
    'admin.newsUpdatesDesc': 'إدارة الأخبار والإعلانات',
    'admin.shopManagement': 'إدارة المتاجر',
    'admin.shopManagementDesc': 'إدارة المتاجر المتاحة وروابط الشراكة',
    
    // Dashboard/Analytics (continued)
    'dashboard.title': 'التحليلات',
    'dashboard.description': 'تتبع أسعار منتجاتك ومدخراتك',
    'dashboard.totalValue': 'القيمة الإجمالية للمنتجات',
    'dashboard.latestPriceChanges': 'آخر تغييرات الأسعار',
    'dashboard.keyMetrics': 'المقاييس الرئيسية في لمحة',
    
    // Analytics Extended
    'analytics.addProductsPrompt': 'أضف منتجات لعرض تحليلاتها',
    'analytics.noRecentChanges': 'لا توجد تغييرات حديثة في الأسعار',
    'analytics.savings': 'التوفير',
    'analytics.avgPerProduct': 'المتوسط/منتج',
    'analytics.bestDeal': 'أفضل صفقة',
    'analytics.efficiency': 'الكفاءة',
    'analytics.deepInsights': 'رؤى عميقة حول أداء تتبع الأسعار',
    'analytics.storeAnalysis': 'تحليل المتاجر',
    'analytics.priceMovement': 'تحليل حركة الأسعار',
    'analytics.priceMovementDesc': 'تتبع كيف تغيرت الأسعار عبر فترات زمنية مختلفة',
    'analytics.increases': 'زيادات',
    'analytics.decreases': 'انخفاضات',
    'analytics.stable': 'مستقر',
    'analytics.products': 'منتجات',
    
    // User roles
    'user.admin': 'مسؤول',
    'user.user': 'مستخدم',
    
    // Admin categories
    'admin.categories': 'الفئات',
    'admin.loginMessages': 'رسائل تسجيل الدخول',
    
    // Shopping Cart
    'cart.itemsAdded': 'تمت إضافة {count} منتج إلى السلة',
  }
};

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  SAR: '﷼',
  EGP: 'E£',
  AED: 'د.إ'
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'en';
  });

  const [currency, setCurrency] = useState<Currency>(() => {
    return (localStorage.getItem('currency') as Currency) || 'SAR';
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