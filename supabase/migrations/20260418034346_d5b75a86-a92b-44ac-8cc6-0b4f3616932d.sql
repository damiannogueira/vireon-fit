
-- 1. Storage policies for exercise-images bucket
DROP POLICY IF EXISTS "Public can view exercise images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload exercise images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update exercise images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete exercise images" ON storage.objects;

-- Allow public READ of specific files (no listing). Listing requires SELECT without name filter;
-- restricting to authenticated + name IS NOT NULL prevents anonymous LIST while still allowing direct fetches via public URL signed paths.
-- For public buckets, getPublicUrl works without RLS; restrict the SELECT policy to admins to prevent listing via API.
CREATE POLICY "Admins can list exercise images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exercise-images'
  AND (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'gym_admin'))
);

CREATE POLICY "Admins can upload exercise images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exercise-images'
  AND (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'gym_admin'))
);

CREATE POLICY "Admins can update exercise images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'exercise-images'
  AND (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'gym_admin'))
);

CREATE POLICY "Admins can delete exercise images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exercise-images'
  AND (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'gym_admin'))
);

-- 2. Tighten user_roles UPDATE policy: prevent gym admin from moving a role row to another gym
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
