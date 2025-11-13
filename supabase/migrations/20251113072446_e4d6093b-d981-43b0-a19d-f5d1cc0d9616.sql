-- Insert sample news items
INSERT INTO public.news_updates (title_en, title_ar, content_en, content_ar, category, is_published, published_at)
VALUES 
(
  'Welcome to Krolist News & Updates',
  'مرحباً بك في أخبار وتحديثات كروليست',
  'Stay informed about the latest features, improvements, and announcements from Krolist. We''re committed to bringing you the best price tracking experience.',
  'ابق على اطلاع بأحدث الميزات والتحسينات والإعلانات من كروليست. نحن ملتزمون بتقديم أفضل تجربة لتتبع الأسعار.',
  'announcement',
  true,
  now()
),
(
  'New Store Integration: Amazon',
  'تكامل متجر جديد: أمازون',
  'We''ve added support for Amazon products! You can now track prices from Amazon alongside your other favorite stores.',
  'لقد أضفنا دعمًا لمنتجات أمازون! يمكنك الآن تتبع الأسعار من أمازون جنبًا إلى جنب مع متاجرك المفضلة الأخرى.',
  'feature',
  true,
  now() - interval '2 days'
),
(
  'Price Refresh System Improved',
  'تحسين نظام تحديث الأسعار',
  'We''ve optimized our price refresh system to provide faster and more accurate price updates. Enjoy real-time price tracking!',
  'لقد قمنا بتحسين نظام تحديث الأسعار لدينا لتوفير تحديثات أسعار أسرع وأكثر دقة. استمتع بتتبع الأسعار في الوقت الفعلي!',
  'update',
  true,
  now() - interval '5 days'
);

-- Insert What's New content
INSERT INTO public.page_content (page_key, content_en, content_ar, description, content_type)
VALUES (
  'news_whats_new',
  E'• Integration with more Saudi stores (Namshi, Trendyol, ASOS)\n• Advanced price history tracking and alerts\n• Improved refresh system for real-time updates\n• Enhanced filtering and sorting options\n• Mobile-optimized experience',
  E'• التكامل مع المزيد من المتاجر السعودية (نمشي، ترنديول، أسوس)\n• تتبع متقدم لتاريخ الأسعار والتنبيهات\n• نظام تحديث محسّن للتحديثات في الوقت الفعلي\n• خيارات تصفية وفرز محسّنة\n• تجربة محسّنة للهواتف المحمولة',
  'What''s New section content for News & Updates page',
  'text'
)
ON CONFLICT (page_key) 
DO UPDATE SET 
  content_en = EXCLUDED.content_en,
  content_ar = EXCLUDED.content_ar,
  updated_at = now();