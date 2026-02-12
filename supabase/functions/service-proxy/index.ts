import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Generic Service Proxy
 * Routes requests to any configured service based on service_key.
 * No hardcoded API keys — reads everything from service_integrations + secrets at runtime.
 * 
 * Usage: POST /service-proxy
 * Body: { service_key: "openai", action: "chat", payload: { ... } }
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { service_key, action, payload } = await req.json();

    if (!service_key) {
      return new Response(
        JSON.stringify({ error: 'service_key is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch integration config
    const { data: integration, error: intError } = await supabase
      .from('service_integrations')
      .select('*')
      .eq('service_key', service_key)
      .eq('is_enabled', true)
      .single();

    if (intError || !integration) {
      return new Response(
        JSON.stringify({ error: `Service "${service_key}" is not configured or not enabled` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gather secrets for this service
    const secrets: Record<string, string> = {};
    for (const key of (integration.secret_keys || [])) {
      const val = Deno.env.get(key);
      if (val) secrets[key] = val;
    }

    // Route to handler
    const result = await routeService(service_key, action, payload, integration.config, secrets);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('service-proxy error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function routeService(
  serviceKey: string,
  action: string,
  payload: any,
  config: Record<string, any>,
  secrets: Record<string, string>
): Promise<any> {
  switch (serviceKey) {
    case 'openai':
      return handleOpenAI(action, payload, secrets);
    case 'sendgrid':
      return handleSendGrid(action, payload, secrets, config);
    case 'mailchimp':
      return handleMailchimp(action, payload, secrets, config);
    case 'twilio':
      return handleTwilio(action, payload, secrets, config);
    default:
      // Generic webhook/API call — config should have an "api_url" 
      return handleGenericAPI(action, payload, config, secrets);
  }
}

async function handleOpenAI(action: string, payload: any, secrets: Record<string, string>) {
  const apiKey = secrets['OPENAI_API_KEY'];
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const endpoint = action === 'chat' ? 'chat/completions' : action;
  const res = await fetch(`https://api.openai.com/v1/${endpoint}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${err}`);
  }
  return await res.json();
}

async function handleSendGrid(action: string, payload: any, secrets: Record<string, string>, config: Record<string, any>) {
  const apiKey = secrets['SENDGRID_API_KEY'];
  if (!apiKey) throw new Error('SENDGRID_API_KEY not configured');

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: payload.to.map((e: string) => ({ email: e })) }],
      from: { email: config.from_email || payload.from },
      subject: payload.subject,
      content: [{ type: 'text/html', value: payload.html }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SendGrid error ${res.status}: ${err}`);
  }
  return { success: true, status: res.status };
}

async function handleMailchimp(action: string, payload: any, secrets: Record<string, string>, config: Record<string, any>) {
  const apiKey = secrets['MAILCHIMP_API_KEY'];
  if (!apiKey) throw new Error('MAILCHIMP_API_KEY not configured');

  const dc = apiKey.split('-').pop();
  const listId = config.list_id || payload.list_id;
  if (!listId) throw new Error('list_id not configured');

  if (action === 'subscribe') {
    const res = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`, {
      method: 'POST',
      headers: { 'Authorization': `apikey ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_address: payload.email, status: 'subscribed', merge_fields: payload.merge_fields || {} }),
    });
    return await res.json();
  }

  throw new Error(`Unknown Mailchimp action: ${action}`);
}

async function handleTwilio(action: string, payload: any, secrets: Record<string, string>, config: Record<string, any>) {
  const sid = secrets['TWILIO_ACCOUNT_SID'];
  const token = secrets['TWILIO_AUTH_TOKEN'];
  if (!sid || !token) throw new Error('Twilio credentials not configured');

  if (action === 'send_sms') {
    const from = config.from_number || payload.from;
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${sid}:${token}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: payload.to, From: from, Body: payload.body }),
    });
    return await res.json();
  }

  throw new Error(`Unknown Twilio action: ${action}`);
}

async function handleGenericAPI(action: string, payload: any, config: Record<string, any>, secrets: Record<string, string>) {
  const apiUrl = config.api_url;
  if (!apiUrl) throw new Error('No api_url configured for this service. Add it in the Integration Hub config.');

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  // Auto-add auth header if a secret key pattern matches
  const authKey = Object.keys(secrets)[0];
  if (authKey) {
    headers['Authorization'] = `Bearer ${secrets[authKey]}`;
  }

  const res = await fetch(`${apiUrl}${action ? `/${action}` : ''}`, {
    method: payload ? 'POST' : 'GET',
    headers,
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('json')) return await res.json();
  return { response: await res.text() };
}
