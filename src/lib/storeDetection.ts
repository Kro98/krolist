export interface StoreInfo {
  name: string;
  currency: string;
  icon?: string;
}

export function detectStoreFromUrl(url: string): StoreInfo {
  const urlLower = url.toLowerCase();
  
  // Noon
  if (urlLower.includes('noon.com')) {
    return { name: 'Noon', currency: 'SAR' };
  }
  
  // Amazon
  if (urlLower.includes('amazon.sa')) {
    return { name: 'Amazon', currency: 'SAR' };
  }
  if (urlLower.includes('amazon.ae')) {
    return { name: 'Amazon', currency: 'AED' };
  }
  if (urlLower.includes('amazon.com')) {
    return { name: 'Amazon', currency: 'USD' };
  }
  if (urlLower.includes('amazon.co.uk')) {
    return { name: 'Amazon', currency: 'GBP' };
  }
  
  // Other stores
  if (urlLower.includes('namshi.com')) {
    return { name: 'Namshi', currency: 'SAR' };
  }
  if (urlLower.includes('shein.com')) {
    return { name: 'SHEIN', currency: 'USD' };
  }
  if (urlLower.includes('ikea.com')) {
    return { name: 'IKEA', currency: 'SAR' };
  }
  if (urlLower.includes('abyat.com')) {
    return { name: 'Abyat', currency: 'SAR' };
  }
  if (urlLower.includes('trendyol.com')) {
    return { name: 'Trendyol', currency: 'SAR' };
  }
  if (urlLower.includes('asos.com')) {
    return { name: 'ASOS', currency: 'USD' };
  }
  
  // Default fallback
  return { name: 'Unknown Store', currency: 'SAR' };
}

export function isValidProductUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}
