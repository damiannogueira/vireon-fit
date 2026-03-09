
-- Add physical data columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height_cm numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight_kg numeric;

-- Add target_gender to workouts for gender-specific routines
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS target_gender text CHECK (target_gender IN ('male', 'female', 'unisex'));

-- Set existing global workouts as unisex by default
UPDATE public.workouts SET target_gender = 'unisex' WHERE is_global = true AND target_gender IS NULL;
