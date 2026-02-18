import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AFFILIATE_CONFIG = {
  amazon: {
    affiliateTag: Deno.env.get('AMAZON_PARTNER_TAG') || 'krolist07-21',
    accessKey: Deno.env.get('AMAZON_ACCESS_KEY'),
    secretKey: Deno.env.get('AMAZON_SECRET_KEY'),
  }
};

const DAILY_SEARCH_LIMIT = 5;

// Amazon PA-API helpers
async function sha256(message: string): Promise<ArrayBuffer> {
  const msgBuffer = new TextEncoder().encode(message);
  return await crypto.subtle.digest('SHA-256', msgBuffer);
}

async function hmacSha256(key: ArrayBuffer | string, message: string): Promise<ArrayBuffer> {
  const keyData = typeof key === 'string' ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const messageBuffer = new TextEncoder().encode(message);
  return await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Extract ASIN from various Amazon URL formats
function extractASIN(url: string): string | null {
  // Match patterns like /dp/ASIN, /gp/product/ASIN, /gp/aw/d/ASIN
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/gp\/aw\/d\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
    /\?.*asin=([A-Z0-9]{10})/i,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Check if URL is an Amazon product URL
function isAmazonProductUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return /amazon\.(com|sa|ae|co\.uk|de|fr|es|it|ca|com\.au|in|jp|com\.mx|com\.br|nl|sg|eg)/i.test(parsedUrl.hostname);
  } catch {
    return false;
  }
}

async function signAmazonRequest(
  method: string,
  host: string,
  path: string,
  queryString: string,
  payload: string,
  accessKey: string,
  secretKey: string,
  region: string = 'eu-west-1',
  apiTarget: string = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems'
): Promise<{ authorization: string; amzDate: string; contentHash: string }> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  
  // Create canonical request
  const payloadHash = toHex(await sha256(payload));
  const canonicalHeaders = `host:${host}\nx-amz-date:${amzDate}\nx-amz-target:${apiTarget}\n`;
  const signedHeaders = 'host;x-amz-date;x-amz-target';
  const canonicalRequest = `${method}\n${path}\n${queryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  
  // Create string to sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/ProductAdvertisingAPI/aws4_request`;
  const canonicalRequestHash = toHex(await sha256(canonicalRequest));
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;
  
  // Calculate signature
  const kDate = await hmacSha256(`AWS4${secretKey}`, dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, 'ProductAdvertisingAPI');
  const kSigning = await hmacSha256(kService, 'aws4_request');
  const signature = toHex(await hmacSha256(kSigning, stringToSign));
  
  const authorization = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return { authorization, amzDate, contentHash: payloadHash };
}

interface ScrapedProduct {
  id: string;
  title: string;
  description: string;
  image: string;
  sellers: Array<{
    store: string;
    price: number;
    originalPrice?: number;
    badge?: string;
    productUrl: string;
  }>;
  bestPrice: number;
}

// Helper function to check daily search limit (calendar day based)
async function checkSearchLimit(supabase: any, userId: string): Promise<{ allowed: boolean; remaining: number; resetAt?: string }> {
  // Use calendar day instead of rolling 24-hour window
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('search_logs')
    .select('searched_at')
    .eq('user_id', userId)
    .gte('searched_at', today.toISOString())
    .order('searched_at', { ascending: true });

  if (error) {
    console.error('Error checking search limit:', error);
    throw new Error('Failed to check search limit');
  }

  const searchCount = data?.length || 0;
  const remaining = Math.max(0, DAILY_SEARCH_LIMIT - searchCount);
  
  // Calculate reset time (midnight of next day)
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const resetAt = tomorrow.toISOString();

  return {
    allowed: searchCount < DAILY_SEARCH_LIMIT,
    remaining,
    resetAt
  };
}

// Helper function to log search
async function logSearch(supabase: any, userId: string, query: string) {
  const { error } = await supabase
    .from('search_logs')
    .insert({
      user_id: userId,
      search_query: query
    });

  if (error) {
    console.error('Error logging search:', error);
  }
}

