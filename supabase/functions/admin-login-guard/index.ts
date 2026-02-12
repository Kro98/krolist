import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_ATTEMPTS_PER_IP = 5;
const MAX_ATTEMPTS_PER_EMAIL = 5;
const LOCKOUT_WINDOW_MINUTES = 30;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Missing credentials' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get client IP from headers (Supabase edge functions receive this)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip')
      || 'unknown';

    const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60 * 1000).toISOString();

    // Check failed attempts by IP and email in parallel
    const [ipCheck, emailCheck] = await Promise.all([
      supabase
        .from('admin_login_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .eq('success', false)
        .gte('attempted_at', windowStart),
      supabase
        .from('admin_login_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('email', email.toLowerCase())
        .eq('success', false)
        .gte('attempted_at', windowStart),
    ]);

    const ipAttempts = ipCheck.count || 0;
    const emailAttempts = emailCheck.count || 0;

    if (ipAttempts >= MAX_ATTEMPTS_PER_IP || emailAttempts >= MAX_ATTEMPTS_PER_EMAIL) {
      // Log the blocked attempt too
      await supabase.from('admin_login_attempts').insert({
        ip_address: ip,
        email: email.toLowerCase(),
        success: false,
      });

      const remainingMinutes = LOCKOUT_WINDOW_MINUTES;
      return new Response(JSON.stringify({
        error: `Too many failed attempts. Try again in ${remainingMinutes} minutes.`,
        locked: true,
        remaining_minutes: remainingMinutes,
      }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Attempt sign in via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      // Log failed attempt
      await supabase.from('admin_login_attempts').insert({
        ip_address: ip,
        email: email.toLowerCase(),
        success: false,
      });

      const attemptsLeft = Math.min(
        MAX_ATTEMPTS_PER_IP - ipAttempts - 1,
        MAX_ATTEMPTS_PER_EMAIL - emailAttempts - 1,
      );

      return new Response(JSON.stringify({
        error: authError?.message || 'Invalid credentials',
        attempts_left: Math.max(0, attemptsLeft),
      }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has admin role
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: authData.user.id,
      _role: 'admin',
    });

    if (!isAdmin) {
      // Sign out the non-admin user immediately
      await supabase.auth.admin.signOut(authData.session!.access_token);

      await supabase.from('admin_login_attempts').insert({
        ip_address: ip,
        email: email.toLowerCase(),
        success: false,
      });

      return new Response(JSON.stringify({
        error: 'Access denied',
        attempts_left: Math.max(0, Math.min(
          MAX_ATTEMPTS_PER_IP - ipAttempts - 1,
          MAX_ATTEMPTS_PER_EMAIL - emailAttempts - 1,
        )),
      }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Success — log it and return session
    await supabase.from('admin_login_attempts').insert({
      ip_address: ip,
      email: email.toLowerCase(),
      success: true,
    });

    return new Response(JSON.stringify({
      session: authData.session,
      user: authData.user,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Admin login guard error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
