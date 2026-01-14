-- Backfill initial price history for all existing krolist products
INSERT INTO public.krolist_price_history (product_id, price, original_price, currency, scraped_at)
SELECT 
  id as product_id,
  current_price as price,
  original_price,
  currency,
  COALESCE(last_checked_at, created_at, now()) as scraped_at
FROM public.krolist_products
WHERE NOT EXISTS (
  SELECT 1 FROM public.krolist_price_history 
  WHERE krolist_price_history.product_id = krolist_products.id
);