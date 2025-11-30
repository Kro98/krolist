-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_user_product_stats(uuid);

-- Recreate with percentage-based calculations
CREATE OR REPLACE FUNCTION public.get_user_product_stats(user_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result json;
  total_count int;
  avg_drop_pct numeric;
  avg_increase_pct numeric;
BEGIN
  -- Get total products count
  SELECT count(*) INTO total_count
  FROM products
  WHERE user_id = user_uuid AND is_active = true;
  
  -- Calculate average percentage changes
  SELECT 
    AVG(CASE 
      WHEN prev_price > 0 AND current_price < prev_price 
      THEN ((prev_price - current_price) / prev_price * 100)
      ELSE 0 
    END) FILTER (WHERE current_price < prev_price) AS avg_drop,
    AVG(CASE 
      WHEN prev_price > 0 AND current_price > prev_price 
      THEN ((current_price - prev_price) / prev_price * 100)
      ELSE 0 
    END) FILTER (WHERE current_price > prev_price) AS avg_increase
  INTO avg_drop_pct, avg_increase_pct
  FROM (
    SELECT 
      p.id,
      p.current_price,
      p.original_price as prev_price
    FROM products p
    WHERE p.user_id = user_uuid AND p.is_active = true
  ) AS price_comparison
  WHERE prev_price IS NOT NULL AND prev_price > 0;
  
  result := json_build_object(
    'total_products', total_count,
    'price_drops', COALESCE(ROUND(avg_drop_pct, 2), 0),
    'price_increases', COALESCE(ROUND(avg_increase_pct, 2), 0)
  );
  
  RETURN result;
END;
$function$;