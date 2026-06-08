
DROP VIEW IF EXISTS public.public_integrations;

CREATE OR REPLACE FUNCTION public.get_public_integrations()
RETURNS TABLE (
  id uuid,
  service_key text,
  service_name text,
  category text,
  is_enabled boolean,
  config jsonb,
  icon_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, service_key, service_name, category, is_enabled, config, icon_url
  FROM public.service_integrations
  WHERE is_enabled = true;
$$;

REVOKE ALL ON FUNCTION public.get_public_integrations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_integrations() TO anon, authenticated;
