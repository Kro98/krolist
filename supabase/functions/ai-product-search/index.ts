import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, categories } = await req.json();
    
    if (!query) {
      throw new Error('Query is required');
    }
    
    console.log('AI product search for:', query);
    
    const categoryList = categories || ['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Sports', 'Books'];
    const prompt = `RETURN THE RESULTS STRICTLY FROM THE FOLLOWING SHOPS (NOON, AMAZON) AND PROVIDE AN IMAGE URL OF THE PRODUCT, A TITLE, A DESCRIPTION, A PRICE, AND A TAG FROM THE FOLLOWING TAGS THAT FITS THE PRODUCT: ${categoryList.join(', ')}.

Search query: "${query}"

Return a JSON array with this exact format:
[
  {
    "title": "Product title",
    "description": "Product description",
    "price": 123.45,
    "image_url": "https://...",
    "category": "one of the provided tags",
    "store": "noon or amazon",
    "product_url": "product page URL"
  }
]

Limit to 10 results maximum.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a product search assistant. Find products from Noon and Amazon based on user queries and return structured data in the exact JSON format requested.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    console.log('AI Response:', aiResponse);

    // Parse AI response
    let products: Array<any> = [];
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        products = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse product data from AI');
    }

    return new Response(
      JSON.stringify({ products }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-product-search:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});