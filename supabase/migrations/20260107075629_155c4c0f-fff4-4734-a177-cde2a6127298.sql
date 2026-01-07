-- Drop the restrictive update policy for admins on Krolist promo codes
-- The current "Admins can manage all promo codes" policy should handle this, 
-- but let's ensure it's properly set up

-- First, let's verify and recreate the admin policy to ensure it covers Krolist codes
DROP POLICY IF EXISTS "Admins can manage all promo codes" ON public.promo_codes;

CREATE POLICY "Admins can manage all promo codes" 
ON public.promo_codes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));