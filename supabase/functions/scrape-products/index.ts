import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AFFILIATE_CONFIG = {
  noon: {
    baseUrl: 'https://s.noon.com/sLVK_sCBGo4',
  },
  amazon: {
    affiliateTag: Deno.env.get('AMAZON_PARTNER_TAG') || 'krolist07-21',
    accessKey: Deno.env.get('AMAZON_ACCESS_KEY'),
    secretKey: Deno.env.get('AMAZON_SECRET_KEY'),
  },
  shein: {
    affiliateId: '83650433',
  }
};

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

async function signAmazonRequest(
  method: string,
  host: string,
  path: string,
  queryString: string,
  payload: string,
  accessKey: string,
  secretKey: string,
  region: string = 'eu-west-1'
): Promise<{ authorization: string; amzDate: string; contentHash: string }> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  
  // Create canonical request
  const payloadHash = toHex(await sha256(payload));
  const canonicalHeaders = `host:${host}\nx-amz-date:${amzDate}\nx-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems\n`;
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

async function scrapeNoon(query: string): Promise<ScrapedProduct[]> {
  console.log(`Scraping Noon for query: ${query}`);
  
  try {
    const searchUrl = `https://www.noon.com/saudi-en/search/?q=${encodeURIComponent(query)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error(`Noon request failed: ${response.status}`);
      // Return a placeholder result directing to affiliate link
      return [{
        id: 'noon-affiliate',
        title: `Search for "${query}" on Noon`,
        description: `Click to view ${query} results on Noon`,
        image: 'https://z.nooncdn.com/s/app/com/noon/images/logos/noon-logo-en.svg',
        sellers: [{
          store: 'Noon',
          price: 0,
          badge: 'Visit Noon',
          productUrl: AFFILIATE_CONFIG.noon.baseUrl,
        }],
        bestPrice: 0,
      }];
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    if (!doc) {
      console.error('Failed to parse Noon HTML');
      return [];
    }

    const products: ScrapedProduct[] = [];
    
    // Noon uses specific selectors - these may need adjustment based on actual HTML structure
    const productCards = doc.querySelectorAll('[data-qa="product-card"], .productContainer, [class*="ProductCard"]');
    
    console.log(`Found ${productCards.length} Noon product cards`);

    for (let i = 0; i < Math.min(productCards.length, 20); i++) {
      const card = productCards[i];
      
      try {
        // Extract product data
        const titleEl = card.querySelector('[data-qa="product-name"], h3, [class*="title"]');
        const imageEl = card.querySelector('img');
        const priceEl = card.querySelector('[data-qa="product-price"], [class*="price"]:not([class*="old"])');
        const oldPriceEl = card.querySelector('[data-qa="product-oldPrice"], [class*="oldPrice"], [class*="was"]');
        const linkEl = card.querySelector('a[href*="/product/"]');
        
        if (!titleEl || !imageEl || !priceEl || !linkEl) {
          continue;
        }

        const title = titleEl.textContent?.trim() || '';
        const image = imageEl.getAttribute('src') || imageEl.getAttribute('data-src') || '';
        const priceText = priceEl.textContent?.replace(/[^\d.]/g, '') || '0';
        const price = parseFloat(priceText);
        const oldPriceText = oldPriceEl?.textContent?.replace(/[^\d.]/g, '') || '';
        const originalPrice = oldPriceText ? parseFloat(oldPriceText) : undefined;
        
        let productUrl = linkEl.getAttribute('href') || '';
        if (productUrl.startsWith('/')) {
          productUrl = `https://www.noon.com${productUrl}`;
        }
        
        // Extract product ID from URL
        const productIdMatch = productUrl.match(/\/([^\/]+)\/p\/?$/);
        const productId = productIdMatch ? productIdMatch[1] : `noon-${i}`;
        
        // Use affiliate link instead of direct product URL
        const affiliateUrl = AFFILIATE_CONFIG.noon.baseUrl;
        
        // Check for badges
        const badgeEl = card.querySelector('[class*="badge"], [class*="tag"]');
        const badge = badgeEl?.textContent?.trim();

        if (title && price > 0) {
          products.push({
            id: productId,
            title,
            description: title,
            image: image.startsWith('//') ? `https:${image}` : image,
            sellers: [{
              store: 'Noon',
              price,
              originalPrice,
              badge,
              productUrl: affiliateUrl,
            }],
            bestPrice: price,
          });
        }
      } catch (err) {
        console.error(`Error parsing Noon product card ${i}:`, err);
      }
    }

    // If no products were found, return affiliate link
    if (products.length === 0) {
      return [{
        id: 'noon-affiliate',
        title: `Search for "${query}" on Noon`,
        description: `Click to view ${query} results on Noon`,
        image: 'https://z.nooncdn.com/s/app/com/noon/images/logos/noon-logo-en.svg',
        sellers: [{
          store: 'Noon',
          price: 0,
          badge: 'Visit Noon',
          productUrl: AFFILIATE_CONFIG.noon.baseUrl,
        }],
        bestPrice: 0,
      }];
    }

    console.log(`Successfully scraped ${products.length} products from Noon`);
    return products;
    
  } catch (error) {
    console.error('Error scraping Noon:', error);
    // Return affiliate link as fallback
    return [{
      id: 'noon-affiliate',
      title: `Search for "${query}" on Noon`,
      description: `Click to view ${query} results on Noon`,
      image: 'https://z.nooncdn.com/s/app/com/noon/images/logos/noon-logo-en.svg',
      sellers: [{
        store: 'Noon',
        price: 0,
        badge: 'Visit Noon',
        productUrl: AFFILIATE_CONFIG.noon.baseUrl,
      }],
      bestPrice: 0,
    }];
  }
}

