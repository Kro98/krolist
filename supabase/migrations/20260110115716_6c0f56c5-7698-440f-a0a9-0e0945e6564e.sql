-- Add image_fit column to products table
ALTER TABLE public.products 
ADD COLUMN image_fit text DEFAULT 'contain' CHECK (image_fit IN ('contain', 'cover'));

-- Add image_fit column to krolist_products table for consistency
ALTER TABLE public.krolist_products 
ADD COLUMN image_fit text DEFAULT 'contain' CHECK (image_fit IN ('contain', 'cover'));