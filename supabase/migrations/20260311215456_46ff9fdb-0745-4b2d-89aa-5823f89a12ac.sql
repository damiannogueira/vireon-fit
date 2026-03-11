
CREATE TABLE public.workout_exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id uuid NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  sets_completed integer NOT NULL DEFAULT 0,
  reps_per_set integer[] NOT NULL DEFAULT '{}',
  weight_per_set numeric[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own exercise logs"
ON public.workout_exercise_logs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workout_logs wl
    WHERE wl.id = workout_log_id AND wl.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own exercise logs"
ON public.workout_exercise_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workout_logs wl
    WHERE wl.id = workout_log_id AND wl.user_id = auth.uid()
  )
);
