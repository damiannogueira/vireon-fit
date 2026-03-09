CREATE OR REPLACE FUNCTION public.search_unlinked_profiles(_search text)
RETURNS TABLE(user_id uuid, display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.user_id, p.display_name
  FROM public.profiles p
  WHERE p.gym_id IS NULL
    AND p.display_name ILIKE '%' || _search || '%'
  LIMIT 5
$$;