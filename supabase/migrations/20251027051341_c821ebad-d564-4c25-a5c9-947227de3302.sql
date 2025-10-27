-- Phase 2: Database Migration for Hard-Code Removal

-- 1. Create store_promotions table for dynamic promotional badges
CREATE TABLE IF NOT EXISTS public.store_promotions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id text NOT NULL,
  badge_text text NOT NULL,
  badge_color text NOT NULL DEFAULT 'blue',
  expires_at timestamptz,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on store_promotions
ALTER TABLE public.store_promotions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active promotions
CREATE POLICY "Anyone can view active store promotions"
  ON public.store_promotions
  FOR SELECT
  USING (active = true AND (expires_at IS NULL OR expires_at > now()));

-- 2. Add is_krolist flag to promo_codes table
ALTER TABLE public.promo_codes 
ADD COLUMN IF NOT EXISTS is_krolist boolean DEFAULT false;

-- 3. Create exchange_rates table for dynamic currency conversion
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  currency text PRIMARY KEY,
  rate_to_usd numeric NOT NULL,
  updated_at timestamptz DEFAULT now(),
  CHECK (rate_to_usd > 0)
);

-- Enable RLS on exchange_rates
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view exchange rates
CREATE POLICY "Anyone can view exchange rates"
  ON public.exchange_rates
  FOR SELECT
  USING (true);

-- 4. Insert initial exchange rates
INSERT INTO public.exchange_rates (currency, rate_to_usd, updated_at)
VALUES 
  ('USD', 1, now()),
  ('SAR', 3.75, now()),
  ('EGP', 30.90, now()),
  ('AED', 3.67, now())
ON CONFLICT (currency) DO UPDATE 
SET rate_to_usd = EXCLUDED.rate_to_usd, updated_at = now();

-- 5. Insert initial store promotions (from AppSidebar hard-coded data)
INSERT INTO public.store_promotions (store_id, badge_text, badge_color, active)
VALUES 
  ('noon', 'KINGDOME', 'emerald', true),
  ('noon', 'save 10 rial', 'orange', true),
  ('shein', 'search for', 'blue', true),
  ('shein', 'R2M6A', 'purple', true)
ON CONFLICT DO NOTHING;

-- 6. Update trigger for store_promotions updated_at
CREATE TRIGGER update_store_promotions_updated_at
BEFORE UPDATE ON public.store_promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();