-- Create ad_settings table for admin-configurable ad settings
CREATE TABLE public.ad_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.ad_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read ad settings
CREATE POLICY "Anyone can read ad settings" 
ON public.ad_settings 
FOR SELECT 
USING (true);

-- Only admins can modify ad settings
CREATE POLICY "Admins can insert ad settings" 
ON public.ad_settings 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update ad settings" 
ON public.ad_settings 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.ad_settings (setting_key, setting_value, description) VALUES
('ad_cooldown_seconds', '30', 'Minimum seconds between ads'),
('ads_disabled_for_admins', 'true', 'Whether ads are disabled for admin users');

-- Create trigger for updated_at
CREATE TRIGGER update_ad_settings_updated_at
BEFORE UPDATE ON public.ad_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();