-- Fix get_user_product_stats to calculate total value from ALL products
-- Previous version only summed products with price history, excluding new products

CREATE OR REPLACE FUNCTION public.get_user_product_stats(user_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  total_count int;
  drops_count int;
  increases_count int;
  total_val numeric;
BEGIN
  -- Get total products count
  SELECT count(*) INTO total_count
  FROM products
  WHERE user_id = user_uuid AND is_active = true;
  
  -- Calculate total value from ALL active products
  SELECT COALESCE(SUM(current_price), 0) INTO total_val
  FROM products
  WHERE user_id = user_uuid AND is_active = true;
  
  -- Count price drops and increases only from products with price history
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
    'price_increases', COALESCE(increases_count, 0),
    'total_value', COALESCE(total_val, 0)
  );
  
  RETURN result;
END;
$$;