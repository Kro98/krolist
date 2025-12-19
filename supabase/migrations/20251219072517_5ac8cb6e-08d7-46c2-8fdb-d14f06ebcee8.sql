-- Create a table for global notifications that broadcast to all users
CREATE TABLE public.global_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  message TEXT NOT NULL,
  message_ar TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.global_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for everyone to read global notifications (including anonymous users)
CREATE POLICY "Everyone can view global notifications"
ON public.global_notifications
FOR SELECT
USING (true);

-- Only admins can create global notifications (check user_roles table)
CREATE POLICY "Admins can create global notifications"
ON public.global_notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id::uuid = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Create index for efficient queries
CREATE INDEX idx_global_notifications_created_at ON public.global_notifications (created_at DESC);