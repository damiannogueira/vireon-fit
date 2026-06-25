
-- 1) Harden user_roles INSERT policy: explicit, conservative re-creation
DROP POLICY IF EXISTS "Gym admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Roles insert" ON public.user_roles;

-- Super admins: full control
CREATE POLICY "super_admin_full_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Gym admins: may only assign non-admin roles to users within gyms they administer,
-- and may never assign to themselves
CREATE POLICY "gym_admin_assign_member_roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  gym_id IS NOT NULL
  AND user_id <> auth.uid()
  AND role IN ('user'::app_role, 'gym_admin'::app_role)
  AND public.is_gym_admin(auth.uid(), gym_id)
);

CREATE POLICY "gym_admin_delete_member_roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  gym_id IS NOT NULL
  AND role IN ('user'::app_role, 'gym_admin'::app_role)
  AND public.is_gym_admin(auth.uid(), gym_id)
);

-- 2) Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated.
--    They remain callable inside RLS/policies/triggers (which run as the function owner).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_gym_admin(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_member_of_gym(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_gym_id(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_profile_id_from_auth() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.search_unlinked_profiles(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.link_user_to_gym(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_gym_member_stats(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_welcome_notification(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_user_subscription(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_streak_on_workout() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_and_award_achievements() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Keep these callable by signed-in users (used by app code/UI):
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_own_subscription(uuid) TO authenticated;
