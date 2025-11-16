import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting deletion of expired Krolist promo codes...');

    const today = new Date().toISOString().split('T')[0];

    // Delete expired Krolist promo codes
    const { data: deletedCodes, error } = await supabaseClient
      .from('promo_codes')
      .delete()
      .eq('is_krolist', true)
      .lt('expires', today)
      .select();

    if (error) {
      console.error('Error deleting expired promo codes:', error);
      throw error;
    }

    const deletedCount = deletedCodes?.length || 0;
    console.log(`Successfully deleted ${deletedCount} expired Krolist promo codes`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Deleted ${deletedCount} expired Krolist promo codes`,
        deleted: deletedCodes,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in delete-expired-promo-codes function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
