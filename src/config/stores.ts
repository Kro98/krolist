import { Currency } from "@/lib/currencyConversion";

// Import shop brand icons
import sheinIcon from "@/assets/shop-icons/shein-icon.png";
import noonIcon from "@/assets/shop-icons/noon-icon.png";
import amazonIcon from "@/assets/shop-icons/amazon-icon.png";
import ikeaIcon from "@/assets/shop-icons/ikea-icon.png";
import abyatIcon from "@/assets/shop-icons/abyat-icon.png";
import namshiIcon from "@/assets/shop-icons/namshi-icon.png";
import trendyolIcon from "@/assets/shop-icons/trendyol-icon.png";
import asosIcon from "@/assets/shop-icons/asos-icon.png";

export interface StoreConfig {
  id: string;
  name: string;
  displayName: string;
  domains: string[];
  icon: string;
  affiliateUrl: string;
  defaultCurrency: Currency;
  supportedCurrencies: Currency[];
  brandColor: string;
  enabled: boolean;
  comingSoon: boolean;
}

export const STORES: Record<string, StoreConfig> = {
  shein: {
    id: 'shein',
    name: 'SHEIN',
    displayName: 'SHEIN',
    domains: ['shein.com'],
    icon: sheinIcon,
    affiliateUrl: 'https://onelink.shein.com/17/535mkxhsd9a6',
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'SAR', 'AED', 'EGP'],
    brandColor: 'purple',
    enabled: true,
    comingSoon: false
  },
  noon: {
    id: 'noon',
    name: 'Noon',
    displayName: 'NOON',
    domains: ['noon.com'],
    icon: noonIcon,
    affiliateUrl: 'https://s.noon.com/sLVK_sCBGo4',
    defaultCurrency: 'SAR',
    supportedCurrencies: ['SAR', 'AED', 'EGP'],
    brandColor: 'orange',
    enabled: true,
    comingSoon: false
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    displayName: 'Amazon',
    domains: ['amazon.sa', 'amazon.ae', 'amazon.com', 'amazon.co.uk'],
    icon: amazonIcon,
    affiliateUrl: 'https://amzn.to/4ny9VLJ',
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'SAR', 'AED', 'EGP'],
    brandColor: 'blue',
    enabled: true,
    comingSoon: false
  },
  ikea: {
    id: 'ikea',
    name: 'IKEA',
    displayName: 'IKEA',
    domains: ['ikea.com'],
    icon: ikeaIcon,
    affiliateUrl: 'https://www.ikea.com/ref/affiliate123',
    defaultCurrency: 'SAR',
    supportedCurrencies: ['SAR', 'AED', 'USD', 'EGP'],
    brandColor: 'yellow',
    enabled: true,
    comingSoon: true
  },
  abyat: {
    id: 'abyat',
    name: 'Abyat',
    displayName: 'ABYAT',
    domains: ['abyat.com'],
    icon: abyatIcon,
    affiliateUrl: 'https://www.abyat.com/?ref=affiliate123',
    defaultCurrency: 'SAR',
    supportedCurrencies: ['SAR', 'AED', 'EGP'],
    brandColor: 'red',
    enabled: true,
    comingSoon: true
  },
  namshi: {
    id: 'namshi',
    name: 'Namshi',
    displayName: 'NAMSHI',
    domains: ['namshi.com'],
    icon: namshiIcon,
    affiliateUrl: 'https://www.namshi.com/?ref=affiliate123',
    defaultCurrency: 'SAR',
    supportedCurrencies: ['SAR', 'AED'],
    brandColor: 'pink',
    enabled: true,
    comingSoon: true
  },
  trendyol: {
    id: 'trendyol',
    name: 'Trendyol',
    displayName: 'TRENDYOL',
    domains: ['trendyol.com'],
    icon: trendyolIcon,
    affiliateUrl: 'https://www.trendyol.com/?ref=affiliate123',
    defaultCurrency: 'SAR',
    supportedCurrencies: ['SAR', 'USD'],
    brandColor: 'orange',
    enabled: true,
    comingSoon: true
  },
  asos: {
    id: 'asos',
    name: 'ASOS',
    displayName: 'ASOS',
    domains: ['asos.com'],
    icon: asosIcon,
    affiliateUrl: 'https://www.asos.com/?ref=affiliate123',
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'SAR', 'AED', 'EGP'],
    brandColor: 'slate',
    enabled: true,
    comingSoon: true
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
