
-- 1) Update create_welcome_notification to also notify gym admin/owner
CREATE OR REPLACE FUNCTION public.create_welcome_notification(_user_id uuid, _gym_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _gym_name text;
  _user_name text;
  _owner_id uuid;
  _admin record;
BEGIN
  SELECT name, owner_id INTO _gym_name, _owner_id FROM public.gyms WHERE id = _gym_id;
  SELECT display_name INTO _user_name FROM public.profiles WHERE user_id = _user_id;

  -- Welcome notification for the student
  INSERT INTO public.notifications (user_id, gym_id, type, title, message)
  VALUES (
    _user_id,
    _gym_id,
    'welcome',
    '🎉 ¡Bienvenido!',
    'Te uniste a ' || COALESCE(_gym_name, 'tu gimnasio') || '. ¡Es hora de entrenar!'
  );

  -- Notify all gym_admin users of this gym
  FOR _admin IN
    SELECT ur.user_id FROM public.user_roles ur
    WHERE ur.gym_id = _gym_id AND ur.role = 'gym_admin' AND ur.user_id != _user_id
  LOOP
    INSERT INTO public.notifications (user_id, gym_id, type, title, message)
    VALUES (
      _admin.user_id,
      _gym_id,
      'new_member',
      '👤 Nuevo alumno',
      COALESCE(_user_name, 'Un usuario') || ' se unió a ' || COALESCE(_gym_name, 'tu gimnasio') || '.'
    );
  END LOOP;

  -- Also notify owner if not already a gym_admin
  IF _owner_id IS NOT NULL AND _owner_id != _user_id AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _owner_id AND gym_id = _gym_id AND role = 'gym_admin'
  ) THEN
    INSERT INTO public.notifications (user_id, gym_id, type, title, message)
    VALUES (
      _owner_id,
      _gym_id,
      'new_member',
      '👤 Nuevo alumno',
      COALESCE(_user_name, 'Un usuario') || ' se unió a ' || COALESCE(_gym_name, 'tu gimnasio') || '.'
    );
  END IF;
END;
$$;

-- 2) Create storage bucket for gym logos
INSERT INTO storage.buckets (id, name, public) VALUES ('gym-logos', 'gym-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 3) Storage policies for gym-logos bucket
CREATE POLICY "Anyone can view gym logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'gym-logos');

CREATE POLICY "Gym admins can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gym-logos'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Gym admins can update logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'gym-logos'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Gym admins can delete logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'gym-logos'
  AND auth.role() = 'authenticated'
);
