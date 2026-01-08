-- Create storage bucket for promo code images
INSERT INTO storage.buckets (id, name, public)
VALUES ('promo-code-images', 'promo-code-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload promo code images
CREATE POLICY "Admins can upload promo code images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'promo-code-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update promo code images
CREATE POLICY "Admins can update promo code images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'promo-code-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete promo code images
CREATE POLICY "Admins can delete promo code images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'promo-code-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow public read access since bucket is public
CREATE POLICY "Public can view promo code images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'promo-code-images');