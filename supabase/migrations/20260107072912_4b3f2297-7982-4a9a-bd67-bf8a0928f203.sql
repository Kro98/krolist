-- Add new columns to promo_codes table for individual card customization
ALTER TABLE public.promo_codes 
ADD COLUMN IF NOT EXISTS custom_shop_name TEXT,
ADD COLUMN IF NOT EXISTS custom_icon_url TEXT,
ADD COLUMN IF NOT EXISTS card_color TEXT DEFAULT '#7c3aed',
ADD COLUMN IF NOT EXISTS card_background TEXT,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add index for ordering
CREATE INDEX IF NOT EXISTS idx_promo_codes_display_order ON public.promo_codes(display_order);

-- Update comment
COMMENT ON COLUMN public.promo_codes.custom_shop_name IS 'Custom shop name override';
COMMENT ON COLUMN public.promo_codes.custom_icon_url IS 'Custom icon/logo URL for the promo card';
COMMENT ON COLUMN public.promo_codes.card_color IS 'Primary gradient color for the promo card';
COMMENT ON COLUMN public.promo_codes.card_background IS 'Background image URL for the promo card';