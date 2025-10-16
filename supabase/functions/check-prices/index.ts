import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit: Only check products not updated in the last 3 weeks (21 days)
const RATE_LIMIT_DAYS = 21;

// Rate limiting for function calls: max 10 checks per hour per user
const MAX_CHECKS_PER_HOUR = 10;

interface Product {
  id: string;
  product_url: string;
  store: string;
  current_price: number;
  currency: string;
  last_checked_at: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Step 1: Authenticate the request
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    // Step 2: Create admin client for database operations
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 2.5: Check rate limit - max 10 checks per hour
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    
    // Count how many times this user has called this function in the last hour
    // We'll use the last_checked_at updates as a proxy for function calls
    const { count: recentChecks } = await adminClient
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('last_checked_at', oneHourAgo);

    if (recentChecks && recentChecks >= MAX_CHECKS_PER_HOUR) {
      console.log(`Rate limit exceeded for user ${user.id}: ${recentChecks} checks in last hour`);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. You can check prices up to 10 times per hour',
          rateLimitReset: new Date(Date.now() + 3600000).toISOString()
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Calculate rate limit threshold (3 weeks ago)
    const rateLimitDate = new Date();
    rateLimitDate.setDate(rateLimitDate.getDate() - RATE_LIMIT_DAYS);
    const rateLimitThreshold = rateLimitDate.toISOString();

    console.log(`Rate limit threshold: ${rateLimitThreshold} (checking products not updated in ${RATE_LIMIT_DAYS} days)`);

    // Step 4: Get products to check - only user's own products that haven't been checked in 3 weeks
    const { data: products, error: fetchError } = await adminClient
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .or(`last_checked_at.is.null,last_checked_at.lt.${rateLimitThreshold}`);

    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      throw fetchError;
    }

    if (!products || products.length === 0) {
      console.log('No products eligible for price check (all products checked within last 3 weeks)');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No products need price checking at this time. Products are checked automatically every 3 weeks.',
          updates: [],
          nextCheckAvailable: rateLimitThreshold
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${products.length} products eligible for price check`);
    const results = [];

    for (const product of (products as Product[])) {
      try {
        console.log(`Checking price for product ${product.id} (${product.store})`);
        
        // Fetch the product page
        const response = await fetch(product.product_url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (!response.ok) {
          console.log(`Failed to fetch ${product.product_url}: ${response.status}`);
          // Still update last_checked_at even on failure to prevent constant retries
          await adminClient
            .from('products')
            .update({
              last_checked_at: new Date().toISOString()
            })
            .eq('id', product.id);
          continue;
        }

        const html = await response.text();
        let newPrice: number | null = null;

        // Extract price based on store
        if (product.store.toLowerCase().includes('noon')) {
          const priceMatch = html.match(/["']price["']:\s*(\d+\.?\d*)/i);
          if (priceMatch) {
            newPrice = parseFloat(priceMatch[1]);
          }
        } else if (product.store.toLowerCase().includes('amazon')) {
          const priceMatch = html.match(/["']price["']:\s*["']?(\d+\.?\d*)/i) ||
                           html.match(/\$(\d+\.?\d*)/);
          if (priceMatch) {
            newPrice = parseFloat(priceMatch[1]);
          }
        }

        if (newPrice && newPrice !== product.current_price) {
          console.log(`Price changed for product ${product.id}: ${product.current_price} -> ${newPrice}`);
          
          // Update product
          await adminClient
            .from('products')
            .update({
              current_price: newPrice,
              updated_at: new Date().toISOString(),
              last_checked_at: new Date().toISOString()
            })
            .eq('id', product.id);

          // Add price history entry
          await adminClient
            .from('price_history')
            .insert({
              product_id: product.id,
              price: newPrice,
              currency: product.currency
            });

          results.push({
            productId: product.id,
            oldPrice: product.current_price,
            newPrice,
            change: newPrice - product.current_price
          });
        } else {
          console.log(`No price change for product ${product.id}`);
          // Update last checked time even if price didn't change
          await adminClient
            .from('products')
            .update({
              last_checked_at: new Date().toISOString()
            })
            .eq('id', product.id);
        }
      } catch (error) {
        console.error(`Failed to check price for ${product.id}:`, error);
        // Update last_checked_at to prevent getting stuck on failing products
        try {
          await adminClient
            .from('products')
            .update({
              last_checked_at: new Date().toISOString()
            })
            .eq('id', product.id);
        } catch (updateError) {
          console.error(`Failed to update last_checked_at for ${product.id}:`, updateError);
        }
      }
    }

    console.log(`Price check complete. ${results.length} price changes detected.`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        updates: results,
        productsChecked: products.length,
        priceChanges: results.length,
        message: `Checked ${products.length} products. Found ${results.length} price changes. Products will be automatically checked again in 3 weeks.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-prices:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An internal error occurred while checking prices. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
