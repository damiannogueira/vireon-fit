
-- Restore missing PostgREST grants on all public tables so RLS policies can actually be reached
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT SELECT ON public.achievements TO anon;
GRANT ALL ON public.achievements TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cycle_completions TO authenticated;
GRANT ALL ON public.cycle_completions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated;
GRANT SELECT ON public.exercises TO anon;
GRANT ALL ON public.exercises TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_members TO authenticated;
GRANT ALL ON public.gym_members TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_payments TO authenticated;
GRANT ALL ON public.gym_payments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gyms TO authenticated;
GRANT ALL ON public.gyms TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_progress TO authenticated;
GRANT ALL ON public.onboarding_progress TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_plans TO authenticated;
GRANT SELECT ON public.subscription_plans TO anon;
GRANT ALL ON public.subscription_plans TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_subscriptions TO authenticated;
GRANT ALL ON public.user_subscriptions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_adjustments TO authenticated;
GRANT ALL ON public.weekly_adjustments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_challenge_completions TO authenticated;
GRANT ALL ON public.weekly_challenge_completions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_assignments TO authenticated;
GRANT ALL ON public.workout_assignments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_exercise_logs TO authenticated;
GRANT ALL ON public.workout_exercise_logs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_exercises TO authenticated;
GRANT SELECT ON public.workout_exercises TO anon;
GRANT ALL ON public.workout_exercises TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_logs TO authenticated;
GRANT ALL ON public.workout_logs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO authenticated;
GRANT SELECT ON public.workouts TO anon;
GRANT ALL ON public.workouts TO service_role;
