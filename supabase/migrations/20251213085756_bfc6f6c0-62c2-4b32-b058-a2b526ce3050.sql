-- Create table to track app downloads/installs
CREATE TABLE public.app_installs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  installed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  platform TEXT
);

-- Enable RLS
ALTER TABLE public.app_installs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (track installs)
CREATE POLICY "Anyone can track installs" 
ON public.app_installs 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to read the count (for displaying)
CREATE POLICY "Anyone can read install count" 
ON public.app_installs 
FOR SELECT 
USING (true);