// Affiliate link replacements
export const AFFILIATE_LINKS: Record<string, string> = {
  noon: 'https://s.noon.com/sLVK_sCBGo4',
  amazon: 'https://amzn.to/4ny9VLJ',
  shein: 'https://onelink.shein.com/17/535mkxhsd9a6',
};

export const AVAILABLE_SHOPS = [
  { id: 'noon', name: 'Noon' },
  { id: 'amazon', name: 'Amazon' },
  { id: 'shein', name: 'Shein' },
  { id: 'other', name: 'Other' },
];

export function replaceWithAffiliateLink(url: string): string {
  const urlLower = url.toLowerCase().trim();
  
  // Check if URL contains affiliate store names
  if (urlLower.includes('noon')) {
    return AFFILIATE_LINKS.noon;
  }
  if (urlLower.includes('amazon')) {
    return AFFILIATE_LINKS.amazon;
  }
  if (urlLower.includes('shein')) {
    return AFFILIATE_LINKS.shein;
  }
  
  // Return original URL if no affiliate match
  return url;
}
