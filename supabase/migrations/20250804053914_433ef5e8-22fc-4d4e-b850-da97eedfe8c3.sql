-- Add admin role to profiles table
ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';

-- Create admin policy for viewing all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create admin view for user management
CREATE OR REPLACE VIEW public.admin_users AS 
SELECT 
  p.id,
  p.user_id,
  p.username,
  p.email,
  p.role,
  p.created_at,
  p.updated_at
FROM public.profiles p;

-- Enable RLS on the view
ALTER VIEW public.admin_users SET (security_barrier = true);

-- Create policy for admin view
CREATE POLICY "Only admins can view admin_users" 
ON public.admin_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);