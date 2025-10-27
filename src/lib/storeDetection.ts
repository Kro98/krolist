import { getStoreByDomain, type StoreConfig } from '@/config/stores';

export interface StoreInfo {
  name: string;
  currency: string;
  icon?: string;
}

export function detectStoreFromUrl(url: string): StoreInfo {
  const store = getStoreByDomain(url);
  
  if (store) {
    return {
      name: store.name,
      currency: store.defaultCurrency,
      icon: store.icon
    };
  }
  
  // Fallback for unknown stores
  return { 
    name: 'Unknown Store', 
    currency: 'SAR' 
  };
}

export function isValidProductUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}
