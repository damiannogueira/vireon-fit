ALTER TABLE public.cycle_completions
  ADD COLUMN xp_earned integer NOT NULL DEFAULT 0,
  ADD COLUMN total_duration_minutes integer NOT NULL DEFAULT 0;