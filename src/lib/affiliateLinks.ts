// Affiliate link replacements
const AFFILIATE_LINKS: Record<string, string> = {
  noon: 'https://www.noon.com/your-affiliate-link',
  amazon: 'https://www.amazon.sa/your-affiliate-link',
  shein: 'https://www.shein.com/your-affiliate-link',
};

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
