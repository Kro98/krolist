-- Create shop_campaigns table for managing promotional links in shop dialogs
CREATE TABLE public.shop_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id text NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  campaign_url text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_campaigns ENABLE ROW LEVEL SECURITY;

-- Anyone can view active campaigns
CREATE POLICY "Anyone can view active shop campaigns"
  ON public.shop_campaigns
  FOR SELECT
  USING (is_active = true);

-- Admins can manage all campaigns
CREATE POLICY "Admins can manage shop campaigns"
  ON public.shop_campaigns
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_shop_campaigns_updated_at
  BEFORE UPDATE ON public.shop_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial Shein campaigns
INSERT INTO public.shop_campaigns (shop_id, title, description, image_url, campaign_url, display_order) VALUES
  ('shein', 'Spring Summer Bestsellers', 'Grab lingerie & pajama deals at 80% OFF! New users get 50% OFF coupons. Search ADSQGW9 on the SHEIN App.', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=300&fit=crop', 'https://onelink.shein.com/k6j1/lhuvlb9r', 1),
  ('shein', 'Festive Beauty, Endless Cheer!', 'Up To 90% OFF! Search R2T9M43 on the SHEIN App or Click the link to get started!', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop', 'https://onelink.shein.com/9w3h/r2t9m43', 2),
  ('shein', 'Gift Yourself a Workout', 'Up To 90% OFF! Search ZPS4545 on the SHEIN App.', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop', 'https://onelink.shein.com/22/59yf418b3khs', 3),
  ('shein', 'Wrap Tech for Loved Ones', 'Up To 90% OFF! Search 402K6Q0 on the SHEIN App or Click the link to get started!', 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=300&fit=crop', 'https://onelink.shein.com/wrap-tech', 4),
  ('shein', 'ALL UNDER AED 19 - LIMITED TIME!', 'EXTRA -50% COUPON for New Users Only! Search 6NSDL64 on the SHEIN App.', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop', 'https://onelink.shein.com/all-under-19', 5),
  ('shein', 'AUTUMN-WINTER HOT SALE', 'Up to 90% Off on Bags & Shoes! 60% OFF COUPON for every New User! Search W42AH56.', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop', 'https://onelink.shein.com/hot-sale', 6),
  ('shein', 'Trending Brands - UP TO 40% OFF', 'Can''t believe it! SHEIN now offers up to 40% OFF on top brands. 50% OFF COUPON for every New User!', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=300&fit=crop', 'https://onelink.shein.com/trending-brands', 7);