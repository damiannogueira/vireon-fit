GRANT EXECUTE ON FUNCTION public.is_gym_admin(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_member_of_gym(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_gym_id(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_profile_id_from_auth() TO authenticated;