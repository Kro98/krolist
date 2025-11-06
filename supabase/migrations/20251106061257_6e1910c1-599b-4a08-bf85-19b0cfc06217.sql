-- Create table for category collections
CREATE TABLE IF NOT EXISTS public.category_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  icon_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.category_collections ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view active categories
CREATE POLICY "Anyone can view active categories"
ON public.category_collections
FOR SELECT
USING (is_active = true);

-- Allow admins to manage categories
CREATE POLICY "Admins can manage categories"
ON public.category_collections
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add status field to existing shops configuration if needed
-- Since shops are managed in localStorage via ShopManager component,
-- we'll handle this in the frontend code

-- Create trigger for updated_at
CREATE TRIGGER update_category_collections_updated_at
BEFORE UPDATE ON public.category_collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();