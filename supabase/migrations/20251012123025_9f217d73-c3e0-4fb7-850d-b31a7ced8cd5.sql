-- Fix the cron job by using search_path instead of schema qualification
-- This allows pg_cron to work properly while keeping extensions in the extensions schema

-- Set search path to include extensions schema
ALTER DATABASE postgres SET search_path TO public, extensions;

-- Drop and recreate the cron job with proper function references
SELECT cron.unschedule('weekly-price-check');

SELECT cron.schedule(
  'weekly-price-check',
  '0 2 * * 1', -- Every Monday at 2 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://cnmdwgdizfrvyplllmdn.supabase.co/functions/v1/check-prices',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubWR3Z2RpemZydnlwbGxsbWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0Mjk3MjksImV4cCI6MjA3NDAwNTcyOX0.OYMhi7Hj5xu5lXJMdCJJvb-k2HeIALRdE6-bH7GGBBY"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);