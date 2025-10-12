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
    affiliateTag: 'krolist07-21',
  },
  shein: {
    affiliateId: '83650433',
  }
};

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

async function scrapeAmazon(query: string): Promise<ScrapedProduct[]> {
  console.log(`Scraping Amazon for query: ${query}`);
  
  try {
    const searchUrl = `https://www.amazon.sa/s?k=${encodeURIComponent(query)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error(`Amazon request failed: ${response.status} - ${response.statusText}`);
      // Return a placeholder result directing to Amazon search
      return [{
        id: 'amazon-search',
        title: `Search for "${query}" on Amazon`,
        description: `Click to view ${query} results on Amazon`,
        image: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
        sellers: [{
          store: 'Amazon',
          price: 0,
          badge: 'Visit Amazon',
          productUrl: `https://www.amazon.sa/s?k=${encodeURIComponent(query)}&tag=${AFFILIATE_CONFIG.amazon.affiliateTag}`,
        }],
        bestPrice: 0,
      }];
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    if (!doc) {
      console.error('Failed to parse Amazon HTML');
      return [];
    }

    const products: ScrapedProduct[] = [];
    
    // Amazon uses data-asin attribute for product identification
    const productCards = doc.querySelectorAll('[data-asin]:not([data-asin=""])');
    
    console.log(`Found ${productCards.length} Amazon product cards`);

    for (let i = 0; i < Math.min(productCards.length, 20); i++) {
      const card = productCards[i];
      const asin = card.getAttribute('data-asin');
      
      if (!asin) continue;
      
      try {
        // Extract product data
        const titleEl = card.querySelector('h2 a span, .a-text-normal');
        const imageEl = card.querySelector('img.s-image');
        const priceEl = card.querySelector('.a-price .a-offscreen, .a-price-whole');
        const oldPriceEl = card.querySelector('.a-text-price .a-offscreen');
        
        if (!titleEl || !imageEl || !priceEl) {
          continue;
        }

        const title = titleEl.textContent?.trim() || '';
        const image = imageEl.getAttribute('src') || imageEl.getAttribute('data-src') || '';
        const priceText = priceEl.textContent?.replace(/[^\d.]/g, '') || '0';
        const price = parseFloat(priceText);
        const oldPriceText = oldPriceEl?.textContent?.replace(/[^\d.]/g, '') || '';
        const originalPrice = oldPriceText ? parseFloat(oldPriceText) : undefined;
        
        // Build affiliate URL with Amazon Associates tag
        const affiliateUrl = `https://www.amazon.sa/dp/${asin}?tag=${AFFILIATE_CONFIG.amazon.affiliateTag}`;
        
        // Check for Prime badge
        const primeEl = card.querySelector('[aria-label*="Prime"], .a-icon-prime');
        const badge = primeEl ? 'Prime' : undefined;

        if (title && price > 0) {
          products.push({
            id: asin,
            title,
            description: title,
            image: image.startsWith('data:') ? '' : image,
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
      } catch (err) {
        console.error(`Error parsing Amazon product card ${i}:`, err);
      }
    }

    // If no products found, return a search link
    if (products.length === 0) {
      return [{
        id: 'amazon-search',
        title: `Search for "${query}" on Amazon`,
        description: `Click to view ${query} results on Amazon`,
        image: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
        sellers: [{
          store: 'Amazon',
          price: 0,
          badge: 'Visit Amazon',
          productUrl: `https://www.amazon.sa/s?k=${encodeURIComponent(query)}&tag=${AFFILIATE_CONFIG.amazon.affiliateTag}`,
        }],
        bestPrice: 0,
      }];
    }

    console.log(`Successfully scraped ${products.length} products from Amazon`);
    return products;
    
  } catch (error) {
    console.error('Error scraping Amazon:', error);
    // Return search link as fallback
    return [{
      id: 'amazon-search',
      title: `Search for "${query}" on Amazon`,
      description: `Click to view ${query} results on Amazon`,
      image: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
      sellers: [{
        store: 'Amazon',
        price: 0,
        badge: 'Visit Amazon',
        productUrl: `https://www.amazon.sa/s?k=${encodeURIComponent(query)}&tag=${AFFILIATE_CONFIG.amazon.affiliateTag}`,
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
    const { query, stores = ['noon', 'amazon'] } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Scraping products for query: "${query}" from stores: ${stores.join(', ')}`);

    const results = await Promise.all([
      stores.includes('noon') ? scrapeNoon(query) : Promise.resolve([]),
      stores.includes('amazon') ? scrapeAmazon(query) : Promise.resolve([]),
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
