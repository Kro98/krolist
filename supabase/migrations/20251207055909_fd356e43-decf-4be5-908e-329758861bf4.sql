-- Fix 1: Remove anonymous access from orders table
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders" ON public.orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fix 2: Add write protection to exchange_rates table
CREATE POLICY "Only service role can insert rates" ON public.exchange_rates
FOR INSERT WITH CHECK (false);

CREATE POLICY "Only service role can update rates" ON public.exchange_rates
FOR UPDATE USING (false);

CREATE POLICY "Only service role can delete rates" ON public.exchange_rates
FOR DELETE USING (false);