// Get single item by ASIN using GetItems API
async function getAmazonItemByASIN(asin: string, retryCount = 0): Promise<{ product: ScrapedProduct | null; error?: string; errorCode?: string }> {
  console.log(`Fetching Amazon product by ASIN: ${asin}`);
  
  const { accessKey, secretKey, affiliateTag } = AFFILIATE_CONFIG.amazon;
  
  if (!accessKey || !secretKey) {
    console.error('Amazon API credentials not configured');
    return { product: null, error: 'Amazon API credentials not configured', errorCode: 'NO_CREDENTIALS' };
  }
  
  try {
    const host = 'webservices.amazon.sa';
    const path = '/paapi5/getitems';
    const region = 'eu-west-1';
    const apiTarget = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems';
    
    const payload = JSON.stringify({
      ItemIds: [asin],
      PartnerTag: affiliateTag,
      PartnerType: 'Associates',
      Marketplace: 'www.amazon.sa',
      Resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'ItemInfo.Features',
        'Offers.Listings.Price',
        'Offers.Listings.SavingBasis',
        'Offers.Listings.DeliveryInfo.IsPrimeEligible'
      ]
    });
    
    const { authorization, amzDate } = await signAmazonRequest(
      'POST',
      host,
      path,
      '',
      payload,
      accessKey,
      secretKey,
      region,
      apiTarget
    );
    
    const response = await fetch(`https://${host}${path}`, {
      method: 'POST',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json; charset=utf-8',
        'Host': host,
        'X-Amz-Date': amzDate,
        'X-Amz-Target': apiTarget,
        'Content-Encoding': 'amz-1.0'
      },
      body: payload
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Amazon PA-API GetItems failed: ${response.status}`, errorText);
      
      // Handle rate limiting with exponential backoff
      if (response.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Rate limited. Retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return getAmazonItemByASIN(asin, retryCount + 1);
      }
      
      // Handle eligibility error specifically
      if (response.status === 403 && errorText.includes('AssociateNotEligible')) {
        return { 
          product: null, 
          error: 'Amazon API access is temporarily unavailable. Please enter product details manually.',
          errorCode: 'API_NOT_ELIGIBLE'
        };
      }
      
      return { product: null, error: `Amazon API error: ${response.status}`, errorCode: 'API_ERROR' };
    }
    
    const data = await response.json();
    console.log('Amazon PA-API GetItems response:', JSON.stringify(data, null, 2));
    
    if (data.ItemsResult?.Items?.[0]) {
      const item = data.ItemsResult.Items[0];
      const rawTitle = String(item.ItemInfo?.Title?.DisplayValue || '').substring(0, 500).trim();
      const rawImage = String(item.Images?.Primary?.Large?.URL || '').substring(0, 1000);
      
      const priceInfo = item.Offers?.Listings?.[0]?.Price;
      const savingsBasis = item.Offers?.Listings?.[0]?.SavingBasis;
      
      const price = parseFloat(priceInfo?.Amount) || 0;
      const originalPrice = savingsBasis?.Amount ? parseFloat(savingsBasis.Amount) : undefined;
      
      const affiliateUrl = `https://www.amazon.sa/dp/${asin}?tag=${affiliateTag}`;
      const isPrime = item.Offers?.Listings?.[0]?.DeliveryInfo?.IsPrimeEligible;
      
      return {
        product: {
          id: asin,
          title: rawTitle,
          description: rawTitle,
          image: rawImage,
          sellers: [{
            store: 'Amazon',
            price,
            originalPrice,
            badge: isPrime ? 'Prime' : undefined,
            productUrl: affiliateUrl,
          }],
          bestPrice: price,
        }
      };
    }
    
    return { product: null, error: 'Product not found on Amazon', errorCode: 'NOT_FOUND' };
  } catch (error) {
    console.error('Error calling Amazon PA-API GetItems:', error);
    return { product: null, error: 'Failed to connect to Amazon API', errorCode: 'CONNECTION_ERROR' };
  }
}

