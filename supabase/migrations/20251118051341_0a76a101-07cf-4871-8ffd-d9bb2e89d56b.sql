-- Fix the type mismatch in the update_user_products_from_krolist function
CREATE OR REPLACE FUNCTION public.update_user_products_from_krolist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update all user products that reference this krolist product via external_id
  -- Cast NEW.id::text to match the external_id text column
  UPDATE products
  SET 
    current_price = NEW.current_price,
    last_checked_at = NEW.last_checked_at
  WHERE external_id = NEW.id::text;
  
  RETURN NEW;
END;
$function$;