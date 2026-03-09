CREATE OR REPLACE FUNCTION public.create_welcome_notification(_user_id uuid, _gym_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _gym_name text;
BEGIN
  SELECT name INTO _gym_name FROM public.gyms WHERE id = _gym_id;
  INSERT INTO public.notifications (user_id, gym_id, type, title, message)
  VALUES (
    _user_id,
    _gym_id,
    'welcome',
    '🎉 ¡Bienvenido!',
    'Te uniste a ' || COALESCE(_gym_name, 'tu gimnasio') || '. ¡Es hora de entrenar!'
  );
END;
$$;