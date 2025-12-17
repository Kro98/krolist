-- Create ad_analytics table to track ad impressions and completions
CREATE TABLE public.ad_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_type TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'completion', 'skip')),
  user_type TEXT NOT NULL CHECK (user_type IN ('guest', 'user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert analytics (for tracking)
CREATE POLICY "Anyone can insert ad analytics"
ON public.ad_analytics
FOR INSERT
WITH CHECK (true);

-- Only admins can view analytics
CREATE POLICY "Admins can view ad analytics"
ON public.ad_analytics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_ad_analytics_created_at ON public.ad_analytics(created_at DESC);
CREATE INDEX idx_ad_analytics_trigger_type ON public.ad_analytics(trigger_type);
CREATE INDEX idx_ad_analytics_event_type ON public.ad_analytics(event_type);