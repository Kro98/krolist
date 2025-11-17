-- Create trigger function to propagate krolist product price updates to user products
CREATE OR REPLACE FUNCTION update_user_products_from_krolist()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all user products that reference this krolist product via external_id
  UPDATE products
  SET 
    current_price = NEW.current_price,
    last_checked_at = NEW.last_checked_at
  WHERE external_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on krolist_products table
CREATE TRIGGER krolist_price_update_trigger
AFTER UPDATE OF current_price ON krolist_products
FOR EACH ROW
EXECUTE FUNCTION update_user_products_from_krolist();