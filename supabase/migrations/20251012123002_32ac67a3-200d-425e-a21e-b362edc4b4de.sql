-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a scheduled cron job to check prices weekly
-- This will run every Monday at 2 AM UTC
SELECT cron.schedule(
  'weekly-price-check',
  '0 2 * * 1', -- Every Monday at 2 AM
  $$
  SELECT
    net.http_post(
      url := 'https://cnmdwgdizfrvyplllmdn.supabase.co/functions/v1/check-prices',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubWR3Z2RpemZydnlwbGxsbWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0Mjk3MjksImV4cCI6MjA3NDAwNTcyOX0.OYMhi7Hj5xu5lXJMdCJJvb-k2HeIALRdE6-bH7GGBBY"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- View scheduled cron jobs
SELECT * FROM cron.job;