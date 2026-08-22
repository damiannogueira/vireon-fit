
-- ============================================================
-- 1. Gamification: force XP columns to 0 on client-supplied writes
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_server_side_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- service_role bypasses RLS and this check; SECURITY DEFINER triggers run as
  -- table owner and are also allowed. Only reject client-supplied XP from the
  -- 'authenticated' / 'anon' roles.
  IF current_setting('request.jwt.claims', true) IS NOT NULL
     AND current_user IN ('authenticated', 'anon') THEN
    IF TG_TABLE_NAME = 'workout_logs' THEN
      NEW.xp_earned := 0;
    ELSIF TG_TABLE_NAME = 'cycle_completions' THEN
      NEW.xp_earned := 0;
    ELSIF TG_TABLE_NAME = 'weekly_challenge_completions' THEN
      NEW.xp_awarded := 0;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_xp_workout_logs ON public.workout_logs;
CREATE TRIGGER enforce_xp_workout_logs
BEFORE INSERT OR UPDATE ON public.workout_logs
FOR EACH ROW EXECUTE FUNCTION public.enforce_server_side_xp();

DROP TRIGGER IF EXISTS enforce_xp_cycle_completions ON public.cycle_completions;
CREATE TRIGGER enforce_xp_cycle_completions
BEFORE INSERT OR UPDATE ON public.cycle_completions
FOR EACH ROW EXECUTE FUNCTION public.enforce_server_side_xp();

DROP TRIGGER IF EXISTS enforce_xp_weekly_challenge_completions ON public.weekly_challenge_completions;
CREATE TRIGGER enforce_xp_weekly_challenge_completions
BEFORE INSERT OR UPDATE ON public.weekly_challenge_completions
FOR EACH ROW EXECUTE FUNCTION public.enforce_server_side_xp();

-- ============================================================
-- 2. user_achievements: restrict INSERT to server-side only
-- ============================================================
DROP POLICY IF EXISTS "Users can earn achievements" ON public.user_achievements;
-- No INSERT policy for authenticated => client cannot self-award.
-- The check_and_award_achievements() trigger runs SECURITY DEFINER and bypasses RLS.
-- service_role also bypasses RLS.

-- ============================================================
-- 3. weekly_adjustments: restrict INSERT to service_role only
-- ============================================================
DROP POLICY IF EXISTS "Service can insert adjustments" ON public.weekly_adjustments;
-- No INSERT policy for authenticated => only service_role (bypasses RLS) can insert.

-- ============================================================
-- 4. Storage: replace substring LIKE match with exact filename match
-- ============================================================

-- exercise-images: files are named "<exercise-id>.png"
DROP POLICY IF EXISTS "Admins can list exercise images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload exercise images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update exercise images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete exercise images" ON storage.objects;

CREATE POLICY "Admins can list exercise images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'exercise-images'
  AND is_super_admin(auth.uid())
);

CREATE POLICY "Admins can upload exercise images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exercise-images'
  AND is_super_admin(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.exercises e
    WHERE storage.objects.name = e.id::text || '.png'
  )
);

CREATE POLICY "Admins can update exercise images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'exercise-images'
  AND is_super_admin(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.exercises e
    WHERE storage.objects.name = e.id::text || '.png'
  )
);

CREATE POLICY "Admins can delete exercise images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'exercise-images'
  AND is_super_admin(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.exercises e
    WHERE storage.objects.name = e.id::text || '.png'
  )
);

-- gym-logos: no client-side uploader remains in the B2C app.
-- Drop the LIKE-based admin policies. Bucket is public so reads still work;
-- writes now require service_role (which bypasses RLS) or a super_admin path
-- if reintroduced later.
DROP POLICY IF EXISTS "Admins can list gym logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload gym logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update gym logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete gym logos" ON storage.objects;

CREATE POLICY "Super admins can manage gym logos"
ON storage.objects FOR ALL
USING (bucket_id = 'gym-logos' AND is_super_admin(auth.uid()))
WITH CHECK (bucket_id = 'gym-logos' AND is_super_admin(auth.uid()));
