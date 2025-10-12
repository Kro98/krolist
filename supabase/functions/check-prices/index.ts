import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Product {
  id: string;
  product_url: string;
  store: string;
  current_price: number;
  currency: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { productId, userId } = await req.json();

    // Get products to check
    let query = supabaseClient
      .from('products')
      .select('*')
      .eq('is_active', true);
      
    if (productId) {
      query = query.eq('id', productId);
    } else if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data: products, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    const results = [];

    for (const product of (products as Product[])) {
      try {
        // Fetch the product page
        const response = await fetch(product.product_url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (!response.ok) {
          console.log(`Failed to fetch ${product.product_url}: ${response.status}`);
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
          // Update product
          await supabaseClient
            .from('products')
            .update({
              current_price: newPrice,
              updated_at: new Date().toISOString(),
              last_checked_at: new Date().toISOString()
            })
            .eq('id', product.id);

          // Add price history entry
          await supabaseClient
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
          // Update last checked time even if price didn't change
          await supabaseClient
            .from('products')
            .update({
              last_checked_at: new Date().toISOString()
            })
            .eq('id', product.id);
        }
      } catch (error) {
        console.error(`Failed to check price for ${product.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ success: true, updates: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-prices:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
