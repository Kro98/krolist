-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view featured krolist products" ON public.krolist_products;

-- Create a new policy that allows viewing products that are featured OR in a category
CREATE POLICY "Anyone can view krolist products in categories or featured" 
ON public.krolist_products 
FOR SELECT 
USING (
  is_featured = true 
  OR 
  EXISTS (
    SELECT 1 FROM public.category_products 
    WHERE category_products.product_id = krolist_products.id
  )
);