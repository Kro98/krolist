-- Create stickers table for managing sticker products
CREATE TABLE public.stickers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR',
  image_url TEXT,
  category TEXT,
  stock_status TEXT NOT NULL DEFAULT 'in_stock',
  is_featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;

-- Anyone can view active stickers
CREATE POLICY "Anyone can view active stickers" 
ON public.stickers 
FOR SELECT 
USING (is_active = true);

-- Admins can manage all stickers
CREATE POLICY "Admins can manage all stickers" 
ON public.stickers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_stickers_updated_at
BEFORE UPDATE ON public.stickers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create sticker settings table for WhatsApp number and other configs
CREATE TABLE public.sticker_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.sticker_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read sticker settings
CREATE POLICY "Anyone can read sticker settings" 
ON public.sticker_settings 
FOR SELECT 
USING (true);

-- Admins can manage sticker settings
CREATE POLICY "Admins can manage sticker settings" 
ON public.sticker_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default WhatsApp number setting
INSERT INTO public.sticker_settings (setting_key, setting_value, description)
VALUES ('whatsapp_number', '966500000000', 'WhatsApp number for sticker orders (include country code without +)');