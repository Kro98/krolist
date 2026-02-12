import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PROJECT_REF = 'cnmdwgdizfrvyplllmdn';
const MANAGEMENT_API = `https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets`;

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

    const mgmtToken = Deno.env.get('SB_MANAGEMENT_TOKEN');
    if (!mgmtToken) {
      return new Response(JSON.stringify({ error: 'Management token not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mgmtHeaders = {
      'Authorization': `Bearer ${mgmtToken}`,
      'Content-Type': 'application/json',
    };

    // Protected secret names that cannot be deleted/modified from the UI
    const PROTECTED_SECRETS = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_DB_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SB_MANAGEMENT_TOKEN'];

    if (req.method === 'GET') {
      // List secrets (names only — Management API doesn't return values)
      const res = await fetch(MANAGEMENT_API, { headers: mgmtHeaders });
      if (!res.ok) {
        const errText = await res.text();
        console.error('Management API error:', errText);
        return new Response(JSON.stringify({ error: 'Failed to fetch secrets' }), {
          status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const secrets = await res.json();
      // Return names only, mark protected ones
      const result = secrets.map((s: any) => ({
        name: s.name,
        protected: PROTECTED_SECRETS.includes(s.name),
      }));
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      // Create or update a secret
      const { name, value } = await req.json();
      if (!name || !value) {
        return new Response(JSON.stringify({ error: 'Name and value required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const res = await fetch(MANAGEMENT_API, {
        method: 'POST',
        headers: mgmtHeaders,
        body: JSON.stringify([{ name, value }]),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Management API error:', errText);
        return new Response(JSON.stringify({ error: 'Failed to save secret' }), {
          status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await res.text(); // consume body
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'DELETE') {
      const { names } = await req.json();
      if (!names || !Array.isArray(names) || names.length === 0) {
        return new Response(JSON.stringify({ error: 'Names array required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Block deleting protected secrets
      const blocked = names.filter((n: string) => PROTECTED_SECRETS.includes(n));
      if (blocked.length > 0) {
        return new Response(JSON.stringify({ error: `Cannot delete protected secrets: ${blocked.join(', ')}` }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const res = await fetch(MANAGEMENT_API, {
        method: 'DELETE',
        headers: mgmtHeaders,
        body: JSON.stringify(names),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Management API error:', errText);
        return new Response(JSON.stringify({ error: 'Failed to delete secret(s)' }), {
          status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await res.text();
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('manage-secrets error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
