-- Fix the security definer functions to have proper search_path
CREATE OR REPLACE FUNCTION public.check_username_availability(username_input text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE LOWER(username) = LOWER(username_input)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_by_username(username_input text)
 RETURNS TABLE(email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT p.email
  FROM public.profiles p
  WHERE LOWER(p.username) = LOWER(username_input);
END;
$function$;