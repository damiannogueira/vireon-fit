
-- Add FK from gym_members.user_id to auth.users so PostgREST can resolve embedded queries
-- First add unique constraint on profiles.user_id for proper FK reference
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Add FK from gym_members.user_id to profiles.user_id
ALTER TABLE public.gym_members 
  ADD CONSTRAINT gym_members_user_id_profiles_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Create workout_assignments table for assigning routines to specific students
CREATE TABLE public.workout_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  UNIQUE(workout_id, user_id)
);

-- Enable RLS
ALTER TABLE public.workout_assignments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Gym admins can manage assignments"
  ON public.workout_assignments FOR ALL
  USING (is_gym_admin(auth.uid(), gym_id) OR is_super_admin(auth.uid()))
  WITH CHECK (is_gym_admin(auth.uid(), gym_id) OR is_super_admin(auth.uid()));

CREATE POLICY "Users can view own assignments"
  ON public.workout_assignments FOR SELECT
  USING (user_id = auth.uid());
