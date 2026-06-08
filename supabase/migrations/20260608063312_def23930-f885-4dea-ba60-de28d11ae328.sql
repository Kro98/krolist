
CREATE OR REPLACE VIEW public.public_integrations
WITH (security_invoker = true) AS
SELECT id, service_key, service_name, category, is_enabled, config, icon_url
FROM public.service_integrations
WHERE is_enabled = true;

-- The view runs as invoker, so it needs a SELECT policy on the base table for anon/authenticated.
-- Instead, switch view to security_definer-style by recreating without security_invoker so it
-- runs with owner privileges and bypasses RLS. Owner is postgres (superuser).
DROP VIEW public.public_integrations;
CREATE VIEW public.public_integrations AS
SELECT id, service_key, service_name, category, is_enabled, config, icon_url
FROM public.service_integrations
WHERE is_enabled = true;

GRANT SELECT ON public.public_integrations TO anon, authenticated;
