-- Add completed column to habit_completions table
ALTER TABLE habit_completions ADD COLUMN completed BOOLEAN DEFAULT true;

-- Update existing records to have completed = true (they were all completions)
UPDATE habit_completions SET completed = true WHERE completed IS NULL;