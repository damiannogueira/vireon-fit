ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS description_en text;

ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS description_en text;

ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS description_en text;

ALTER TABLE public.weekly_adjustments
  ADD COLUMN IF NOT EXISTS message_en text;

COMMENT ON COLUMN public.exercises.name_en IS 'English display name; canonical name remains in name';
COMMENT ON COLUMN public.exercises.description_en IS 'English exercise instructions';
COMMENT ON COLUMN public.workouts.name_en IS 'English display name';
COMMENT ON COLUMN public.workouts.description_en IS 'English workout description';
COMMENT ON COLUMN public.achievements.name_en IS 'English display name';
COMMENT ON COLUMN public.achievements.description_en IS 'English achievement description';
COMMENT ON COLUMN public.weekly_adjustments.message_en IS 'English weekly adjustment message';