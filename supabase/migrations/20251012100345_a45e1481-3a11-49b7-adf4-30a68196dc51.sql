-- Add INSERT policy for price_history table
-- Users should be able to insert price history for their own products
CREATE POLICY "Users can insert price history for their products"
ON price_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = price_history.product_id 
    AND products.user_id = auth.uid()
  )
);