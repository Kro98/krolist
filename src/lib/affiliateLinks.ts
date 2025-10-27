import { getStoreByDomain, getAvailableShops, getAffiliateLink } from '@/config/stores';

// Legacy export for backwards compatibility
export const AVAILABLE_SHOPS = getAvailableShops();

// Legacy export for backwards compatibility
export const AFFILIATE_LINKS: Record<string, string> = {
  noon: getAffiliateLink('noon'),
  amazon: getAffiliateLink('amazon'),
  shein: getAffiliateLink('shein'),
};

export function replaceWithAffiliateLink(url: string): string {
  const store = getStoreByDomain(url);
  
  if (store) {
    return store.affiliateUrl;
  }
  
  // Return original URL if no affiliate match
  return url;
}
