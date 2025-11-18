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

    console.log(`Starting batch scrape for ${products.length} products`);

    // Start batch scrape job with all product URLs
    const startTime = Date.now();
    const job = await firecrawl.batchScrape(
      products.map(p => p.product_url),
      {
        options: {
          formats: [{
            type: 'json',
            schema: { 
              type: 'object', 
              properties: { 
                price: { 
                  type: 'string',
                  description: 'The current price of the product. Return the numeric value with or without currency symbols.'
                } 
              }, 
              required: ['price'] 
            }
          }]
        }
      }
    );

    if (!job.success || !job.data) {
      throw new Error('Batch scrape job failed');
    }

    const extractionTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Batch scrape completed in ${extractionTime}s. Processing ${job.data.length} results...`);

    // Process results and update database
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const scrapedData = job.data[i];

      try {
        console.log(`Product ${i + 1}/${products.length}: ${product.title}`);
        console.log(`  URL: ${product.product_url}`);
        console.log(`  Scraped data:`, scrapedData);
        
        let newPrice: number | null = null;
        
        // Extract price from JSON data
        if (scrapedData?.json?.price) {
          const priceData = scrapedData.json.price;
          // Handle both number and string prices
          if (typeof priceData === 'number') {
            newPrice = priceData;
          } else if (typeof priceData === 'string') {
            // Extract numeric value from string (e.g., "178.00 SAR" -> 178)
            const priceMatch = priceData.match(/[\d,]+\.?\d*/);
            if (priceMatch) {
              newPrice = parseFloat(priceMatch[0].replace(/,/g, ''));
            }
          }
        }
        
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
          console.error(`Invalid or missing price for ${product.title}:`, scrapedData?.json?.price);
          failed++;
        }
      } catch (error) {
        console.error(`Error updating ${product.title}:`, error);
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
