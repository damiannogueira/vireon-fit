
-- Reset alumno_prueba workout data
DELETE FROM workout_logs WHERE user_id = '353327de-458b-4c98-bfd1-f0f00ae31468';
DELETE FROM weekly_challenge_completions WHERE user_id = '353327de-458b-4c98-bfd1-f0f00ae31468';
DELETE FROM user_achievements WHERE user_id = '353327de-458b-4c98-bfd1-f0f00ae31468';

-- Reset profile stats and clear onboarding/physical data
UPDATE profiles SET streak_days = 0, xp = 0, level = 1, onboarding_completed = false, gender = NULL, height_cm = NULL, weight_kg = NULL, fitness_level = 'beginner' WHERE user_id = '353327de-458b-4c98-bfd1-f0f00ae31468';

-- Reset onboarding progress
UPDATE onboarding_progress SET fitness_goal = NULL, preferred_days = NULL, current_step = 1, completed_at = NULL WHERE user_id = '353327de-458b-4c98-bfd1-f0f00ae31468';
