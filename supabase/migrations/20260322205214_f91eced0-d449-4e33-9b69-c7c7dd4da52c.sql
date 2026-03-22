-- Allow users to view their own personal (non-global) workouts
CREATE POLICY "Users can view own personal workouts" ON public.workouts
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() AND is_global = false);

-- Allow users to insert their own personal workouts (via edge function with service role, but just in case)
CREATE POLICY "Users can create own workouts" ON public.workouts
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND is_global = false);

-- Allow users to delete their own personal workouts
CREATE POLICY "Users can delete own workouts" ON public.workouts
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() AND is_global = false);

-- Allow users to manage workout_exercises for their own workouts
CREATE POLICY "Users can view own workout exercises" ON public.workout_exercises
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM workouts w 
    WHERE w.id = workout_exercises.workout_id 
    AND w.created_by = auth.uid() 
    AND w.is_global = false
  ));
