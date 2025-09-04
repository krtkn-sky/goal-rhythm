-- Add scoring system to habits
ALTER TABLE public.habits 
ADD COLUMN difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'easy';