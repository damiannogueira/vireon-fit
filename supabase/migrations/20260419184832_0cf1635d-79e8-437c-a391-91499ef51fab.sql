-- Fix 1: Remove overly permissive gym-logos storage policies
DROP POLICY IF EXISTS "Gym admins can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Gym admins can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Gym admins can delete logos" ON storage.objects;

-- Fix 2: Tighten user_roles INSERT to verify caller is actually an admin of the target gym
DROP POLICY IF EXISTS "Gym admins can manage roles" ON public.user_roles;

CREATE POLICY "Gym admins can manage roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  is_super_admin(auth.uid())
  OR (
    gym_id IS NOT NULL
    AND is_gym_admin(auth.uid(), gym_id)
    AND role = ANY (ARRAY['user'::app_role, 'gym_admin'::app_role])
  )
);