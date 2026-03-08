-- Update contest to correct year (2026)
UPDATE contests 
SET 
  start_time = '2026-01-25 14:00:00',
  end_time = '2026-01-25 17:00:00',
  result_time = '2026-01-25 22:00:00',
  title = 'JEE Main Weekly Contest - January 25, 2026'
WHERE contest_id = '73b35cb4-6f9e-4e75-b521-8e1d54d106b3';