-- Create function to update timestamps (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  store TEXT NOT NULL,
  description TEXT NOT NULL,
  store_url TEXT NOT NULL,
  expires DATE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  reusable BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own promo codes"
ON public.promo_codes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own promo codes"
ON public.promo_codes
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  (SELECT COUNT(*) FROM public.promo_codes WHERE user_id = auth.uid()) < 24
);

CREATE POLICY "Users can update their own promo codes"
ON public.promo_codes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own promo codes"
ON public.promo_codes
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();