-- Fix security issue by setting search_path for the function
CREATE OR REPLACE FUNCTION public.cleanup_invalid_completions_on_frequency_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only proceed if frequency or weekly_days changed
  IF (OLD.frequency IS DISTINCT FROM NEW.frequency) OR 
     (OLD.weekly_days IS DISTINCT FROM NEW.weekly_days) THEN
    
    -- Delete completions that are no longer valid for the new frequency
    DELETE FROM public.habit_completions 
    WHERE habit_id = NEW.id 
    AND completed_date IN (
      SELECT completed_date 
      FROM public.habit_completions hc
      WHERE hc.habit_id = NEW.id
      AND NOT (
        -- For daily habits, all dates are valid
        (NEW.frequency = 'daily') OR
        -- For weekly habits, only days matching weekly_days are valid
        (NEW.frequency = 'weekly' AND NEW.weekly_days IS NOT NULL AND 
         EXTRACT(DOW FROM hc.completed_date)::int = ANY(NEW.weekly_days))
      )
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;