import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { secretName } = await req.json();
    if (!secretName) {
      return new Response(JSON.stringify({ error: 'secretName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const value = Deno.env.get(secretName);
    if (!value) {
      return new Response(JSON.stringify({ 
        success: false, 
        status: 'not_found',
        message: `Secret "${secretName}" is not set or empty in environment` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Test based on secret name pattern
    const result = await testSecret(secretName, value);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('test-secret-connection error:', error);
    return new Response(JSON.stringify({ success: false, status: 'error', message: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function testSecret(name: string, value: string): Promise<{ success: boolean; status: string; message: string }> {
  const upperName = name.toUpperCase();

  // Amazon PA-API keys
  if (upperName.includes('AMAZON_ACCESS_KEY') || upperName.includes('AMAZON_SECRET_KEY') || upperName.includes('AMAZON_PARTNER_TAG')) {
    return testAmazonKey(upperName, value);
  }

  // OpenAI
  if (upperName.includes('OPENAI')) {
    return testOpenAI(value);
  }

  // Generic Bearer token test (try common pattern)
  if (upperName.includes('API_KEY') || upperName.includes('TOKEN') || upperName.includes('SECRET')) {
    // We can only confirm the secret exists and is non-empty
    return {
      success: true,
      status: 'exists',
      message: `Secret is set (${value.length} chars). No specific test available for this key type.`,
    };
  }

  return {
    success: true,
    status: 'exists',
    message: `Secret is set (${value.length} chars). No specific test available.`,
  };
}

async function testAmazonKey(name: string, value: string): Promise<{ success: boolean; status: string; message: string }> {
  if (name.includes('PARTNER_TAG')) {
    // Can't validate partner tag alone, just check format
    if (value.includes('-')) {
      return { success: true, status: 'valid_format', message: `Partner tag format looks valid: ${value.substring(0, 4)}...` };
    }
    return { success: false, status: 'invalid_format', message: 'Partner tag should contain a hyphen (e.g., mytag-20)' };
  }

  if (name.includes('ACCESS_KEY')) {
    if (value.startsWith('AK') && value.length >= 16) {
      return { success: true, status: 'valid_format', message: `Access key format valid (${value.length} chars, starts with ${value.substring(0, 4)}...)` };
    }
    return { success: false, status: 'invalid_format', message: 'Access key should start with "AK" and be at least 16 characters' };
  }

  if (name.includes('SECRET_KEY')) {
    if (value.length >= 30) {
      return { success: true, status: 'valid_format', message: `Secret key is set (${value.length} chars)` };
    }
    return { success: false, status: 'invalid_format', message: 'Secret key seems too short (expected 40+ chars)' };
  }

  return { success: true, status: 'exists', message: `Amazon key is set (${value.length} chars)` };
}

async function testOpenAI(apiKey: string): Promise<{ success: boolean; status: string; message: string }> {
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (res.ok) {
      return { success: true, status: 'connected', message: 'OpenAI API key is valid and connected' };
    }

    if (res.status === 401) {
      return { success: false, status: 'invalid', message: 'OpenAI API key is invalid or expired' };
    }

    if (res.status === 429) {
      return { success: true, status: 'rate_limited', message: 'Key is valid but rate-limited. Try again later.' };
    }

    return { success: false, status: 'error', message: `OpenAI returned status ${res.status}` };
  } catch (e) {
    return { success: false, status: 'error', message: `Failed to reach OpenAI: ${e.message}` };
  }
}
