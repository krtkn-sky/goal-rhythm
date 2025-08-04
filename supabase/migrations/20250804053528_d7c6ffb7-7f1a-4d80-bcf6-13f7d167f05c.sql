-- Disable email confirmation for simple username/password auth
-- Note: This would normally be done in Supabase dashboard under Authentication > Settings
-- But we'll update our auth flow to not require confirmation

-- Update the handle_new_user function to work without email confirmation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Create profile immediately when user signs up
  INSERT INTO public.profiles (user_id, username, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'username',
    NEW.email
  );
  RETURN NEW;
END;
$$;