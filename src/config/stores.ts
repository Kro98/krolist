import { Currency } from "@/lib/currencyConversion";

// Import shop brand icons (only core stores - others added via admin)
import sheinIcon from "@/assets/shop-icons/shein-icon.png";
import noonIcon from "@/assets/shop-icons/noon-icon.png";
import amazonIcon from "@/assets/shop-icons/amazon-icon.png";

export interface StoreConfig {
  id: string;
  name: string;
  displayName: string;
  domains: string[];
  icon: string;
  affiliateUrl: string;
  affiliateTag?: string; // For stores that support search with affiliate tracking
  defaultCurrency: Currency;
  supportedCurrencies: Currency[];
  brandColor: string;
  enabled: boolean;
  comingSoon: boolean;
}

/**
 * ========================================
 * 🏪 STORE AFFILIATE CONFIGURATIONS
 * ========================================
 * 
 * To update affiliate links:
 * 1. Find the store below
 * 2. Update the `affiliateUrl` field
 * 3. Save the file
 * 
 * For detailed instructions: see src/config/README.md
 */

export const STORES: Record<string, StoreConfig> = {
  // ========================================
  // 🔗 SHEIN AFFILIATE CONFIGURATION
  // ========================================
  shein: {
    id: 'shein',
    name: 'SHEIN',
    displayName: 'SHEIN',
    domains: ['shein.com'],
    icon: sheinIcon,
    
    // 💰 AFFILIATE LINK - Update here when SHEIN link changes
    affiliateUrl: 'https://onelink.shein.com/17/535mkxhsd9a6',
    
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'SAR', 'AED', 'EGP'],
    brandColor: 'purple',
    enabled: true,
    comingSoon: false
  },
  
  // ========================================
  // 🔗 NOON AFFILIATE CONFIGURATION
  // ========================================
  noon: {
    id: 'noon',
    name: 'Noon',
    displayName: 'NOON',
    domains: ['noon.com'],
    icon: noonIcon,
    
    // 💰 AFFILIATE LINK - Update here when Noon link changes
    affiliateUrl: 'https://s.noon.com/sLVK_sCBGo4',
    
    defaultCurrency: 'SAR',
    supportedCurrencies: ['SAR', 'AED', 'EGP'],
    brandColor: 'orange',
    enabled: true,
    comingSoon: false
  },
  
  // ========================================
  // 🔗 AMAZON AFFILIATE CONFIGURATION
  // ========================================
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    displayName: 'Amazon',
    domains: ['amazon.sa', 'amazon.ae', 'amazon.com', 'amazon.co.uk'],
    icon: amazonIcon,
    
    // 💰 AFFILIATE LINK - General affiliate shortlink
    affiliateUrl: 'https://amzn.to/4ny9VLJ',
    
    // 💰 AFFILIATE TAG - Used for search URLs (format: amazon.sa/s?k=query&linkCode=sl2&tag=YOUR_TAG)
    affiliateTag: 'krolist07-21',
    
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'SAR', 'AED', 'EGP'],
    brandColor: 'blue',
    enabled: true,
    comingSoon: false
  }
};

// Get all enabled stores that are not coming soon
export const getEnabledStores = (): StoreConfig[] => {
  return Object.values(STORES).filter(store => store.enabled && !store.comingSoon);
};

// Get all stores including coming soon
export const getAllStores = (): StoreConfig[] => {
  return Object.values(STORES);
};

// Get store by ID
export const getStoreById = (id: string): StoreConfig | undefined => {
  const normalizedId = id.toLowerCase();
  return STORES[normalizedId];
};

// Get store by name (case insensitive)
export const getStoreByName = (name: string): StoreConfig | undefined => {
  const normalizedName = name.toLowerCase();
  return Object.values(STORES).find(store => 
    store.name.toLowerCase() === normalizedName || 
    store.displayName.toLowerCase() === normalizedName
  );
};

// Get store by domain
export const getStoreByDomain = (url: string): StoreConfig | undefined => {
  const urlLower = url.toLowerCase();
  return Object.values(STORES).find(store =>
    store.domains.some(domain => urlLower.includes(domain))
  );
};

// Get affiliate link for a store
export const getAffiliateLink = (storeIdOrName: string): string => {
  const store = getStoreById(storeIdOrName) || getStoreByName(storeIdOrName);
  return store?.affiliateUrl || `https://${storeIdOrName}.com`;
};

// Get affiliate tag for a store (used for search URLs)
export const getAffiliateTag = (storeIdOrName: string): string | undefined => {
  const store = getStoreById(storeIdOrName) || getStoreByName(storeIdOrName);
  return store?.affiliateTag;
};

// Get store icon
export const getStoreIcon = (storeIdOrName: string): string | undefined => {
  const store = getStoreById(storeIdOrName) || getStoreByName(storeIdOrName);
  return store?.icon;
};

// Get available shops for dropdown (for compatibility with old code)
export const getAvailableShops = () => {
  return [...getEnabledStores(), { id: 'other', name: 'Other', displayName: 'Other' }].map(store => ({
    id: store.id,
    name: store.name
  }));
};
