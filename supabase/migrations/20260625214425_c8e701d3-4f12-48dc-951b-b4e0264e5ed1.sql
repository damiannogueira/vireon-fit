-- Revoke broad execute on SECURITY DEFINER helpers exposed via the API.
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_own_subscription(uuid) FROM PUBLIC, anon;

-- rls_auto_enable is an event-trigger handler; nothing should call it via the API.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;