-- Drop the complex policy
DROP POLICY IF EXISTS "Anyone can view krolist products in categories or featured" ON public.krolist_products;

-- Create a simple policy that allows anyone to view all krolist products
-- Since these are admin-curated products, they should all be publicly visible
CREATE POLICY "Anyone can view all krolist products" 
ON public.krolist_products 
FOR SELECT 
USING (true);