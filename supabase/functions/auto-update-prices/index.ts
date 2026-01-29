import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// ============= Amazon PA-API helpers =============
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

function extractASIN(url: string): string | null {
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
  apiTarget: string = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems'
): Promise<{ authorization: string; amzDate: string }> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  
  const payloadHash = toHex(await sha256(payload));
  const canonicalHeaders = `host:${host}\nx-amz-date:${amzDate}\nx-amz-target:${apiTarget}\n`;
  const signedHeaders = 'host;x-amz-date;x-amz-target';
  const canonicalRequest = `${method}\n${path}\n${queryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/ProductAdvertisingAPI/aws4_request`;
  const canonicalRequestHash = toHex(await sha256(canonicalRequest));
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;
  
  const kDate = await hmacSha256(`AWS4${secretKey}`, dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, 'ProductAdvertisingAPI');
  const kSigning = await hmacSha256(kService, 'aws4_request');
  const signature = toHex(await hmacSha256(kSigning, stringToSign));
  
  const authorization = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return { authorization, amzDate };
}

// Get price for a single Amazon product by ASIN
async function getAmazonPrice(asin: string): Promise<{ price: number; originalPrice?: number } | null> {
  const { accessKey, secretKey, affiliateTag } = AFFILIATE_CONFIG.amazon;
  
  if (!accessKey || !secretKey) {
    console.log('Amazon API credentials not configured');
    return null;
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
        'Offers.Listings.Price',
        'Offers.Listings.SavingBasis'
      ]
    });
    
    const { authorization, amzDate } = await signAmazonRequest(
      'POST', host, path, '', payload, accessKey, secretKey, region, apiTarget
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
      console.error(`Amazon PA-API failed for ASIN ${asin}: ${response.status}`, errorText);
      return null;
    }
    
    const data = await response.json();
    
    if (data.ItemsResult?.Items?.[0]) {
      const item = data.ItemsResult.Items[0];
      const priceInfo = item.Offers?.Listings?.[0]?.Price;
      const savingsBasis = item.Offers?.Listings?.[0]?.SavingBasis;
      
      const price = parseFloat(priceInfo?.Amount) || 0;
      const originalPrice = savingsBasis?.Amount ? parseFloat(savingsBasis.Amount) : undefined;
      
      if (price > 0) {
        return { price, originalPrice };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error calling Amazon PA-API:', error);
    return null;
  }
}

// Get price using Firecrawl scraping
async function getFirecrawlPrice(url: string, firecrawlApiKey: string): Promise<number | null> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: [{ 
          type: 'json', 
          prompt: 'Extract the current price of the product. Return only the numeric value without currency symbols.',
          schema: {
            type: 'object',
            properties: {
              price: { 
                type: ['number', 'string'],
                description: 'The current price of the product'
              }
            },
            required: ['price']
          }
        }],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    });

    if (!response.ok) {
      console.error(`Firecrawl failed for ${url}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Try different response paths
    const rawPrice = data?.data?.json?.price 
      ?? data?.data?.extract?.price 
      ?? data?.json?.price
      ?? data?.extract?.price;
    
    if (rawPrice !== null && rawPrice !== undefined) {
      if (typeof rawPrice === 'number') return rawPrice;
      if (typeof rawPrice === 'string') {
        const match = rawPrice.match(/[\d,]+\.?\d*/);
        if (match) {
          return parseFloat(match[0].replace(/,/g, ''));
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Firecrawl error for ${url}:`, error);
    return null;
  }
}

interface Product {
  id: string;
  product_url: string;
  current_price: number;
  original_price: number;
  title: string;
  store: string;
  currency: string;
}

