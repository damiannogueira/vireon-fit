-- Expose pg_proc EXECUTE privileges of public SECURITY DEFINER functions
-- via a view callable by service_role. Used by the automated test
-- supabase/functions/_shared/security_definer_privileges_test.ts to detect
-- privilege drift.

CREATE OR REPLACE VIEW public.security_definer_privileges AS
SELECT
  p.proname,
  has_function_privilege('anon',          p.oid, 'EXECUTE') AS anon_exec,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec,
  has_function_privilege('service_role',  p.oid, 'EXECUTE') AS svc_exec,
  p.prosecdef AS sec_def
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef = true;

-- Lock down: only service_role (used by the test harness and admin tooling)
-- can read this view. Never expose privilege metadata to anon/authenticated.
REVOKE ALL ON public.security_definer_privileges FROM PUBLIC;
REVOKE ALL ON public.security_definer_privileges FROM anon, authenticated;
GRANT SELECT ON public.security_definer_privileges TO service_role;