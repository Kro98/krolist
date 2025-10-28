-- Create krolist_products table for curated products
CREATE TABLE IF NOT EXISTS public.krolist_products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  image_url text,
  category text,
  store text NOT NULL,
  product_url text NOT NULL,
  current_price numeric NOT NULL,
  original_price numeric NOT NULL,
  original_currency text NOT NULL DEFAULT 'SAR',
  currency text NOT NULL DEFAULT 'SAR',
  is_featured boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_checked_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.krolist_products ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view featured products
CREATE POLICY "Anyone can view featured krolist products"
  ON public.krolist_products
  FOR SELECT
  USING (is_featured = true);

-- Create index for performance
CREATE INDEX idx_krolist_products_featured ON public.krolist_products(is_featured) WHERE is_featured = true;