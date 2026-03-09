CREATE OR REPLACE FUNCTION public.link_user_to_gym(_user_id uuid, _gym_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.profiles SET gym_id = _gym_id WHERE user_id = _user_id;
END;
$$;