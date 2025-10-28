-- Create admin role system
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Update promo_codes RLS policies
DROP POLICY IF EXISTS "Users can insert their own promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Users can update their own promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Users can delete their own promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Users can view their own promo codes" ON public.promo_codes;

-- New secure RLS policies for promo_codes
CREATE POLICY "Users can insert non-Krolist promo codes"
  ON public.promo_codes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND is_krolist = false
    AND (SELECT COUNT(*) FROM promo_codes WHERE user_id = auth.uid()) < 24
  );

CREATE POLICY "Users can update their own non-Krolist codes"
  ON public.promo_codes FOR UPDATE
  USING (auth.uid() = user_id AND is_krolist = false)
  WITH CHECK (auth.uid() = user_id AND is_krolist = false);

CREATE POLICY "Users can delete their own non-Krolist codes"
  ON public.promo_codes FOR DELETE
  USING (auth.uid() = user_id AND is_krolist = false);

CREATE POLICY "Users can view their own promo codes"
  ON public.promo_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view Krolist promo codes"
  ON public.promo_codes FOR SELECT
  USING (is_krolist = true);

CREATE POLICY "Admins can manage all promo codes"
  ON public.promo_codes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));