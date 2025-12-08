-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view category products" ON public.category_products;

-- Create a truly public policy that allows everyone (including anonymous users) to view
CREATE POLICY "Anyone can view category products"
ON public.category_products
FOR SELECT
USING (true);