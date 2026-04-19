-- 1) gym-logos storage policies: scope to gym admin of the gym whose UUID is in the path
DROP POLICY IF EXISTS "Authenticated can upload gym logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update gym logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete gym logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view gym logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view gym logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can list gym logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload gym logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update gym logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete gym logos" ON storage.objects;

-- Restrict listing via API to admins; direct public URL fetches still work for public bucket
CREATE POLICY "Admins can list gym logos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'gym-logos'
  AND (
    public.is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.gyms g
      WHERE storage.objects.name LIKE '%' || g.id::text || '%'
        AND public.is_gym_admin(auth.uid(), g.id)
    )
  )
);

CREATE POLICY "Admins can upload gym logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gym-logos'
  AND (
    public.is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.gyms g
      WHERE storage.objects.name LIKE '%' || g.id::text || '%'
        AND public.is_gym_admin(auth.uid(), g.id)
    )
  )
);

CREATE POLICY "Admins can update gym logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gym-logos'
  AND (
    public.is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.gyms g
      WHERE storage.objects.name LIKE '%' || g.id::text || '%'
        AND public.is_gym_admin(auth.uid(), g.id)
    )
  )
);

CREATE POLICY "Admins can delete gym logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gym-logos'
  AND (
    public.is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.gyms g
      WHERE storage.objects.name LIKE '%' || g.id::text || '%'
        AND public.is_gym_admin(auth.uid(), g.id)
    )
  )
);

-- 2) gym_members SELECT: only own row for regular members; admins keep visibility
DROP POLICY IF EXISTS "Members can view own gym members" ON public.gym_members;

CREATE POLICY "Users can view own membership"
ON public.gym_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Gym admins can view gym members"
ON public.gym_members FOR SELECT
TO authenticated
USING (public.is_gym_admin(auth.uid(), gym_id) OR public.is_super_admin(auth.uid()));

-- 3) Prevent gym admins from modifying their own role row (no self-escalation)
DROP POLICY IF EXISTS "Gym admins can update roles" ON public.user_roles;

CREATE POLICY "Gym admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (
    gym_id IS NOT NULL
    AND public.is_gym_admin(auth.uid(), gym_id)
    AND user_id <> auth.uid()
  )
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (
    gym_id IS NOT NULL
    AND public.is_gym_admin(auth.uid(), gym_id)
    AND user_id <> auth.uid()
    AND role = ANY (ARRAY['user'::app_role, 'gym_admin'::app_role])
  )
);

DROP POLICY IF EXISTS "Gym admins can delete roles" ON public.user_roles;
CREATE POLICY "Gym admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR (
    gym_id IS NOT NULL
    AND public.is_gym_admin(auth.uid(), gym_id)
    AND user_id <> auth.uid()
  )
);
