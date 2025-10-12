-- Move pg_net extension from public schema to extensions schema
-- This fixes the "Extension in Public" security finding

-- Drop the extension from public schema
DROP EXTENSION IF EXISTS pg_net CASCADE;

-- Create the extension in the extensions schema
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Update search_path to include extensions schema so pg_net functions are accessible
ALTER DATABASE postgres SET search_path TO public, extensions;

-- Grant usage on extensions schema to authenticated users if needed
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;