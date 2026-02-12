-- Create storage bucket for admin assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-assets', 'admin-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload
CREATE POLICY "Admins can upload admin assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'admin-assets' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to update
CREATE POLICY "Admins can update admin assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'admin-assets' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete
CREATE POLICY "Admins can delete admin assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'admin-assets' AND public.has_role(auth.uid(), 'admin'));

-- Public read access
CREATE POLICY "Anyone can view admin assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'admin-assets');