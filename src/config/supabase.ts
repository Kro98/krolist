/**
 * Central Supabase configuration
 * 
 * All Supabase URLs and keys are defined here once.
 * When migrating to a new Supabase project or hosting service,
 * only this file and src/integrations/supabase/client.ts need updating.
 * 
 * For self-hosting or importing to another platform:
 * 1. Update SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY below
 * 2. Update the same values in src/integrations/supabase/client.ts
 * 3. Update .env if present
 * 4. Re-deploy edge functions to the new Supabase project
 */

export const SUPABASE_URL = "https://cnmdwgdizfrvyplllmdn.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubWR3Z2RpemZydnlwbGxsbWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0Mjk3MjksImV4cCI6MjA3NDAwNTcyOX0.OYMhi7Hj5xu5lXJMdCJJvb-k2HeIALRdE6-bH7GGBBY";

/** Build a full edge function URL */
export const edgeFunctionUrl = (fnName: string) =>
  `${SUPABASE_URL}/functions/v1/${fnName}`;

/** Build a full REST API URL for a table */
export const restApiUrl = (path: string) =>
  `${SUPABASE_URL}/rest/v1/${path}`;

/** Standard headers for direct REST calls (when not using the SDK) */
export const restHeaders = {
  'apikey': SUPABASE_PUBLISHABLE_KEY,
  'Content-Type': 'application/json',
};
