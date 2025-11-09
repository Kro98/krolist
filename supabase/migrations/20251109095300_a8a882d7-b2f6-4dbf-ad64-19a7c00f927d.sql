-- Create login_messages table for admin to display messages to users on login
CREATE TABLE IF NOT EXISTS public.login_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_ar TEXT,
  description_en TEXT NOT NULL,
  description_ar TEXT,
  display_times INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_messages ENABLE ROW LEVEL SECURITY;

-- Admins can manage login messages
CREATE POLICY "Admins can manage login messages"
ON public.login_messages
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active login messages
CREATE POLICY "Anyone can view active login messages"
ON public.login_messages
FOR SELECT
TO authenticated
USING (is_active = true);

-- Create user_message_views table to track how many times a user has seen a message
CREATE TABLE IF NOT EXISTS public.user_message_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.login_messages(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, message_id)
);

-- Enable RLS
ALTER TABLE public.user_message_views ENABLE ROW LEVEL SECURITY;

-- Users can view their own message views
CREATE POLICY "Users can view their own message views"
ON public.user_message_views
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own message views
CREATE POLICY "Users can insert their own message views"
ON public.user_message_views
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own message views
CREATE POLICY "Users can update their own message views"
ON public.user_message_views
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_login_messages_updated_at
BEFORE UPDATE ON public.login_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();