-- Fix missing completion records for Evening walk on Aug 3rd (Sunday)  
INSERT INTO habit_completions (user_id, habit_id, completed_date, completed, created_at)
VALUES (
  'a485ef5d-a7d5-4b18-96d3-c35512a2c347',
  '8a649a1a-8ea3-4b6c-bf79-dc4b4537b644',
  '2025-08-03',
  true,
  now()
);