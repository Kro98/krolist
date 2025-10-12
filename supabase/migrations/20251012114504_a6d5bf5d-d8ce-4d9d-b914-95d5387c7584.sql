-- Remove email column from profiles table to prevent email harvesting
-- Email is already stored securely in auth.users and accessible via auth.uid()

ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Update the trigger function to not insert email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;