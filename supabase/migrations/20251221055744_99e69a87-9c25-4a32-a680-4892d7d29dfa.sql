-- Drop the push_subscriptions table and all its policies
-- This removes web push notification functionality entirely

DROP TABLE IF EXISTS public.push_subscriptions CASCADE;