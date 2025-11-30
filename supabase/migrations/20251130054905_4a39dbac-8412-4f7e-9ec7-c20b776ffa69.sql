-- Update the trigger function to also create price history entries
CREATE OR REPLACE FUNCTION public.update_user_products_from_krolist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update all user products that reference this krolist product via external_id
  -- and insert price history for products where price changed
  INSERT INTO price_history (product_id, price, original_price, currency, scraped_at)
  SELECT 
    p.id,
    NEW.current_price,
    p.original_price,
    NEW.currency,
    NEW.last_checked_at
  FROM products p
  WHERE p.external_id = NEW.id::text 
    AND p.current_price != NEW.current_price;
  
  -- Update the products
  UPDATE products
  SET 
    current_price = NEW.current_price,
    last_checked_at = NEW.last_checked_at,
    currency = NEW.currency
  WHERE external_id = NEW.id::text;
  
  RETURN NEW;
END;
$function$;