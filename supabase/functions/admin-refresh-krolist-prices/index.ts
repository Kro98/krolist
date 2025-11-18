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

    // Define schema for price extraction (flexible to handle both number and string)
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

    // Helper to normalize numeric price from various shapes
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

    let useFallback = false;

    console.log(`Starting bulk extraction for ${products.length} products`);
    const startTime = Date.now();
    let extractionResults: any = null;

    try {
      const result = await firecrawl.extract({
        urls: products.map(p => p.product_url),
        prompt,
        schema: priceSchema
      });

      const extractionTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`Firecrawl extraction complete in ${extractionTime}s. Processing results...`);
      console.log('Raw result structure:', JSON.stringify(result, null, 2));

      if (!result.data || !Array.isArray(result.data)) {
        console.error('Invalid result structure:', result);
        useFallback = true;
      } else {
        extractionResults = result.data;
      }
    } catch (e) {
      console.error('Bulk extraction failed. Error:', e);
      useFallback = true;
    }

    if (!useFallback && extractionResults) {
      // Process results from bulk extraction
      const results = extractionResults;

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const extractedData = results[i];

        try {
          console.log(`Product ${i + 1}/${products.length}: ${product.title}`);
          console.log(`  URL: ${product.product_url}`);
          console.log(`  Raw extracted data:`, extractedData);

          // Try multiple known shapes: { price }, { data: { price } }, { json: { price } }, { extract: { price } }, { result: { price } }
          const rawPrice = extractedData?.price
            ?? extractedData?.data?.price
            ?? extractedData?.json?.price
            ?? extractedData?.extract?.price
            ?? extractedData?.result?.price;

          const newPrice = toNumber(rawPrice);
          console.log(`  Parsed price: ${newPrice}`);

          if (newPrice && newPrice > 0) {
            const { error: updateError } = await supabase
              .from('krolist_products')
              .update({
                current_price: newPrice,
                last_checked_at: new Date().toISOString(),
              })
              .eq('id', product.id);

            if (updateError) {
              console.error(`Failed to update ${product.title}:`, updateError);
              failed++;
            } else {
              console.log(`Updated ${product.title}: ${product.current_price} → ${newPrice}`);
              updated++;
            }
          } else {
            console.error(`Invalid or missing price for ${product.title}:`, rawPrice);
            failed++;
          }
        } catch (error) {
          console.error(`Error updating ${product.title}:`, error);
          failed++;
        }
      }
    } else {
      // Fallback path: extract each URL individually
      console.log('Using fallback: per-item extract');
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        try {
          console.log(`Fallback extracting ${i + 1}/${products.length}: ${product.title}`);
          const extractResult: any = await firecrawl.extract({
            urls: [product.product_url],
            prompt,
            schema: priceSchema,
          });

          console.log('Fallback raw result:', extractResult);
          const data = extractResult?.data || extractResult?.result || extractResult?.json || extractResult;
          // Prefer object with price, but handle array shape too
          const candidate = Array.isArray(data) ? data[0] : data;
          const rawPrice = candidate?.price
            ?? candidate?.data?.price
            ?? candidate?.json?.price
            ?? candidate?.extract?.price;
          const newPrice = toNumber(rawPrice);

          if (newPrice && newPrice > 0) {
            const { error: updateError } = await supabase
              .from('krolist_products')
              .update({
                current_price: newPrice,
                last_checked_at: new Date().toISOString(),
              })
              .eq('id', product.id);

            if (updateError) {
              console.error(`Failed to update ${product.title}:`, updateError);
              failed++;
            } else {
              console.log(`Updated ${product.title}: ${product.current_price} → ${newPrice}`);
              updated++;
            }
          } else {
            console.error(`Invalid or missing price (fallback) for ${product.title}:`, rawPrice);
            failed++;
          }
        } catch (error) {
          console.error(`Fallback error for ${product.title}:`, error);
          failed++;
        }
      }
    }

    console.log(`Refresh complete. Updated: ${updated}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        failed,
        total: products.length,
        collection: collection_title || 'all',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in admin-refresh-krolist-prices:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