// ============= Free HTML scraper fallback for auto-fill =============
function extractProductDetailsFromHtml(html: string, url: string): { title: string; description: string; image: string; price: number; originalPrice?: number } | null {
  // Extract title
  let title = '';
  const titlePatterns = [
    /id="productTitle"[^>]*>\s*([^<]+)/s,
    /id="title"[^>]*>\s*([^<]+)/s,
    /<title[^>]*>([^<]+)/,
    /"name"\s*:\s*"([^"]+)"/,
  ];
  for (const p of titlePatterns) {
    const m = html.match(p);
    if (m && m[1].trim().length > 5) {
      title = m[1].trim().replace(/\s+/g, ' ');
      title = title.replace(/\s*[-–|:]\s*Amazon\.\w+.*$/i, '').trim();
      if (title.length > 200) title = title.substring(0, 199) + '...';
      break;
    }
  }

  // Extract description from feature bullets or product description
  let description = '';
  const descPatterns = [
    // Feature bullets
    /id="feature-bullets"[^>]*>.*?<ul[^>]*>(.*?)<\/ul>/s,
    // Product description
    /id="productDescription"[^>]*>.*?<p[^>]*>([^<]+)/s,
    // Meta description
    /meta\s+name="description"\s+content="([^"]+)"/i,
    // JSON-LD description
    /"description"\s*:\s*"([^"]{10,})"/,
  ];
  for (const p of descPatterns) {
    const m = html.match(p);
    if (m && m[1]) {
      // Clean HTML tags from bullet points
      description = m[1]
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (description.length > 500) description = description.substring(0, 497) + '...';
      if (description.length > 10) break;
    }
  }

  // Extract image
  let image = '';
  const imagePatterns = [
    /id="landingImage"[^>]*src="([^"]+)"/,
    /id="imgBlkFront"[^>]*src="([^"]+)"/,
    /id="main-image"[^>]*src="([^"]+)"/,
    /"hiRes"\s*:\s*"([^"]+)"/,
    /"large"\s*:\s*"([^"]+images\/I\/[^"]+)"/,
    /data-old-hires="([^"]+)"/,
    /class="a-dynamic-image"[^>]*src="([^"]+)"/,
    // Mobile patterns
    /id="main-image-widget"[^>]*>.*?<img[^>]*src="([^"]+)"/s,
    /id="aw-image-wrapper"[^>]*>.*?<img[^>]*src="([^"]+)"/s,
    /<img[^>]*id="[^"]*[Ii]mage[^"]*"[^>]*src="([^"]+)"/,
    // OG image (reliable fallback)
    /<meta\s+property="og:image"\s+content="([^"]+)"/i,
    /<meta\s+content="([^"]+)"\s+property="og:image"/i,
    // Any Amazon product image
    /src="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/,
    /src="(https:\/\/images-na\.ssl-images-amazon\.com\/images\/I\/[^"]+)"/,
  ];
  for (const p of imagePatterns) {
    const m = html.match(p);
    if (m && m[1] && m[1].startsWith('http')) {
      image = m[1];
      break;
    }
  }

  // Extract price
  const pricePatterns = [
    /class="a-price-whole"[^>]*>([0-9,\.]+)<.*?class="a-price-fraction"[^>]*>(\d+)</s,
    /corePriceDisplay_desktop_feature_div.*?class="a-price-whole"[^>]*>([0-9,\.]+)<.*?class="a-price-fraction"[^>]*>(\d+)</s,
    /class="a-offscreen"[^>]*>\s*(?:SAR|AED|USD|€|\$|£)?\s*([0-9,]+\.?\d*)/,
    /id="priceblock_ourprice"[^>]*>(?:SAR|AED|USD|€|\$|£)?\s*([0-9,]+\.?\d*)/,
    /id="priceblock_dealprice"[^>]*>(?:SAR|AED|USD|€|\$|£)?\s*([0-9,]+\.?\d*)/,
    /"price"\s*:\s*"?([0-9,]+\.?\d*)"?/,
  ];

  let price = 0;
  for (const pattern of pricePatterns) {
    const m = html.match(pattern);
    if (m) {
      if (m[2]) {
        price = parseFloat(m[1].replace(/,/g, '') + '.' + m[2]);
      } else {
        price = parseFloat(m[1].replace(/,/g, ''));
      }
      if (price > 0) break;
    }
  }

  // Extract original/strikethrough price
  let originalPrice: number | undefined;
  const origPatterns = [
    /class="a-text-price"[^>]*>.*?class="a-offscreen"[^>]*>(?:SAR|AED|USD|€|\$|£)?\s*([0-9,]+\.?\d*)/s,
    /class="a-price a-text-price"[^>]*>.*?class="a-offscreen"[^>]*>(?:SAR|AED|USD|€|\$|£)?\s*([0-9,]+\.?\d*)/s,
    /"listPrice"\s*:\s*"?([0-9,]+\.?\d*)"?/,
  ];
  for (const pattern of origPatterns) {
    const m = html.match(pattern);
    if (m) {
      const op = parseFloat(m[1].replace(/,/g, ''));
      if (op > price) { originalPrice = op; break; }
    }
  }

  if (!title && price <= 0) return null;

  return { title, description, image, price, originalPrice };
}

