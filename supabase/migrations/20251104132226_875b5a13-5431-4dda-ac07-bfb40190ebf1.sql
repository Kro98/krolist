-- Create user_refresh_logs table to track weekly refresh usage
CREATE TABLE public.user_refresh_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_refresh_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  refresh_count INTEGER NOT NULL DEFAULT 0,
  week_start DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_user_refresh_logs_user_id ON public.user_refresh_logs(user_id);
CREATE INDEX idx_user_refresh_logs_week_start ON public.user_refresh_logs(week_start);

-- Enable RLS
ALTER TABLE public.user_refresh_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own refresh logs
CREATE POLICY "Users can view their own refresh logs"
ON public.user_refresh_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own refresh logs
CREATE POLICY "Users can insert their own refresh logs"
ON public.user_refresh_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own refresh logs
CREATE POLICY "Users can update their own refresh logs"
ON public.user_refresh_logs
FOR UPDATE
USING (auth.uid() = user_id);

-- Update products table INSERT policy to enforce 24-item limit
DROP POLICY IF EXISTS "Users can insert their own products" ON public.products;

CREATE POLICY "Users can insert their own products"
ON public.products
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  (SELECT count(*) FROM products WHERE user_id = auth.uid() AND is_active = true) < 24
);

-- Add trigger for updated_at on user_refresh_logs
CREATE TRIGGER update_user_refresh_logs_updated_at
BEFORE UPDATE ON public.user_refresh_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();