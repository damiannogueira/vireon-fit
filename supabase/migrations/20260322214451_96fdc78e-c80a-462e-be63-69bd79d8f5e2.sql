
-- Weekly training adjustments table
CREATE TABLE public.weekly_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  completion_rate numeric NOT NULL DEFAULT 0,
  volume_change_pct numeric NOT NULL DEFAULT 0,
  consistency_score numeric NOT NULL DEFAULT 0,
  adjustment_type text NOT NULL DEFAULT 'maintain',
  weight_multiplier numeric NOT NULL DEFAULT 1.0,
  reps_modifier integer NOT NULL DEFAULT 0,
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

ALTER TABLE public.weekly_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own adjustments"
  ON public.weekly_adjustments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service can insert adjustments"
  ON public.weekly_adjustments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
