-- Add availability_status column to krolist_products
ALTER TABLE public.krolist_products 
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available' 
CHECK (availability_status IN ('available', 'currently_unavailable', 'ran_out'));