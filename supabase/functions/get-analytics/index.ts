import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false
        }
      }
    );

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get stats using helper function
    const { data: stats, error: statsError } = await supabaseClient
      .rpc('get_user_product_stats', { user_uuid: user.id });

    if (statsError) throw statsError;

    // Get top 3 products with highest discount percentage
    const { data: userProducts, error: productsError } = await supabaseClient
      .from('products')
      .select('id, title, store, current_price, original_price, currency')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (productsError) throw productsError;

    // Calculate discount percentages and get top 3
    const recentChanges = (userProducts || [])
      .map(product => {
        const discountPct = product.original_price > 0 
          ? ((product.original_price - product.current_price) / product.original_price * 100)
          : 0;
        
        return {
          id: product.id,
          price: product.original_price,
          original_price: product.original_price,
          scraped_at: new Date().toISOString(),
          discount_percentage: Math.round(discountPct * 100) / 100,
          products: {
            id: product.id,
            title: product.title,
            store: product.store,
            current_price: product.current_price,
            currency: product.currency,
            user_id: user.id
          }
        };
      })
      .filter(item => item.discount_percentage > 0)
      .sort((a, b) => b.discount_percentage - a.discount_percentage)
      .slice(0, 3);

    return new Response(
      JSON.stringify({
        stats,
        recentChanges: recentChanges || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-analytics:', error);
    return new Response(
      JSON.stringify({ error: 'An internal error occurred while retrieving analytics. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
