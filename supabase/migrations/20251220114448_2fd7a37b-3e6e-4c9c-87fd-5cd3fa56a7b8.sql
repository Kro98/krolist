-- Insert the carousel_ads_enabled setting if it doesn't exist
INSERT INTO public.ad_settings (setting_key, setting_value, description)
VALUES ('carousel_ads_enabled', 'true', 'Enable or disable ads between product carousel slides')
ON CONFLICT (setting_key) DO NOTHING;