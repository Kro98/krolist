-- Create storage bucket for sticker images
INSERT INTO storage.buckets (id, name, public) VALUES ('sticker-images', 'sticker-images', true);

-- Create storage policies for sticker images
CREATE POLICY "Anyone can view sticker images"
ON storage.objects FOR SELECT
USING (bucket_id = 'sticker-images');

CREATE POLICY "Admins can upload sticker images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sticker-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update sticker images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'sticker-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete sticker images"
ON storage.objects FOR DELETE
USING (bucket_id = 'sticker-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Insert sample sticker data
INSERT INTO public.stickers (name, name_ar, description, description_ar, price, currency, category, stock_status, is_featured, is_new, is_active, display_order)
VALUES 
  ('Krolist Logo Sticker', 'ستيكر شعار كروليست', 'Premium vinyl sticker with Krolist logo', 'ستيكر فينيل ممتاز بشعار كروليست', 5, 'SAR', 'Logo', 'in_stock', true, true, true, 1),
  ('Shop Smart Sticker', 'ستيكر تسوق بذكاء', 'Motivational shopping sticker', 'ستيكر تحفيزي للتسوق', 3, 'SAR', 'Motivational', 'in_stock', false, true, true, 2),
  ('Deal Hunter Badge', 'شارة صائد العروض', 'Show off your deal hunting skills', 'أظهر مهاراتك في اصطياد العروض', 7, 'SAR', 'Badge', 'in_stock', true, false, true, 3),
  ('Price Drop Alert', 'تنبيه انخفاض السعر', 'Fun sticker about price drops', 'ستيكر مرح عن انخفاض الأسعار', 4, 'SAR', 'Fun', 'in_stock', false, false, true, 4),
  ('Savings Champion', 'بطل التوفير', 'For the ultimate saver', 'للموفر المحترف', 6, 'SAR', 'Badge', 'low_stock', true, true, true, 5),
  ('Cart Master', 'سيد العربة', 'Master of the shopping cart', 'سيد عربة التسوق', 5, 'SAR', 'Fun', 'in_stock', false, false, true, 6);