-- Add notification columns to orders table for one-time view system
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS admin_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS customer_data_cleared BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS contact_notification_sent BOOLEAN DEFAULT FALSE;

-- Create order_notifications table for user notifications
CREATE TABLE IF NOT EXISTS public.order_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message_en TEXT NOT NULL,
  message_ar TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on order_notifications
ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.order_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.order_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can manage all notifications
CREATE POLICY "Admins can manage notifications"
ON public.order_notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));