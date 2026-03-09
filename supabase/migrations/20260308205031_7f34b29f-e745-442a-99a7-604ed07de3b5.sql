
-- Clean workout logs for test user this week to allow retesting
DELETE FROM public.workout_logs 
WHERE user_id = '353327de-458b-4c98-bfd1-f0f00ae31468'
AND completed_at >= '2026-03-02T00:00:00Z';

-- Clean weekly challenge completions
DELETE FROM public.weekly_challenge_completions 
WHERE user_id = '353327de-458b-4c98-bfd1-f0f00ae31468';

-- Reset streak to 0 for clean test
UPDATE public.profiles 
SET streak_days = 0, xp = 0, level = 1
WHERE user_id = '353327de-458b-4c98-bfd1-f0f00ae31468';
