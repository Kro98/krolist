-- Create a price history table for krolist products
CREATE TABLE public.krolist_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.krolist_products(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  currency TEXT NOT NULL DEFAULT 'SAR',
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_krolist_price_history_product_id ON public.krolist_price_history(product_id);
CREATE INDEX idx_krolist_price_history_scraped_at ON public.krolist_price_history(scraped_at DESC);

-- Enable RLS
ALTER TABLE public.krolist_price_history ENABLE ROW LEVEL SECURITY;

-- Anyone can view krolist price history
CREATE POLICY "Anyone can view krolist price history"
  ON public.krolist_price_history
  FOR SELECT
  USING (true);

-- Only admins can insert krolist price history
CREATE POLICY "Admins can insert krolist price history"
  ON public.krolist_price_history
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete krolist price history
CREATE POLICY "Admins can delete krolist price history"
  ON public.krolist_price_history
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));