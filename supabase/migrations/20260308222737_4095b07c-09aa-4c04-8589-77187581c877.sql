
CREATE TABLE public.cycle_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_type text NOT NULL,
  workouts_count integer NOT NULL DEFAULT 0,
  completed_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cycle_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cycles" ON public.cycle_completions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own cycles" ON public.cycle_completions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
