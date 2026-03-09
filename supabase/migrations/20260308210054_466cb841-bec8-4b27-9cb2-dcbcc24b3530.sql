
-- Reset test user workout data for retesting
DELETE FROM public.workout_logs 
WHERE user_id = '353327de-458b-4c98-bfd1-f0f00ae31468';

DELETE FROM public.weekly_challenge_completions 
WHERE user_id = '353327de-458b-4c98-bfd1-f0f00ae31468';

UPDATE public.profiles 
SET streak_days = 0, xp = 0, level = 1
WHERE user_id = '353327de-458b-4c98-bfd1-f0f00ae31468';
