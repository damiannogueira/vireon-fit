-- 1) Replace exercise-images storage policies to scope gym_admin by exercise.gym_id
DROP POLICY IF EXISTS "Admins can list exercise images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload exercise images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update exercise images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete exercise images" ON storage.objects;

-- Helper inline check: image filename starts with the exercise UUID (path: exercise-images/<uuid>.png or just <uuid>.png inside bucket)
-- We resolve gym ownership by joining exercises on id parsed from name.

CREATE POLICY "Admins can list exercise images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exercise-images'
  AND (
    public.is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.exercises e
      WHERE storage.objects.name LIKE '%' || e.id::text || '%'
        AND e.gym_id IS NOT NULL
        AND public.is_gym_admin(auth.uid(), e.gym_id)
    )
  )
);

CREATE POLICY "Admins can upload exercise images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exercise-images'
  AND (
    public.is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.exercises e
      WHERE storage.objects.name LIKE '%' || e.id::text || '%'
        AND e.gym_id IS NOT NULL
        AND public.is_gym_admin(auth.uid(), e.gym_id)
    )
  )
);

CREATE POLICY "Admins can update exercise images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'exercise-images'
  AND (
    public.is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.exercises e
      WHERE storage.objects.name LIKE '%' || e.id::text || '%'
        AND e.gym_id IS NOT NULL
        AND public.is_gym_admin(auth.uid(), e.gym_id)
    )
  )
);

CREATE POLICY "Admins can delete exercise images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exercise-images'
  AND (
    public.is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.exercises e
      WHERE storage.objects.name LIKE '%' || e.id::text || '%'
        AND e.gym_id IS NOT NULL
        AND public.is_gym_admin(auth.uid(), e.gym_id)
    )
  )
);

-- 2) Tighten user_roles UPDATE: ensure original row's gym_id was admin's gym AND new gym_id is the same
DROP POLICY IF EXISTS "Gym admins can update roles" ON public.user_roles;

CREATE POLICY "Gym admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (gym_id IS NOT NULL AND public.is_gym_admin(auth.uid(), gym_id))
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (
    gym_id IS NOT NULL
    AND public.is_gym_admin(auth.uid(), gym_id)
    AND role = ANY (ARRAY['user'::app_role, 'gym_admin'::app_role])
  )
);
