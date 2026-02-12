
-- Server-side login rate limiting table
CREATE TABLE public.admin_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  email text NOT NULL,
  attempted_at timestamp with time zone NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;

-- Only service role can access (edge function uses service role key)
CREATE POLICY "No direct access" ON public.admin_login_attempts
FOR ALL USING (false);

-- Index for fast lookups by IP + time window
CREATE INDEX idx_admin_login_attempts_ip_time ON public.admin_login_attempts (ip_address, attempted_at DESC);
CREATE INDEX idx_admin_login_attempts_email_time ON public.admin_login_attempts (email, attempted_at DESC);

-- Auto-cleanup: delete attempts older than 24 hours (run via cron or on insert)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.admin_login_attempts
  WHERE attempted_at < now() - interval '24 hours';
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_login_attempts_trigger
AFTER INSERT ON public.admin_login_attempts
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_old_login_attempts();
