import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
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
    const urls = products.map(p => p.product_url).join('\n');
    const prompt = `ANSWER ONLY IN NUMBERS, WHAT IS THE CURRENT PRICE AFTER ANY DISCOUNT OR NOT, OF EACH OF THE LINKS AS OF NOW. Return a JSON array with format: [{"url": "product_url", "price": 123.45}]. Links:\n${urls}`;
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a price extraction assistant. Extract current prices from product URLs and return them in the exact JSON format requested.' },
          { role: 'user', content: prompt }
        ],
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Lovable AI error:', error);
      throw new Error(`Lovable AI error: ${response.status}`);
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    console.log('AI Response:', aiResponse);
    
    // Parse AI response
    let priceUpdates: Array<{ url: string; price: number }> = [];
    try {
      // Extract JSON from response (in case there's additional text)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        priceUpdates = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse price data from AI');
    }
    
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