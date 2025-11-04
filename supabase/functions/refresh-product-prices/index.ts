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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting product price refresh...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }
    
    const { data: roleData } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });
      
    if (!roleData) {
      throw new Error('Admin access required');
    }
    
    // Get all active krolist products
    const { data: products, error: productsError } = await supabase
      .from('krolist_products')
      .select('id, product_url, current_price, original_price')
      .eq('is_featured', true);
      
    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw productsError;
    }
    
    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No products to update', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Checking prices for ${products.length} products...`);
    
    // Create prompt for AI
    // TODO: PLACEHOLDER - This AI approach cannot accurately scrape real-time prices
    // OpenAI/AI models can only "guess" prices based on training data
    // For accurate prices, integrate a web scraping service:
    // - Firecrawl API (https://firecrawl.dev)
    // - Bright Data (https://brightdata.com)
    // - ScrapingBee (https://scrapingbee.com)
    
    const urls = products.map(p => p.product_url).join('\n');
    console.log('PLACEHOLDER: Would scrape prices for URLs:', urls);
    
    // Mock AI response for now
    const priceUpdates = products.map(p => ({
      url: p.product_url,
      price: p.current_price // Keeping same price as placeholder
    }));
    
    // In production, priceUpdates would come from actual scraping service
    
    // Update products
    let updatedCount = 0;
    for (const product of products) {
      const priceUpdate = priceUpdates.find(p => p.url === product.product_url);
      if (priceUpdate && priceUpdate.price && priceUpdate.price !== product.current_price) {
        const { error: updateError } = await supabase
          .from('krolist_products')
          .update({
            current_price: priceUpdate.price,
            last_checked_at: new Date().toISOString(),
          })
          .eq('id', product.id);
          
        if (!updateError) {
          updatedCount++;
          console.log(`Updated product ${product.id}: ${product.current_price} -> ${priceUpdate.price}`);
        } else {
          console.error(`Error updating product ${product.id}:`, updateError);
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        message: `Successfully checked ${products.length} products`,
        updated: updatedCount,
        checked: products.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in refresh-product-prices:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});