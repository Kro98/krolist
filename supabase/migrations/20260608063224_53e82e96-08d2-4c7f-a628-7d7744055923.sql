
-- 1) global_counters: replace permissive UPDATE with admin-only + safe RPC
DROP POLICY IF EXISTS "Anyone can update counters" ON public.global_counters;
CREATE POLICY "Admins can update counters"
  ON public.global_counters FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.increment_global_counter(_key text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_val bigint;
BEGIN
  IF _key IS NULL OR length(_key) > 64 THEN
    RAISE EXCEPTION 'invalid key';
  END IF;
  UPDATE public.global_counters
    SET counter_value = counter_value + 1,
        updated_at = now()
    WHERE counter_key = _key
    RETURNING counter_value INTO new_val;
  RETURN new_val;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_global_counter(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_global_counter(text) TO anon, authenticated;

-- 2) service_integrations: remove public read; admin-only
DROP POLICY IF EXISTS "Anyone can view enabled integrations" ON public.service_integrations;

-- 3) orders: require authenticated session for insert
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 4) Lock down SECURITY DEFINER trigger / internal functions from API callers
REVOKE ALL ON FUNCTION public.cleanup_old_login_attempts() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_user_products_from_krolist() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Restrict the user stats function to authenticated users only
REVOKE ALL ON FUNCTION public.get_user_product_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_product_stats(uuid) TO authenticated;