async function scrapeAmazonProductForAutoFill(productUrl: string): Promise<{ title: string; description: string; image: string; price: number; originalPrice?: number; productUrl: string } | null> {
  const asin = extractASIN(productUrl);
  let domain = 'www.amazon.sa';
  try { domain = new URL(productUrl).hostname; } catch {}

  // Try mobile URL first (less blocking), then desktop
  const urls: string[] = [];
  if (asin) {
    urls.push(`https://${domain}/gp/aw/d/${asin}`);
    urls.push(`https://${domain}/dp/${asin}`);
  } else {
    urls.push(productUrl);
  }

  const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
  const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

  for (const scrapeUrl of urls) {
    const isMobile = scrapeUrl.includes('/gp/aw/d/');
    
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log(`[AutoFill Scraper] Attempt ${attempt + 1} (${isMobile ? 'mobile' : 'desktop'}) for: ${scrapeUrl}`);
        
        const response = await fetch(scrapeUrl, {
          method: 'GET',
          headers: {
            'User-Agent': isMobile ? mobileUA : desktopUA,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Accept-Encoding': 'identity',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'Referer': `https://${domain}/`,
          },
          redirect: 'follow',
        });

        if (!response.ok) {
          await response.text();
          await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
          continue;
        }

        const html = await response.text();
        if (html.length < 3000) {
          console.log(`[AutoFill Scraper] Response too short (${html.length} chars)`);
          await new Promise(r => setTimeout(r, 4000 * (attempt + 1)));
          continue;
        }

        const result = extractProductDetailsFromHtml(html, scrapeUrl);
        if (result && (result.title || result.price > 0)) {
          const affiliateTag = Deno.env.get('AMAZON_PARTNER_TAG') || 'krolist07-21';
          const cleanUrl = asin ? `https://${domain}/dp/${asin}?tag=${affiliateTag}` : productUrl;
          
          console.log(`[AutoFill Scraper] ✓ Title: ${result.title.substring(0, 50)}..., Price: ${result.price}`);
          return {
            title: result.title,
            description: result.description,
            image: result.image,
            price: result.price,
            originalPrice: result.originalPrice,
            productUrl: cleanUrl,
          };
        }

        console.log(`[AutoFill Scraper] Could not extract details (attempt ${attempt + 1})`);
        await new Promise(r => setTimeout(r, 3000));
      } catch (error) {
        console.error(`[AutoFill Scraper] Error:`, error);
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  return null;
}

async function searchAmazonAPI(query: string, retryCount = 0): Promise<ScrapedProduct[]> {
  console.log(`Searching Amazon PA-API for query: ${query}`);
  
  const { accessKey, secretKey, affiliateTag } = AFFILIATE_CONFIG.amazon;
  
  if (!accessKey || !secretKey) {
    console.error('Amazon API credentials not configured');
    return [{
      id: 'amazon-search',
      title: `Search for "${query}" on Amazon`,
      description: `Click to view ${query} results on Amazon`,
      image: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
      sellers: [{
        store: 'Amazon',
        price: 0,
        badge: 'Visit Amazon',
        productUrl: `https://www.amazon.sa/s?k=${encodeURIComponent(query)}&tag=${affiliateTag}`,
      }],
      bestPrice: 0,
    }];
  }
  
  try {
    const host = 'webservices.amazon.sa';
    const path = '/paapi5/searchitems';
    const region = 'eu-west-1';
    const apiTarget = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems';
    
    const payload = JSON.stringify({
      Keywords: query,
      PartnerTag: affiliateTag,
      PartnerType: 'Associates',
      Marketplace: 'www.amazon.sa',
      Resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'Offers.Listings.Price',
        'Offers.Listings.SavingBasis'
      ],
      ItemCount: 5 // Reduced to conserve API quota
    });
    
    const { authorization, amzDate } = await signAmazonRequest(
      'POST',
      host,
      path,
      '',
      payload,
      accessKey,
      secretKey,
      region,
      apiTarget
    );
    
    const response = await fetch(`https://${host}${path}`, {
      method: 'POST',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json; charset=utf-8',
        'Host': host,
        'X-Amz-Date': amzDate,
        'X-Amz-Target': apiTarget,
        'Content-Encoding': 'amz-1.0'
      },
      body: payload
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Amazon PA-API request failed: ${response.status}`, errorText);
      
      // Handle rate limiting with exponential backoff
      if (response.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited. Retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return searchAmazonAPI(query, retryCount + 1);
      }
      
      // Return fallback for rate limiting
      if (response.status === 429) {
        console.log('Amazon rate limit exceeded, returning fallback search link');
        return [{
          id: 'amazon-fallback',
          title: 'Search on Amazon',
          description: 'Amazon API rate limit reached. Click to search directly on Amazon.',
          image: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
          sellers: [{
            store: 'Amazon',
            price: 0,
            productUrl: `https://www.amazon.sa/s?k=${encodeURIComponent(query)}&tag=${affiliateTag}`
          }],
          bestPrice: 0
        }];
      }
      
      return [{
        id: 'amazon-search',
        title: `Search for "${query}" on Amazon`,
        description: `Click to view ${query} results on Amazon`,
        image: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
        sellers: [{
          store: 'Amazon',
          price: 0,
          badge: 'Visit Amazon',
          productUrl: `https://www.amazon.sa/s?k=${encodeURIComponent(query)}&tag=${affiliateTag}`,
        }],
        bestPrice: 0,
      }];
    }
    
    const data = await response.json();
    console.log('Amazon PA-API response:', JSON.stringify(data, null, 2));
    
    const products: ScrapedProduct[] = [];
    
    if (data.SearchResult?.Items) {
      for (const item of data.SearchResult.Items) {
        try {
          const asin = item.ASIN;
          // Sanitize and validate title - limit length and strip potentially dangerous content
          const rawTitle = String(item.ItemInfo?.Title?.DisplayValue || '').substring(0, 500).trim();
          const rawImage = String(item.Images?.Primary?.Large?.URL || '').substring(0, 1000);
          
          const priceInfo = item.Offers?.Listings?.[0]?.Price;
          const savingsBasis = item.Offers?.Listings?.[0]?.SavingBasis;
          
          const price = parseFloat(priceInfo?.Amount) || 0;
          const originalPrice = savingsBasis?.Amount ? parseFloat(savingsBasis.Amount) : undefined;
          
          const affiliateUrl = `https://www.amazon.sa/dp/${asin}?tag=${affiliateTag}`;
          
          const isPrime = item.Offers?.Listings?.[0]?.DeliveryInfo?.IsPrimeEligible;
          const badge = isPrime ? 'Prime' : undefined;
          
          // Only add valid products with title and positive price
          if (rawTitle && price > 0 && asin) {
            products.push({
              id: asin,
              title: rawTitle,
              description: rawTitle, // Use title as description
              image: rawImage,
              sellers: [{
                store: 'Amazon',
                price,
                originalPrice,
                badge,
                productUrl: affiliateUrl,
              }],
              bestPrice: price,
            });
          }
        } catch (itemError) {
          console.error('Error processing product item:', itemError);
          // Continue to next item if one fails
          continue;
        }
      }
    }
    
    console.log(`Successfully fetched ${products.length} products from Amazon PA-API`);
    return products;
    
  } catch (error) {
    console.error('Error calling Amazon PA-API:', error);
    return [{
      id: 'amazon-error',
      title: 'Search on Amazon',
      description: 'Unable to fetch results. Click to search directly on Amazon.',
      image: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
      sellers: [{
        store: 'Amazon',
        price: 0,
        productUrl: `https://www.amazon.sa/s?k=${encodeURIComponent(query)}&tag=${affiliateTag}`
      }],
      bestPrice: 0
    }];
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required to search products' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    
    // Check if this is a direct ASIN lookup request (for auto-fill)
    const isAutoFillRequest = body.autoFill === true && body.url;
    
    if (isAutoFillRequest) {
      // Direct ASIN lookup for auto-fill feature
      const url = body.url;
      
      if (!isAmazonProductUrl(url)) {
        return new Response(
          JSON.stringify({ error: 'Not a valid Amazon product URL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const asin = extractASIN(url);
      if (!asin) {
        return new Response(
          JSON.stringify({ error: 'Could not extract ASIN from URL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`Auto-fill request for ASIN: ${asin}`);
      
      // Try PA-API first
      const result = await getAmazonItemByASIN(asin);
      
      if (result.product) {
        // PA-API succeeded
        const seller = result.product.sellers[0];
        return new Response(
          JSON.stringify({
            success: true,
            source: 'pa-api',
            product: {
              title: result.product.title,
              description: result.product.description || '',
              image: result.product.image,
              price: seller.price,
              originalPrice: seller.originalPrice,
              productUrl: seller.productUrl,
              store: 'Amazon',
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      // PA-API failed — try free scraper fallback
      console.log(`[AutoFill] PA-API failed (${result.errorCode}), trying scraper fallback...`);
      
      const scraperResult = await scrapeAmazonProductForAutoFill(url);
      
      if (scraperResult && (scraperResult.title || scraperResult.price > 0)) {
        return new Response(
          JSON.stringify({
            success: true,
            source: 'scraper',
            product: {
              title: scraperResult.title,
              description: scraperResult.description || '',
              image: scraperResult.image,
              price: scraperResult.price,
              originalPrice: scraperResult.originalPrice,
              productUrl: scraperResult.productUrl,
              store: 'Amazon',
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      // Both methods failed
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Could not fetch product details from Amazon (PA-API and scraper both failed)',
          errorCode: result.errorCode || 'SCRAPER_FAILED',
          suggestion: 'Please enter product details manually'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate request - accept either query or url
    const requestSchema = z.union([
      z.object({
        query: z.string()
          .trim()
          .min(2, 'Query must be at least 2 characters')
          .max(200, 'Query must not exceed 200 characters'),
        url: z.string().optional()
      }),
      z.object({
        url: z.string().url('Invalid URL'),
        query: z.string().optional()
      })
    ]);

    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request', 
          details: validationResult.error.issues 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query, url } = validationResult.data;
    
    // Extract search term from URL if provided, otherwise use query
    let searchQuery = query;
    if (url) {
      // Extract ASIN from Amazon URL or product name
      const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/i) || url.match(/\/gp\/product\/([A-Z0-9]{10})/i);
      if (asinMatch) {
        searchQuery = asinMatch[1]; // Use ASIN as search query
      } else {
        // Extract keywords from URL
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(p => p && !['dp', 'gp', 'product'].includes(p));
        searchQuery = pathParts.join(' ').replace(/-/g, ' ').trim() || 'product';
      }
    }
    
    if (!searchQuery) {
      return new Response(
        JSON.stringify({ error: 'Either query or url must be provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check daily search limit
    const limitCheck = await checkSearchLimit(supabase, user.id);
    
    if (!limitCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Daily search limit reached',
          message: `You have reached your daily limit of ${DAILY_SEARCH_LIMIT} searches. Please try again after ${new Date(limitCheck.resetAt!).toLocaleString()}.`,
          resetAt: limitCheck.resetAt,
          limit: DAILY_SEARCH_LIMIT
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': DAILY_SEARCH_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': limitCheck.resetAt!
          } 
        }
      );
    }

    // Search for products from Amazon only
    console.log(`Searching products for query: "${searchQuery}"`);
    
    const amazonProducts = await searchAmazonAPI(searchQuery);
    
    // Log the search (without IP address for privacy)
    await logSearch(supabase, user.id, url || searchQuery);
    
    // Get updated search limit info
    const updatedLimitCheck = await checkSearchLimit(supabase, user.id);
    
    console.log(`Returning ${amazonProducts.length} products. Searches remaining: ${updatedLimitCheck.remaining}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        results: amazonProducts,
        count: amazonProducts.length
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': DAILY_SEARCH_LIMIT.toString(),
          'X-RateLimit-Remaining': updatedLimitCheck.remaining.toString(),
          'X-RateLimit-Reset': updatedLimitCheck.resetAt || ''
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in scrape-products function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An internal error occurred while searching products. Please try again later.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});