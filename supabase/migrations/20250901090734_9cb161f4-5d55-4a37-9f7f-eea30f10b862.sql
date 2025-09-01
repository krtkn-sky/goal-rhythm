-- Clean up duplicate/invalid completion records
-- Remove Evening walk completion for Aug 2nd (Friday) since it only runs on Sundays (day 0)
DELETE FROM habit_completions 
WHERE habit_id = '8a649a1a-8ea3-4b6c-bf79-dc4b4537b644' 
AND completed_date = '2025-08-02';

-- Remove duplicate Evening walk completion for Aug 3rd if it exists
DELETE FROM habit_completions 
WHERE habit_id = '8a649a1a-8ea3-4b6c-bf79-dc4b4537b644' 
AND completed_date = '2025-08-03'
AND id != (
  SELECT MIN(id) FROM habit_completions 
  WHERE habit_id = '8a649a1a-8ea3-4b6c-bf79-dc4b4537b644' 
  AND completed_date = '2025-08-03'
);