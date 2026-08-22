REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_gym_admin(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_member_of_gym(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_gym_id(uuid) FROM anon, PUBLIC;

DROP POLICY IF EXISTS "Anyone authenticated can view gyms" ON public.gyms;

CREATE POLICY "Members admins and owners can view their gym"
ON public.gyms
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR public.is_member_of_gym(auth.uid(), id)
  OR public.is_gym_admin(auth.uid(), id)
  OR public.is_super_admin(auth.uid())
);