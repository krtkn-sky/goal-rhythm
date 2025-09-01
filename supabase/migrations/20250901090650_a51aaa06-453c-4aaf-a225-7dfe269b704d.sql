-- Fix missing completion records for Gym on Aug 2nd
INSERT INTO habit_completions (user_id, habit_id, completed_date, completed, created_at)
VALUES (
  'a485ef5d-a7d5-4b18-96d3-c35512a2c347',
  'e414f3f3-8f7f-401b-9b3e-014a7bd27209',
  '2025-08-02',
  true,
  now()
);