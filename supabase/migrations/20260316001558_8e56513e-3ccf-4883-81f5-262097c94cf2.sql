
-- Drop existing policies
DROP POLICY IF EXISTS "Gym admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Gym admins can update roles" ON public.user_roles;

-- Recreate INSERT policy: gym admins can only assign 'user' or 'gym_admin', never 'admin'
CREATE POLICY "Gym admins can manage roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    (is_super_admin(auth.uid()))
    OR
    (is_gym_admin(auth.uid(), gym_id) AND role IN ('user', 'gym_admin'))
  );

-- Recreate UPDATE policy with WITH CHECK to prevent escalation
CREATE POLICY "Gym admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (is_gym_admin(auth.uid(), gym_id) OR is_super_admin(auth.uid()))
  WITH CHECK (
    (is_super_admin(auth.uid()))
    OR
    (is_gym_admin(auth.uid(), gym_id) AND role IN ('user', 'gym_admin'))
  );
