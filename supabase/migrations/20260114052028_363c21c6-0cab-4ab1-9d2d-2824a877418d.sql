-- Create trigger to automatically update user products when krolist products are updated
CREATE TRIGGER sync_user_products_on_krolist_update
  AFTER UPDATE ON public.krolist_products
  FOR EACH ROW
  WHEN (OLD.current_price IS DISTINCT FROM NEW.current_price)
  EXECUTE FUNCTION public.update_user_products_from_krolist();