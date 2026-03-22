
-- Fix user_subscriptions policies: change from public to authenticated
DROP POLICY IF EXISTS "Users can create own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;

CREATE POLICY "Users can create own subscriptions" ON public.user_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK ((user_id = auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "Users can update own subscriptions" ON public.user_subscriptions
  FOR UPDATE TO authenticated
  USING ((user_id = auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
  FOR SELECT TO authenticated
  USING ((user_id = auth.uid()) OR is_super_admin(auth.uid()));

-- Fix workout_assignments policies: change from public to authenticated
DROP POLICY IF EXISTS "Gym admins can manage assignments" ON public.workout_assignments;
DROP POLICY IF EXISTS "Users can view own assignments" ON public.workout_assignments;

CREATE POLICY "Gym admins can manage assignments" ON public.workout_assignments
  FOR ALL TO authenticated
  USING (is_gym_admin(auth.uid(), gym_id) OR is_super_admin(auth.uid()))
  WITH CHECK (is_gym_admin(auth.uid(), gym_id) OR is_super_admin(auth.uid()));

CREATE POLICY "Users can view own assignments" ON public.workout_assignments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Fix cycle_completions: change public policy to authenticated
DROP POLICY IF EXISTS "Gym admins can view member cycles" ON public.cycle_completions;

CREATE POLICY "Gym admins can view member cycles" ON public.cycle_completions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM gym_members gm
    WHERE gm.user_id = cycle_completions.user_id
      AND gm.is_active = true
      AND is_gym_admin(auth.uid(), gm.gym_id)
  ));

-- Fix onboarding_progress: change public policy to authenticated
DROP POLICY IF EXISTS "Gym admins can view member onboarding" ON public.onboarding_progress;

CREATE POLICY "Gym admins can view member onboarding" ON public.onboarding_progress
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM gym_members gm
    WHERE gm.user_id = onboarding_progress.user_id
      AND gm.is_active = true
      AND is_gym_admin(auth.uid(), gm.gym_id)
  ));

-- Fix subscription_plans: change public policies to authenticated (except SELECT which can stay public for pricing pages)
DROP POLICY IF EXISTS "Admins can delete plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can insert plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can update plans" ON public.subscription_plans;

CREATE POLICY "Admins can delete plans" ON public.subscription_plans
  FOR DELETE TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can insert plans" ON public.subscription_plans
  FOR INSERT TO authenticated
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Admins can update plans" ON public.subscription_plans
  FOR UPDATE TO authenticated
  USING (is_super_admin(auth.uid()));
