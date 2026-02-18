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

// ============= Free direct scraper fallback =============
function extractPriceFromHtml(html: string): { price: number; originalPrice?: number } | null {
  // Strategy 1: Look for priceblock / apex price spans (common Amazon patterns)
  const pricePatterns = [
    // Amazon .sa / .ae / .com price whole + fraction
    /class="a-price-whole"[^>]*>([0-9,\.]+)<.*?class="a-price-fraction"[^>]*>(\d+)</s,
    // corePriceDisplay
    /corePriceDisplay_desktop_feature_div.*?class="a-price-whole"[^>]*>([0-9,\.]+)<.*?class="a-price-fraction"[^>]*>(\d+)</s,
    // a-price aok-align-center
    /class="a-price aok-align-center[^"]*"[^>]*>.*?class="a-offscreen"[^>]*>([^<]+)</s,
    // a-offscreen (first match is usually the current price)
    /class="a-offscreen"[^>]*>\s*(?:SAR|AED|USD|€|\$|£)?\s*([0-9,]+\.?\d*)/,
    // priceblock_ourprice
    /id="priceblock_ourprice"[^>]*>(?:SAR|AED|USD|€|\$|£)?\s*([0-9,]+\.?\d*)/,
    // priceblock_dealprice
    /id="priceblock_dealprice"[^>]*>(?:SAR|AED|USD|€|\$|£)?\s*([0-9,]+\.?\d*)/,
    // apex price
    /id="price_inside_buybox"[^>]*>(?:SAR|AED|USD|€|\$|£)?\s*([0-9,]+\.?\d*)/,
    // twister price
    /id="newBuyBoxPrice"[^>]*>(?:SAR|AED|USD|€|\$|£)?\s*([0-9,]+\.?\d*)/,
    // JSON-LD price
    /"price"\s*:\s*"?([0-9,]+\.?\d*)"?/,
  ];

  let price = 0;
  
  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) {
      if (match[2]) {
        // whole + fraction pattern
        price = parseFloat(match[1].replace(/,/g, '') + '.' + match[2]);
      } else {
        price = parseFloat(match[1].replace(/,/g, ''));
      }
      if (price > 0) break;
    }
  }

  if (price <= 0) return null;

  // Try to find original/strikethrough price
  let originalPrice: number | undefined;
  const origPatterns = [
    /class="a-text-price"[^>]*>.*?class="a-offscreen"[^>]*>(?:SAR|AED|USD|€|\$|£)?\s*([0-9,]+\.?\d*)/s,
    /class="a-price a-text-price"[^>]*>.*?class="a-offscreen"[^>]*>(?:SAR|AED|USD|€|\$|£)?\s*([0-9,]+\.?\d*)/s,
    /class="priceBlockStrikePriceString[^"]*"[^>]*>(?:SAR|AED|USD|€|\$|£)?\s*([0-9,]+\.?\d*)/,
    /"listPrice"\s*:\s*"?([0-9,]+\.?\d*)"?/,
  ];

  for (const pattern of origPatterns) {
    const match = html.match(pattern);
    if (match) {
      const op = parseFloat(match[1].replace(/,/g, ''));
      if (op > price) {
        originalPrice = op;
        break;
      }
    }
  }

  return { price, originalPrice };
}

async function getAmazonPriceViaScraper(productUrl: string, retries = 3): Promise<{ price: number; originalPrice?: number } | null> {
  const asin = extractASIN(productUrl);
  let domain = 'www.amazon.sa';
  try {
    const parsed = new URL(productUrl);
    domain = parsed.hostname;
  } catch { /* keep default */ }

  // Try mobile URL first (lighter pages, less aggressive blocking), then desktop
  const urls: string[] = [];
  if (asin) {
    urls.push(`https://${domain}/gp/aw/d/${asin}`);   // mobile
    urls.push(`https://${domain}/dp/${asin}`);          // desktop
  } else {
    urls.push(productUrl);
  }

  // Expanded User-Agent pool with mobile + desktop variants
  const userAgents = [
    // Mobile UAs (match mobile URL)
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
    // Desktop UAs
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
  ];

  for (const scrapeUrl of urls) {
    const isMobile = scrapeUrl.includes('/gp/aw/d/');
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Pick UA matching URL type (mobile UA for mobile URL, desktop for desktop)
        const uaPool = isMobile ? userAgents.slice(0, 3) : userAgents.slice(3);
        const ua = uaPool[attempt % uaPool.length];
        
        console.log(`[Scraper] Attempt ${attempt + 1} (${isMobile ? 'mobile' : 'desktop'}) for: ${scrapeUrl}`);

        const response = await fetch(scrapeUrl, {
          method: 'GET',
          headers: {
            'User-Agent': ua,
            'Accept': isMobile 
              ? 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
              : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
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
          console.error(`[Scraper] HTTP ${response.status} for ${scrapeUrl}`);
          await response.text(); // consume body
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
            continue;
          }
          break; // try next URL variant
        }

        const html = await response.text();
        
        if (html.length < 3000) {
          console.log(`[Scraper] Response too short (${html.length} chars), likely captcha/block`);
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 4000 * (attempt + 1)));
            continue;
          }
          break; // try next URL variant
        }

        const result = extractPriceFromHtml(html);
        if (result) {
          console.log(`[Scraper] ✓ Extracted price: ${result.price}${result.originalPrice ? ` (was ${result.originalPrice})` : ''} via ${isMobile ? 'mobile' : 'desktop'}`);
          return result;
        }

        console.log(`[Scraper] Could not extract price from HTML (attempt ${attempt + 1})`);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 3000));
        }
      } catch (error) {
        console.error(`[Scraper] Error on attempt ${attempt + 1}:`, error);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    }
  }

  return null;
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
    const authHeader = req.headers.get('Authorization');
    const isCronInvocation = !authHeader || authHeader === `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;

    // Create supabase client with service role for cron, or user auth for admin
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} }
    });

    if (!isCronInvocation) {
      // Manual invocation — verify admin
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
      console.log('[Auto-Update] Triggered by admin user');
    } else {
      console.log('[Auto-Update] Triggered by scheduled cron job');
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
      const scraperUpdatedIds: string[] = [];
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

            // Free scraper fallback if PA-API didn't return a price
            if (!newPrice || newPrice <= 0) {
              console.log(`[Auto-Update] Trying direct scraper for ${product.title}`);
              const scraperResult = await getAmazonPriceViaScraper(product.product_url);
              if (scraperResult && scraperResult.price > 0) {
                newPrice = scraperResult.price;
                priceSource = 'scraper';
                console.log(`[Auto-Update] ✓ Scraper returned price: ${newPrice}`);
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
              if (priceSource === 'scraper') {
                scraperUpdatedIds.push(product.id);
              }
            }
          } else {
            console.error(`[Auto-Update] Could not fetch price for ${product.title} (PA-API + scraper both failed)`);
            result.error = 'Could not fetch price from PA-API or scraper';
            failed++;
          }
        } catch (error) {
          console.error(`[Auto-Update] Error processing ${product.title}:`, error);
          result.error = error instanceof Error ? error.message : 'Unknown error';
          failed++;
        }

        results.push(result);

        // Delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, paApiEligible ? 500 : 4000));
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
        scraperUpdatedIds,
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