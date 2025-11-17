-- Fix security warning by setting search_path on the trigger function
CREATE OR REPLACE FUNCTION update_user_products_from_krolist()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update all user products that reference this krolist product via external_id
  UPDATE products
  SET 
    current_price = NEW.current_price,
    last_checked_at = NEW.last_checked_at
  WHERE external_id = NEW.id;
  
  RETURN NEW;
END;
$$;