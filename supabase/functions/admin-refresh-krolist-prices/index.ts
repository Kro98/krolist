import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Firecrawl from "npm:@mendable/firecrawl-js@latest";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

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

    console.log('Starting price refresh for collection:', collection_title || 'ALL');

    // Build query for krolist products
    let query = supabase
      .from('krolist_products')
      .select('id, product_url, current_price, collection_title, store, title')
      .eq('is_featured', true);

    if (collection_title) {
      query = query.eq('collection_title', collection_title);
    }

    const { data: products, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }

    console.log(`Found ${products?.length || 0} products to refresh`);

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          updated: 0, 
          failed: 0,
          message: 'No products found to refresh'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Firecrawl
    const firecrawl = new Firecrawl({ apiKey: firecrawlApiKey });

    let updated = 0;
    let failed = 0;

    // Define schema for price extraction
    const priceSchema = {
      type: 'object',
      properties: {
        price: { 
          type: ['number', 'string'],
          description: 'The current price of the product. Can be a number or string with numeric value.'
        }
      },
      required: ['price']
    } as const;

    // Helper to normalize numeric price
    const toNumber = (raw: unknown): number | null => {
      if (raw === null || raw === undefined) return null;
      if (typeof raw === 'number') return isFinite(raw) ? raw : null;
      if (typeof raw === 'string') {
        const m = raw.match(/[\d,]+\.?\d*/);
        if (!m) return null;
        const n = parseFloat(m[0].replace(/,/g, ''));
        return isNaN(n) ? null : n;
      }
      return null;
    };

    const prompt = 'Extract the current price of the product. Look for the main product price displayed on the page. Return only the numeric value without currency symbols.';

    // Start background task for price extraction
    const backgroundTask = async () => {
      let useFallback = false;
      let extractionResults: any = null;

      console.log(`[Background] Starting bulk extraction for ${products.length} products`);
      const startTime = Date.now();

      try {
        const result = await firecrawl.extract({
          urls: products.map(p => p.product_url),
          prompt,
          schema: priceSchema
        });

        const extractionTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[Background] Firecrawl extraction complete in ${extractionTime}s`);
        console.log('[Background] Raw result structure:', JSON.stringify(result, null, 2));

        if (!result.data || !Array.isArray(result.data)) {
          console.error('[Background] Invalid result structure:', result);
          useFallback = true;
        } else {
          extractionResults = result.data;
        }
      } catch (e) {
        console.error('[Background] Bulk extraction failed. Error:', e);
        useFallback = true;
      }

      if (!useFallback && extractionResults) {
        // Process results from bulk extraction
        const results = extractionResults;

        for (let i = 0; i < products.length; i++) {
          const product = products[i];
          const extractedData = results[i];

          try {
            console.log(`[Background] Product ${i + 1}/${products.length}: ${product.title}`);
            console.log(`[Background]   URL: ${product.product_url}`);
            console.log(`[Background]   Raw extracted data:`, extractedData);

            const rawPrice = extractedData?.price
              ?? extractedData?.data?.price
              ?? extractedData?.json?.price
              ?? extractedData?.extract?.price
              ?? extractedData?.result?.price;

            const newPrice = toNumber(rawPrice);
            console.log(`[Background]   Parsed price: ${newPrice}`);

            if (newPrice && newPrice > 0) {
              const { error: updateError } = await supabase
                .from('krolist_products')
                .update({
                  current_price: newPrice,
                  last_checked_at: new Date().toISOString(),
                })
                .eq('id', product.id);

              if (updateError) {
                console.error(`[Background] Failed to update ${product.title}:`, updateError);
                failed++;
              } else {
                console.log(`[Background] Updated ${product.title}: ${product.current_price} → ${newPrice}`);
                updated++;
              }
            } else {
              console.error(`[Background] Invalid or missing price for ${product.title}:`, rawPrice);
              failed++;
            }
          } catch (error) {
            console.error(`[Background] Error updating ${product.title}:`, error);
            failed++;
          }
        }
      }

      if (useFallback) {
        // Individual extraction fallback
        console.log('[Background] Starting individual extraction for each product...');
        for (const product of products) {
          try {
            console.log(`[Background] Extracting price for: ${product.title}`);
            const result = await firecrawl.extract({
              urls: [product.product_url],
              prompt,
              schema: priceSchema
            });

            const extractedData = result?.data?.[0];
            const rawPrice = extractedData?.price
              ?? extractedData?.data?.price
              ?? extractedData?.json?.price;

            const newPrice = toNumber(rawPrice);

            if (newPrice && newPrice > 0) {
              const { error: updateError } = await supabase
                .from('krolist_products')
                .update({
                  current_price: newPrice,
                  last_checked_at: new Date().toISOString(),
                })
                .eq('id', product.id);

              if (!updateError) {
                console.log(`[Background] ✓ Updated ${product.title}: ${newPrice}`);
                updated++;
              } else {
                console.error(`[Background] Failed to update ${product.title}:`, updateError);
                failed++;
              }
            } else {
              console.error(`[Background] Invalid price for ${product.title}:`, rawPrice);
              failed++;
            }
          } catch (error) {
            console.error(`[Background] Error processing ${product.title}:`, error);
            failed++;
          }
        }
      }

      console.log(`[Background] Refresh complete. Updated: ${updated}, Failed: ${failed}`);
    };

    // Start background task without blocking response
    EdgeRuntime.waitUntil(backgroundTask());

    // Return immediate response - processing happens in background
    return new Response(
      JSON.stringify({
        success: true,
        message: `Price refresh started for ${products.length} products. Check logs for progress.`,
        products_count: products.length,
        collection: collection_title || 'ALL'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in price refresh:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
