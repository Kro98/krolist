-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule auto-update-prices every 4 days at 3:00 AM UTC
SELECT cron.schedule(
  'auto-update-prices-every-4-days',
  '0 3 */4 * *',
  $$
  SELECT
    net.http_post(
      url := 'https://cnmdwgdizfrvyplllmdn.supabase.co/functions/v1/auto-update-prices',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubWR3Z2RpemZydnlwbGxsbWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0Mjk3MjksImV4cCI6MjA3NDAwNTcyOX0.OYMhi7Hj5xu5lXJMdCJJvb-k2HeIALRdE6-bH7GGBBY"}'::jsonb,
      body := '{"collection_title": "all"}'::jsonb
    ) AS request_id;
  $$
);