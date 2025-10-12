-- Remove ip_address column from search_logs table to protect user privacy
-- IP addresses can reveal user location and behavior, creating unnecessary privacy risk

ALTER TABLE public.search_logs DROP COLUMN IF EXISTS ip_address;