import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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

// Helper function to check daily search limit
async function checkSearchLimit(supabase: any, userId: string): Promise<{ allowed: boolean; remaining: number; resetAt?: string }> {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('search_logs')
    .select('searched_at')
    .eq('user_id', userId)
    .gte('searched_at', twentyFourHoursAgo.toISOString())
    .order('searched_at', { ascending: true });

  if (error) {
    console.error('Error checking search limit:', error);
    throw new Error('Failed to check search limit');
  }

  const searchCount = data?.length || 0;
  const remaining = Math.max(0, DAILY_SEARCH_LIMIT - searchCount);
  
  let resetAt;
  if (searchCount > 0 && data) {
    const firstSearchTime = new Date(data[0].searched_at);
    resetAt = new Date(firstSearchTime.getTime() + 24 * 60 * 60 * 1000).toISOString();
  }

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

    const { query } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
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
    console.log(`Searching products for query: "${query}"`);
    
    const amazonProducts = await searchAmazonAPI(query);
    
    // Log the search (without IP address for privacy)
    await logSearch(supabase, user.id, query);
    
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
        error: 'Failed to search products',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});