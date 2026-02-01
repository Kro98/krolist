-- Create table for site-wide theme settings
CREATE TABLE public.site_theme_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  theme_key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_theme_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read theme settings
CREATE POLICY "Anyone can view theme settings" 
ON public.site_theme_settings 
FOR SELECT 
USING (true);

-- Only admins can modify theme settings
CREATE POLICY "Only admins can manage theme settings" 
ON public.site_theme_settings 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Insert default themes
INSERT INTO public.site_theme_settings (theme_key, is_active) VALUES
  ('ramadan', false),
  ('eid', false);

-- Create trigger for updated_at
CREATE TRIGGER update_site_theme_settings_updated_at
BEFORE UPDATE ON public.site_theme_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();