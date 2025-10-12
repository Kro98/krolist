-- Create search_logs table to track user searches
CREATE TABLE public.search_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  searched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own search logs
CREATE POLICY "Users can view their own search logs" 
ON public.search_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for inserting search logs (will be done by edge function)
CREATE POLICY "Users can insert their own search logs" 
ON public.search_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for efficient querying by user_id and searched_at
CREATE INDEX idx_search_logs_user_searched ON public.search_logs(user_id, searched_at DESC);