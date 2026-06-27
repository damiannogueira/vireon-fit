
-- 1) Drop legacy gym_* policies on user_roles (Gym mode removed)
DROP POLICY IF EXISTS "Gym admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Gym admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Gym admins can view roles in their gym" ON public.user_roles;
DROP POLICY IF EXISTS "gym_admin_assign_member_roles" ON public.user_roles;
DROP POLICY IF EXISTS "gym_admin_delete_member_roles" ON public.user_roles;

-- 2) Allow each user to read their own roles (needed for client-side role checks)
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3) workout_exercise_logs: allow owners to update/delete their own logged sets
--    Owner is determined via the parent workout_logs row.
CREATE POLICY "Users can update own exercise logs"
  ON public.workout_exercise_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl
      WHERE wl.id = workout_exercise_logs.workout_log_id
        AND wl.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl
      WHERE wl.id = workout_exercise_logs.workout_log_id
        AND wl.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own exercise logs"
  ON public.workout_exercise_logs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl
      WHERE wl.id = workout_exercise_logs.workout_log_id
        AND wl.user_id = auth.uid()
    )
  );
