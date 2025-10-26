-- Add currency conversion columns to products table
ALTER TABLE products 
ADD COLUMN original_price NUMERIC,
ADD COLUMN original_currency TEXT DEFAULT 'SAR';

-- Migrate existing data
UPDATE products 
SET original_price = current_price,
    original_currency = currency
WHERE original_price IS NULL;

-- Make columns non-nullable after migration
ALTER TABLE products 
ALTER COLUMN original_price SET NOT NULL,
ALTER COLUMN original_currency SET NOT NULL;

-- Update get_user_product_stats function to remove total_value calculation
CREATE OR REPLACE FUNCTION public.get_user_product_stats(user_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result json;
  total_count int;
  drops_count int;
  increases_count int;
BEGIN
  -- Get total products count
  SELECT count(*) INTO total_count
  FROM products
  WHERE user_id = user_uuid AND is_active = true;
  
  -- Count price drops and increases
  SELECT 
    COUNT(*) FILTER (WHERE current_price < prev_price) AS drops,
    COUNT(*) FILTER (WHERE current_price > prev_price) AS increases
  INTO drops_count, increases_count
  FROM (
    SELECT 
      p.id,
      p.current_price,
      (
        SELECT ph.price 
        FROM price_history ph 
        WHERE ph.product_id = p.id 
        ORDER BY ph.scraped_at DESC 
        LIMIT 1 OFFSET 1
      ) AS prev_price
    FROM products p
    WHERE p.user_id = user_uuid AND p.is_active = true
  ) AS price_comparison
  WHERE prev_price IS NOT NULL;
  
  result := json_build_object(
    'total_products', total_count,
    'price_drops', COALESCE(drops_count, 0),
    'price_increases', COALESCE(increases_count, 0)
  );
  
  RETURN result;
END;
$function$;