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

    // Get top 3 Krolist featured products with highest discount percentage
    const { data: krolistProducts, error: productsError } = await supabaseClient
      .from('krolist_products')
      .select('id, title, store, current_price, original_price, currency')
      .eq('is_featured', true);

    if (productsError) throw productsError;

    // Get favorite products count and breakdown by store
    const { data: storeBreakdown, error: storeError } = await supabaseClient
      .from('products')
      .select('store')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (storeError) throw storeError;

    // Count products by store
    const storeStats = (storeBreakdown || []).reduce((acc: Record<string, number>, product) => {
      acc[product.store] = (acc[product.store] || 0) + 1;
      return acc;
    }, {});

    // Get orders stats
    const { data: orders, error: ordersError } = await supabaseClient
      .from('orders')
      .select('status, total_amount, currency')
      .eq('user_id', user.id);

    if (ordersError) throw ordersError;

    const totalOrders = orders?.length || 0;
    const processedOrders = orders?.filter(o => o.status === 'processed') || [];
    const totalSpent = processedOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);

    // Get promo codes stats (used promo codes)
    const { data: promoCodes, error: promoError } = await supabaseClient
      .from('promo_codes')
      .select('used')
      .eq('user_id', user.id)
      .eq('used', true);

    if (promoError) throw promoError;

    const promoCodesUsed = promoCodes?.length || 0;

    // Calculate discount percentages and get top 3
    const recentChanges = (krolistProducts || [])
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
            currency: product.currency
          }
        };
      })
      .filter(item => item.discount_percentage > 0)
      .sort((a, b) => b.discount_percentage - a.discount_percentage)
      .slice(0, 3);

    return new Response(
      JSON.stringify({
        stats,
        recentChanges: recentChanges || [],
        favoriteProducts: storeBreakdown?.length || 0,
        storeBreakdown: storeStats,
        totalOrders,
        totalSpent,
        promoCodesUsed,
        currency: orders?.[0]?.currency || 'SAR'
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
