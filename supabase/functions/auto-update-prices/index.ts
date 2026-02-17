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

// Track whether PA-API is eligible (skip all PA-API calls once we know it's not)
let paApiEligible = true;

// Get price for a single Amazon product by ASIN via PA-API
async function getAmazonPrice(asin: string): Promise<{ price: number; originalPrice?: number } | null> {
  if (!paApiEligible) return null;

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
      
      // If AssociateNotEligible, disable PA-API for the rest of this run
      if (errorText.includes('AssociateNotEligible')) {
        console.log('[Auto-Update] PA-API not eligible — switching to Firecrawl fallback for all remaining products');
        paApiEligible = false;
      }
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

// ============= Firecrawl fallback =============
async function getAmazonPriceViaFirecrawl(productUrl: string): Promise<{ price: number; originalPrice?: number } | null> {
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlApiKey) {
    console.log('[Firecrawl] API key not configured, skipping fallback');
    return null;
  }

  try {
    console.log(`[Firecrawl] Scraping price from: ${productUrl}`);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: productUrl,
        formats: [
          {
            type: 'json',
            schema: {
              type: 'object',
              properties: {
                current_price: { type: 'number', description: 'The current selling price of the product in the local currency (SAR/AED/USD)' },
                original_price: { type: 'number', description: 'The original/list price before discount, if shown. Null if no discount.' },
                currency: { type: 'string', description: 'The currency code (e.g. SAR, AED, USD)' },
                availability: { type: 'string', description: 'Product availability status' },
              },
              required: ['current_price'],
            },
            prompt: 'Extract the current selling price of this Amazon product. If there is a strikethrough/original price, extract that too. Return prices as numbers without currency symbols.',
          }
        ],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Firecrawl] API error ${response.status}:`, errorText);
      return null;
    }

    const data = await response.json();
    const extracted = data?.data?.json || data?.json;

    if (!extracted) {
      console.log('[Firecrawl] No structured data extracted');
      return null;
    }

    const price = parseFloat(extracted.current_price);
    const originalPrice = extracted.original_price ? parseFloat(extracted.original_price) : undefined;

    if (price && price > 0) {
      console.log(`[Firecrawl] ✓ Extracted price: ${price}${originalPrice ? ` (was ${originalPrice})` : ''}`);
      return { price, originalPrice };
    }

    console.log('[Firecrawl] Could not extract a valid price from scraped data');
    return null;
  } catch (error) {
    console.error('[Firecrawl] Error scraping:', error);
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
  success: boolean;
  error?: string;
  source?: string;
}

// Helper to broadcast progress via Supabase Realtime
async function broadcastProgress(
  supabase: any,
  sessionId: string,
  data: {
    current: number;
    total: number;
    currentProduct: string;
    status: 'processing' | 'completed' | 'error';
    updated?: number;
    failed?: number;
    skipped?: number;
    message?: string;
  }
) {
  try {
    const channel = supabase.channel(`auto-update-${sessionId}`);
    await channel.send({
      type: 'broadcast',
      event: 'progress',
      payload: data
    });
  } catch (error) {
    console.error('[Auto-Update] Failed to broadcast progress:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Reset PA-API eligibility flag per invocation
  paApiEligible = true;

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    const { collection_title, session_id } = await req.json().catch(() => ({}));
    const sessionId = session_id || crypto.randomUUID();

    console.log('[Auto-Update] Starting price auto-update for:', collection_title || 'ALL collections');
    console.log('[Auto-Update] Session ID:', sessionId);

    let query = supabase
      .from('krolist_products')
      .select('id, product_url, current_price, original_price, title, store, currency')
      .eq('is_featured', true)
      .eq('store', 'Amazon');

    if (collection_title && collection_title !== 'all') {
      query = query.eq('collection_title', collection_title);
    }

    const { data: products, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }

    console.log(`[Auto-Update] Found ${products?.length || 0} Amazon products to update`);

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          updated: 0, 
          failed: 0,
          skipped: 0,
          message: 'No Amazon products found to update',
          session_id: sessionId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const backgroundTask = async () => {
      const results: UpdateResult[] = [];
      let updated = 0;
      let failed = 0;
      let skipped = 0;
      const priceHistoryRecords: any[] = [];
      const total = products.length;

      for (let i = 0; i < (products as Product[]).length; i++) {
        const product = (products as Product[])[i];
        const result: UpdateResult = {
          id: product.id,
          title: product.title,
          oldPrice: product.current_price,
          newPrice: 0,
          success: false
        };

        await broadcastProgress(supabase, sessionId, {
          current: i + 1,
          total,
          currentProduct: product.title.substring(0, 50) + (product.title.length > 50 ? '...' : ''),
          status: 'processing',
          updated,
          failed,
          skipped
        });

        try {
          let newPrice: number | null = null;
          let priceSource = 'pa-api';

          if (isAmazonProductUrl(product.product_url)) {
            const asin = extractASIN(product.product_url);

            // Try PA-API first (skipped automatically if already marked ineligible)
            if (asin && paApiEligible) {
              console.log(`[Auto-Update] Fetching Amazon PA-API for ${product.title} (ASIN: ${asin})`);
              const amazonResult = await getAmazonPrice(asin);
              if (amazonResult && amazonResult.price > 0) {
                newPrice = amazonResult.price;
                priceSource = 'pa-api';
                console.log(`[Auto-Update] ✓ PA-API returned price: ${newPrice}`);
              }
            }

            // Firecrawl fallback if PA-API didn't return a price
            if (!newPrice || newPrice <= 0) {
              console.log(`[Auto-Update] Trying Firecrawl fallback for ${product.title}`);
              const firecrawlResult = await getAmazonPriceViaFirecrawl(product.product_url);
              if (firecrawlResult && firecrawlResult.price > 0) {
                newPrice = firecrawlResult.price;
                priceSource = 'firecrawl';
                console.log(`[Auto-Update] ✓ Firecrawl returned price: ${newPrice}`);
              }
            }
          }

          if (newPrice && newPrice > 0) {
            if (Math.abs(newPrice - product.current_price) < 0.01) {
              console.log(`[Auto-Update] Price unchanged for ${product.title}`);
              skipped++;
              continue;
            }

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
              result.success = true;
              result.source = priceSource;
              updated++;

              priceHistoryRecords.push({
                product_id: product.id,
                price: newPrice,
                original_price: product.original_price,
                currency: product.currency || 'SAR'
              });

              console.log(`[Auto-Update] ✓ Updated ${product.title}: ${product.current_price} → ${newPrice} (via ${priceSource})`);
            }
          } else {
            console.error(`[Auto-Update] Could not fetch price for ${product.title} (PA-API + Firecrawl both failed)`);
            result.error = 'Could not fetch price from PA-API or Firecrawl';
            failed++;
          }
        } catch (error) {
          console.error(`[Auto-Update] Error processing ${product.title}:`, error);
          result.error = error instanceof Error ? error.message : 'Unknown error';
          failed++;
        }

        results.push(result);

        // Slightly longer delay for Firecrawl to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, paApiEligible ? 500 : 1500));
      }

      if (priceHistoryRecords.length > 0) {
        const { error: historyError } = await supabase
          .from('krolist_price_history')
          .insert(priceHistoryRecords);
        
        if (historyError) {
          console.error('[Auto-Update] Error inserting price history:', historyError);
        }
      }

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

      await broadcastProgress(supabase, sessionId, {
        current: total,
        total,
        currentProduct: '',
        status: 'completed',
        updated,
        failed,
        skipped,
        message: `Completed! Updated: ${updated}, Failed: ${failed}, Skipped: ${skipped}`
      });

      console.log(`[Auto-Update] Complete. Updated: ${updated}, Failed: ${failed}, Skipped: ${skipped}`);
    };

    EdgeRuntime.waitUntil(backgroundTask());

    return new Response(
      JSON.stringify({
        success: true,
        message: `Auto-update started for ${products.length} Amazon products (with Firecrawl fallback).`,
        products_count: products.length,
        collection: collection_title || 'ALL',
        session_id: sessionId
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