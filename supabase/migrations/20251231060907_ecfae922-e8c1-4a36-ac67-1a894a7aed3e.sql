-- Add custom_image_url column to promo_codes table for user-uploaded store images
ALTER TABLE public.promo_codes 
ADD COLUMN IF NOT EXISTS custom_image_url TEXT;

-- Create storage bucket for promo code store images
INSERT INTO storage.buckets (id, name, public)
VALUES ('promo-store-images', 'promo-store-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own promo store images
CREATE POLICY "Users can upload promo store images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'promo-store-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own promo store images
CREATE POLICY "Users can update their promo store images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'promo-store-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own promo store images
CREATE POLICY "Users can delete their promo store images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'promo-store-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone to view promo store images (they're public)
CREATE POLICY "Anyone can view promo store images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'promo-store-images');