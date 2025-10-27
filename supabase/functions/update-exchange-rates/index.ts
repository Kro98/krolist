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
    console.log('Starting exchange rate update...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false
        }
      }
    );

    // Fetch latest exchange rates from ExchangeRate-API (free tier)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error(`ExchangeRate API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Exchange rates fetched:', data);

    // Extract rates we care about
    const rates = {
      USD: 1,
      SAR: data.rates.SAR || 3.75,
      EGP: data.rates.EGP || 30.90,
      AED: data.rates.AED || 3.67,
    };

    console.log('Updating database with rates:', rates);

    // Update each rate in the database
    const updates = Object.entries(rates).map(async ([currency, rate]) => {
      const { error } = await supabaseClient
        .from('exchange_rates')
        .upsert({
          currency,
          rate_to_usd: 1 / rate, // Store as "how much of this currency equals 1 USD"
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'currency'
        });

      if (error) {
        console.error(`Error updating ${currency}:`, error);
        throw error;
      }

      return { currency, rate };
    });

    await Promise.all(updates);

    console.log('Exchange rates updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        rates,
        updated_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error updating exchange rates:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to update exchange rates',
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
