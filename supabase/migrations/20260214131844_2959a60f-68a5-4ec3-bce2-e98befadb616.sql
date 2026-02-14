
-- Create a simple counter table for support ad clicks
CREATE TABLE public.global_counters (
  counter_key text PRIMARY KEY,
  counter_value bigint NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_counters ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Anyone can read counters"
  ON public.global_counters FOR SELECT
  USING (true);

-- Anyone can update (increment)
CREATE POLICY "Anyone can update counters"
  ON public.global_counters FOR UPDATE
  USING (true);

-- Only admins can insert/delete
CREATE POLICY "Admins can insert counters"
  ON public.global_counters FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete counters"
  ON public.global_counters FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed the initial value at 14
INSERT INTO public.global_counters (counter_key, counter_value)
VALUES ('support_ad_clicks', 14);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_counters;
