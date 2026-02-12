
-- Service Integrations Registry
-- Stores all external service configurations (payment, analytics, email, AI, etc.)
CREATE TABLE public.service_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_key TEXT NOT NULL UNIQUE,          -- e.g. 'stripe', 'google_analytics', 'mailchimp', 'openai'
  service_name TEXT NOT NULL,                -- Human-readable name
  category TEXT NOT NULL DEFAULT 'general',  -- 'payment', 'analytics', 'email', 'ai', 'sms', 'storage', 'other'
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb, -- Non-secret config (tracking IDs, webhook URLs, etc.)
  secret_keys TEXT[] NOT NULL DEFAULT '{}',  -- Names of secrets this service needs (e.g. ['STRIPE_SECRET_KEY'])
  description TEXT,
  icon_url TEXT,
  docs_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage integrations"
  ON public.service_integrations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view enabled integrations"
  ON public.service_integrations FOR SELECT
  USING (is_enabled = true);

-- Feature Flags
-- Toggle any feature on/off from admin without code changes
CREATE TABLE public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_key TEXT NOT NULL UNIQUE,             -- e.g. 'show_stickers', 'enable_comments', 'enable_ai_search'
  flag_name TEXT NOT NULL,                   -- Human-readable name
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL DEFAULT 'general',  -- 'ui', 'backend', 'experimental', 'general'
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb, -- Optional config for the feature
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage feature flags"
  ON public.feature_flags FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view enabled flags"
  ON public.feature_flags FOR SELECT
  USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_service_integrations_updated_at
  BEFORE UPDATE ON public.service_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed common integrations
INSERT INTO public.service_integrations (service_key, service_name, category, description, secret_keys, config) VALUES
  ('google_adsense', 'Google AdSense', 'analytics', 'Display ads on your site', '{}', '{"publisher_id": "", "slots": {}}'::jsonb),
  ('google_analytics', 'Google Analytics', 'analytics', 'Track site traffic and user behavior', '{}', '{"measurement_id": ""}'::jsonb),
  ('meta_pixel', 'Meta Pixel', 'analytics', 'Facebook/Instagram conversion tracking', '{}', '{"pixel_id": ""}'::jsonb),
  ('tiktok_pixel', 'TikTok Pixel', 'analytics', 'TikTok conversion tracking', '{}', '{"pixel_id": ""}'::jsonb),
  ('stripe', 'Stripe', 'payment', 'Accept online payments', ARRAY['STRIPE_SECRET_KEY'], '{"publishable_key": ""}'::jsonb),
  ('openai', 'OpenAI', 'ai', 'AI-powered features', ARRAY['OPENAI_API_KEY'], '{}'::jsonb),
  ('mailchimp', 'Mailchimp', 'email', 'Email marketing and newsletters', ARRAY['MAILCHIMP_API_KEY'], '{"list_id": ""}'::jsonb),
  ('twilio', 'Twilio', 'sms', 'SMS notifications', ARRAY['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'], '{"from_number": ""}'::jsonb),
  ('sendgrid', 'SendGrid', 'email', 'Transactional email delivery', ARRAY['SENDGRID_API_KEY'], '{"from_email": ""}'::jsonb),
  ('amazon_paapi', 'Amazon PA-API', 'affiliate', 'Amazon product affiliate links', ARRAY['AMAZON_ACCESS_KEY', 'AMAZON_SECRET_KEY', 'AMAZON_PARTNER_TAG'], '{}'::jsonb);

-- Seed common feature flags
INSERT INTO public.feature_flags (flag_key, flag_name, category, description, is_enabled) VALUES
  ('show_stickers', 'Stickers Page', 'ui', 'Show/hide the stickers section', true),
  ('show_articles', 'Articles Section', 'ui', 'Show/hide the articles section', true),
  ('enable_comments', 'Article Comments', 'ui', 'Allow comments on articles', true),
  ('enable_ai_search', 'AI Product Search', 'backend', 'Enable AI-powered product search', true),
  ('enable_promo_codes', 'Promo Codes', 'ui', 'Show promo codes section', true),
  ('show_donation', 'Support Dialog', 'ui', 'Show the support/donation dialog', true),
  ('enable_push_notifications', 'Push Notifications', 'backend', 'Enable push notification support', false),
  ('maintenance_mode', 'Maintenance Mode', 'general', 'Put the site in maintenance mode', false);
