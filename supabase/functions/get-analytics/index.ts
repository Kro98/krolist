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

    // Get recent price changes
    const { data: recentChanges, error: changesError } = await supabaseClient
      .from('price_history')
      .select(`
        id,
        price,
        original_price,
        scraped_at,
        products!inner (
          id,
          title,
          store,
          current_price,
          currency,
          user_id
        )
      `)
      .eq('products.user_id', user.id)
      .order('scraped_at', { ascending: false })
      .limit(10);

    if (changesError) throw changesError;

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
