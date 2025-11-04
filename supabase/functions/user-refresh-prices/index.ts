import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`User ${user.id} requesting price refresh`);

    // Get current week's Sunday (week start)
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const daysToSunday = currentDayOfWeek === 0 ? 0 : -currentDayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + daysToSunday);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Check user's refresh log for this week
    const { data: refreshLog, error: logError } = await supabase
      .from('user_refresh_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStartStr)
      .maybeSingle();

    if (logError) {
      console.error('Error fetching refresh log:', logError);
      throw logError;
    }

    // Check if user has already refreshed this week
    if (refreshLog && refreshLog.refresh_count >= 1) {
      return new Response(
        JSON.stringify({ 
          error: 'Weekly limit reached',
          message: 'You have already used your weekly refresh. Next refresh available on Sunday.',
          nextRefreshDate: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user's products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, product_url, current_price, original_currency')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw productsError;
    }

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No products found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching prices for ${products.length} products`);

    // TODO: PLACEHOLDER - Replace with actual web scraping service
    // For now, we'll just return a mock response
    // When you integrate a real scraping service (Firecrawl, Bright Data, etc.),
    // replace this section with actual API calls
    
    const urls = products.map(p => p.product_url).join('\n');
    console.log('PLACEHOLDER: Would fetch prices for URLs:', urls);
    
    // Mock response - in production, this would be real scraped data
    const priceUpdates = products.map(p => ({
      url: p.product_url,
      price: p.current_price // Placeholder: keeping same price
    }));

    // Update products and price history
    let updatedCount = 0;
    for (const product of products) {
      const priceUpdate = priceUpdates.find(u => u.url === product.product_url);
      if (!priceUpdate) continue;

      const newPrice = priceUpdate.price;
      
      // Update product
      const { error: updateError } = await supabase
        .from('products')
        .update({
          current_price: newPrice,
          last_checked_at: new Date().toISOString(),
        })
        .eq('id', product.id);

      if (updateError) {
        console.error(`Error updating product ${product.id}:`, updateError);
        continue;
      }

      // Add to price history
      const { error: historyError } = await supabase
        .from('price_history')
        .insert({
          product_id: product.id,
          price: newPrice,
          original_price: newPrice,
          currency: product.original_currency,
          scraped_at: new Date().toISOString(),
        });

      if (historyError) {
        console.error(`Error inserting price history for ${product.id}:`, historyError);
      }

      updatedCount++;
    }

    // Update or create refresh log
    if (refreshLog) {
      await supabase
        .from('user_refresh_logs')
        .update({
          refresh_count: refreshLog.refresh_count + 1,
          last_refresh_date: new Date().toISOString(),
        })
        .eq('id', refreshLog.id);
    } else {
      await supabase
        .from('user_refresh_logs')
        .insert({
          user_id: user.id,
          week_start: weekStartStr,
          refresh_count: 1,
          last_refresh_date: new Date().toISOString(),
        });
    }

    console.log(`Successfully refreshed ${updatedCount} products`);

    return new Response(
      JSON.stringify({
        success: true,
        checked: products.length,
        updated: updatedCount,
        message: 'Prices refreshed successfully',
        remainingRefreshes: 0,
        nextRefreshDate: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in user-refresh-prices:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});