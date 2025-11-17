import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import FirecrawlApp from "https://esm.sh/@mendable/firecrawl-js@1.6.2";

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
    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });

    let updated = 0;
    let failed = 0;

    // Process each product
    for (const product of products) {
      try {
        console.log(`Scraping: ${product.title} (${product.product_url})`);

        // Scrape the product page
        const scrapeResult = await firecrawl.scrapeUrl(product.product_url, {
          formats: ['html'],
          onlyMainContent: true,
        });

        if (!scrapeResult.success || !scrapeResult.html) {
          console.error(`Failed to scrape ${product.title}`);
          failed++;
          continue;
        }

        const html = scrapeResult.html;
        let newPrice: number | null = null;

        // Extract price based on store patterns
        if (product.store.toLowerCase().includes('amazon')) {
          // Amazon price patterns
          const patterns = [
            /<span class="a-price-whole">([0-9,]+)/,
            /id="priceblock_ourprice"[^>]*>([^<]*\d+[.,]\d+)/,
            /<span class="a-offscreen">SAR&nbsp;([0-9,]+\.\d+)/,
            /class="a-price"[^>]*>.*?<span[^>]*>([0-9,]+\.\d+)/s,
          ];
          
          for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
              const priceStr = match[1].replace(/,/g, '');
              newPrice = parseFloat(priceStr);
              if (!isNaN(newPrice)) break;
            }
          }
        } else if (product.store.toLowerCase().includes('noon')) {
          // Noon price patterns
          const patterns = [
            /data-price="([0-9.]+)"/,
            /class="sellingPrice"[^>]*>([^<]*\d+[.,]\d+)/,
            /"price":([0-9.]+)/,
          ];
          
          for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
              newPrice = parseFloat(match[1]);
              if (!isNaN(newPrice)) break;
            }
          }
        } else {
          // Generic e-commerce patterns
          const patterns = [
            /<meta property="og:price:amount" content="([0-9.]+)"/,
            /<meta property="product:price:amount" content="([0-9.]+)"/,
            /class="[^"]*price[^"]*"[^>]*>.*?([0-9,]+\.\d+)/i,
            /"price"\s*:\s*"?([0-9.]+)"?/,
          ];
          
          for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
              const priceStr = match[1].replace(/,/g, '');
              newPrice = parseFloat(priceStr);
              if (!isNaN(newPrice)) break;
            }
          }
        }

        if (newPrice && newPrice > 0) {
          // Update only current_price and last_checked_at
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
          console.error(`Could not extract price for ${product.title}`);
          failed++;
        }

        // Small delay to avoid overwhelming Firecrawl
        await new Promise(resolve => setTimeout(resolve, 150));

      } catch (error) {
        console.error(`Error processing ${product.title}:`, error);
        failed++;
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

  } catch (error) {
    console.error('Error in admin-refresh-krolist-prices:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