async function searchAmazonAPI(query: string): Promise<ScrapedProduct[]> {
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
      ItemCount: 10
    });
    
    const { authorization, amzDate, contentHash } = await signAmazonRequest(
      'POST',
      host,
      path,
      '',
      payload,
      accessKey,
      secretKey,
      region
    );
    
    const response = await fetch(`https://${host}${path}`, {
      method: 'POST',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json; charset=utf-8',
        'Host': host,
        'X-Amz-Date': amzDate,
        'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
        'Content-Encoding': 'amz-1.0'
      },
      body: payload
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Amazon PA-API request failed: ${response.status}`, errorText);
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
        const asin = item.ASIN;
        const title = item.ItemInfo?.Title?.DisplayValue || '';
        const image = item.Images?.Primary?.Large?.URL || '';
        
        const priceInfo = item.Offers?.Listings?.[0]?.Price;
        const savingsBasis = item.Offers?.Listings?.[0]?.SavingBasis;
        
        const price = priceInfo?.Amount || 0;
        const originalPrice = savingsBasis?.Amount;
        
        const affiliateUrl = `https://www.amazon.sa/dp/${asin}?tag=${affiliateTag}`;
        
        const isPrime = item.Offers?.Listings?.[0]?.DeliveryInfo?.IsPrimeEligible;
        const badge = isPrime ? 'Prime' : undefined;
        
        if (title && price > 0) {
          products.push({
            id: asin,
            title,
            description: title,
            image,
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
      }
    }
    
    console.log(`Successfully fetched ${products.length} products from Amazon PA-API`);
    return products;
    
  } catch (error) {
    console.error('Error calling Amazon PA-API:', error);
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
}

function mergeResults(noonProducts: ScrapedProduct[], amazonProducts: ScrapedProduct[]): ScrapedProduct[] {
  const merged: ScrapedProduct[] = [];
  const allProducts = [...noonProducts, ...amazonProducts];
  
  // For now, just combine them (could implement matching logic later)
  return allProducts;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, url, stores = ['noon', 'amazon'] } = await req.json();
    
    // If URL is provided, try to scrape that specific product
    if (url) {
      console.log(`Scraping single product URL: ${url}`);
      
      // Detect which store based on URL
      let storeProducts: ScrapedProduct[] = [];
      
      if (url.toLowerCase().includes('noon.com')) {
        storeProducts = await scrapeNoon(url);
      } else if (url.toLowerCase().includes('amazon')) {
        storeProducts = await scrapeAmazon(url);
      } else {
        // For unknown stores, return a basic structure
        console.log('Unknown store, returning basic structure');
        return new Response(
          JSON.stringify({ 
            success: true, 
            results: [],
            message: 'Store not supported for auto-fill. Please enter details manually.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, results: storeProducts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Original search query logic
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Scraping products for query: "${query}" from stores: ${stores.join(', ')}`);

    const results = await Promise.all([
      stores.includes('noon') ? scrapeNoon(query) : Promise.resolve([]),
      stores.includes('amazon') ? searchAmazonAPI(query) : Promise.resolve([]),
    ]);

    const noonProducts = results[0];
    const amazonProducts = results[1];
    const mergedProducts = mergeResults(noonProducts, amazonProducts);

    console.log(`Returning ${mergedProducts.length} total products`);

    return new Response(
      JSON.stringify({
        success: true,
        results: mergedProducts,
        count: mergedProducts.length,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in scrape-products function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to scrape products',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