interface UpdateResult {
  id: string;
  title: string;
  oldPrice: number;
  newPrice: number;
  source: 'amazon' | 'firecrawl';
  success: boolean;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.error('Admin check failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { collection_title } = await req.json().catch(() => ({}));

    console.log('[Auto-Update] Starting price auto-update for:', collection_title || 'ALL collections');

    // Build query for krolist products
    let query = supabase
      .from('krolist_products')
      .select('id, product_url, current_price, original_price, title, store, currency')
      .eq('is_featured', true);

    if (collection_title && collection_title !== 'all') {
      query = query.eq('collection_title', collection_title);
    }

    const { data: products, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }

    console.log(`[Auto-Update] Found ${products?.length || 0} products to update`);

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          updated: 0, 
          failed: 0,
          skipped: 0,
          message: 'No products found to update'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Background task for price updates
    const backgroundTask = async () => {
      const results: UpdateResult[] = [];
      let updated = 0;
      let failed = 0;
      let skipped = 0;
      const priceHistoryRecords: any[] = [];

      for (const product of products as Product[]) {
        const result: UpdateResult = {
          id: product.id,
          title: product.title,
          oldPrice: product.current_price,
          newPrice: 0,
          source: 'firecrawl',
          success: false
        };

        try {
          let newPrice: number | null = null;
          let source: 'amazon' | 'firecrawl' = 'firecrawl';

          // Try Amazon PA-API first for Amazon products
          if (isAmazonProductUrl(product.product_url)) {
            const asin = extractASIN(product.product_url);
            if (asin) {
              console.log(`[Auto-Update] Trying Amazon PA-API for ${product.title} (ASIN: ${asin})`);
              const amazonResult = await getAmazonPrice(asin);
              if (amazonResult && amazonResult.price > 0) {
                newPrice = amazonResult.price;
                source = 'amazon';
                console.log(`[Auto-Update] ✓ Amazon PA-API returned price: ${newPrice}`);
              }
            }
          }

          // Fallback to Firecrawl if Amazon failed or not Amazon product
          if (newPrice === null && firecrawlApiKey) {
            console.log(`[Auto-Update] Trying Firecrawl for ${product.title}`);
            newPrice = await getFirecrawlPrice(product.product_url, firecrawlApiKey);
            if (newPrice && newPrice > 0) {
              source = 'firecrawl';
              console.log(`[Auto-Update] ✓ Firecrawl returned price: ${newPrice}`);
            }
          }

          if (newPrice && newPrice > 0) {
            // Check if price actually changed
            if (Math.abs(newPrice - product.current_price) < 0.01) {
              console.log(`[Auto-Update] Price unchanged for ${product.title}`);
              skipped++;
              continue;
            }

            // Update the product price
            const { error: updateError } = await supabase
              .from('krolist_products')
              .update({
                current_price: newPrice,
                last_checked_at: new Date().toISOString(),
              })
              .eq('id', product.id);

            if (updateError) {
              console.error(`[Auto-Update] Failed to update ${product.title}:`, updateError);
              result.error = updateError.message;
              failed++;
            } else {
              result.newPrice = newPrice;
              result.source = source;
              result.success = true;
              updated++;

              // Record price history
              priceHistoryRecords.push({
                product_id: product.id,
                price: newPrice,
                original_price: product.original_price,
                currency: product.currency || 'SAR'
              });

              console.log(`[Auto-Update] ✓ Updated ${product.title}: ${product.current_price} → ${newPrice} (via ${source})`);
            }
          } else {
            console.error(`[Auto-Update] Could not fetch price for ${product.title}`);
            result.error = 'Could not fetch price from any source';
            failed++;
          }
        } catch (error) {
          console.error(`[Auto-Update] Error processing ${product.title}:`, error);
          result.error = error instanceof Error ? error.message : 'Unknown error';
          failed++;
        }

        results.push(result);

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Insert price history records
      if (priceHistoryRecords.length > 0) {
        const { error: historyError } = await supabase
          .from('krolist_price_history')
          .insert(priceHistoryRecords);
        
        if (historyError) {
          console.error('[Auto-Update] Error inserting price history:', historyError);
        }
      }

      // Create global notification if prices were updated
      if (updated > 0) {
        await supabase.from('global_notifications').insert({
          type: 'price_update',
          title: 'Prices Auto-Updated',
          title_ar: 'تم تحديث الأسعار تلقائياً',
          message: `${updated} product prices have been automatically updated`,
          message_ar: `تم تحديث أسعار ${updated} منتج تلقائياً`,
          data: { updatedCount: updated, timestamp: new Date().toISOString() }
        });
      }

      console.log(`[Auto-Update] Complete. Updated: ${updated}, Failed: ${failed}, Skipped: ${skipped}`);
    };

    // Start background task
    EdgeRuntime.waitUntil(backgroundTask());

    // Return immediate response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Auto-update started for ${products.length} products. Check logs for progress.`,
        products_count: products.length,
        collection: collection_title || 'ALL'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[Auto-Update] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
