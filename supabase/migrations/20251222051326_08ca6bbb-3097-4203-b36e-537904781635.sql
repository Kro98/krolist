-- Add in-feed ad frequency settings
INSERT INTO public.ad_settings (setting_key, setting_value, description)
VALUES 
  ('infeed_ad_frequency_mobile', '5', 'Number of product slides before showing an ad on mobile'),
  ('infeed_ad_frequency_desktop', '8', 'Number of products before showing an inline ad on PC/tablet')
ON CONFLICT (setting_key) DO NOTHING;