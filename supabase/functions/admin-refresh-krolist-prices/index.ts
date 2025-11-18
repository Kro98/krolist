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
    };

    console.log(`Starting bulk extraction job for ${products.length} products`);

    // Start bulk extraction job with all product URLs
    const startTime = Date.now();
    const extractionJob = await firecrawl.startExtract({
      urls: products.map(p => p.product_url),
      prompt: 'Extract the current price of the product. Look for the main product price displayed on the page. Return only the numeric value without currency symbols.',
      schema: priceSchema,
      scrapeOptions: {
        formats: ['extract'],
        waitFor: 2000,  // Wait for page to load fully
        timeout: 30000  // 30 second timeout per page
      }
    });

    if (!extractionJob.success || !extractionJob.id) {
      throw new Error('Failed to start extraction job');
    }

    console.log(`Extraction job started: ${extractionJob.id}`);

    // Poll for job completion
    let jobComplete = false;
    const maxAttempts = 60; // 3 minutes max (60 attempts × 3 seconds)
    let attempts = 0;
    let jobStatus: any;

    while (!jobComplete && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      attempts++;

      jobStatus = await firecrawl.getExtractStatus(extractionJob.id);
      console.log(`Job status check ${attempts}: ${jobStatus.status} (completed: ${jobStatus.completed || 0}/${jobStatus.total || products.length})`);

      if (jobStatus.status === 'completed') {
        jobComplete = true;
      } else if (jobStatus.status === 'failed') {
        throw new Error(`Extraction job failed: ${jobStatus.error || 'Unknown error'}`);
      }
    }

    if (!jobComplete) {
      throw new Error(`Extraction job timed out after ${attempts * 3} seconds`);
    }

    const extractionTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Extraction completed in ${extractionTime}s. Processing results...`);

    // Process results and update database
    const results = jobStatus.data || [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const extractedData = results[i];

      try {
        console.log(`Product ${i + 1}/${products.length}: ${product.title}`);
        console.log(`  URL: ${product.product_url}`);
        console.log(`  Extracted data:`, extractedData);
        
        let newPrice: number | null = null;
        
        if (extractedData?.price) {
          // Handle both number and string prices
          if (typeof extractedData.price === 'number') {
            newPrice = extractedData.price;
          } else if (typeof extractedData.price === 'string') {
            // Extract numeric value from string (e.g., "178.00 SAR" -> 178)
            const priceMatch = extractedData.price.match(/[\d,]+\.?\d*/);
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
          console.error(`Invalid or missing price for ${product.title}:`, extractedData?.price);
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
