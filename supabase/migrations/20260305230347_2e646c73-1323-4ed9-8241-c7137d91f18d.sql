
-- =============================================
-- 1. STREAK CALCULATOR
-- Automatically updates streak_days on workout completion
-- =============================================
CREATE OR REPLACE FUNCTION public.update_streak_on_workout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _last_completed date;
  _today date := CURRENT_DATE;
  _current_streak int;
BEGIN
  -- Only trigger on completion (when completed_at goes from NULL to a value)
  IF NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the most recent completed workout date BEFORE this one
  SELECT (completed_at AT TIME ZONE 'UTC')::date INTO _last_completed
  FROM workout_logs
  WHERE user_id = NEW.user_id
    AND completed_at IS NOT NULL
    AND id != NEW.id
  ORDER BY completed_at DESC
  LIMIT 1;

  -- Get current streak
  SELECT streak_days INTO _current_streak
  FROM profiles
  WHERE user_id = NEW.user_id;

  _current_streak := COALESCE(_current_streak, 0);

  IF _last_completed IS NULL THEN
    -- First ever workout
    UPDATE profiles SET streak_days = 1 WHERE user_id = NEW.user_id;
  ELSIF _last_completed = _today THEN
    -- Already trained today, no change
    NULL;
  ELSIF _last_completed = _today - 1 THEN
    -- Consecutive day, increment
    UPDATE profiles SET streak_days = _current_streak + 1 WHERE user_id = NEW.user_id;
  ELSE
    -- Gap > 1 day, reset to 1
    UPDATE profiles SET streak_days = 1 WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_streak
  AFTER INSERT OR UPDATE ON public.workout_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_streak_on_workout();

-- =============================================
-- 2. ACHIEVEMENT ENGINE
-- Auto-awards achievements based on requirement_type/value
-- =============================================
CREATE OR REPLACE FUNCTION public.check_and_award_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _user_id uuid := NEW.user_id;
  _workout_count int;
  _streak int;
  _xp int;
  _level int;
  _ach record;
BEGIN
  -- Only on completion
  IF NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Gather user stats
  SELECT COUNT(*) INTO _workout_count
  FROM workout_logs
  WHERE user_id = _user_id AND completed_at IS NOT NULL;

  SELECT COALESCE(streak_days, 0), COALESCE(xp, 0), COALESCE(level, 1)
  INTO _streak, _xp, _level
  FROM profiles
  WHERE user_id = _user_id;

  -- Check all achievements not yet earned
  FOR _ach IN
    SELECT a.id, a.requirement_type, a.requirement_value, a.xp_reward
    FROM achievements a
    WHERE (a.is_global = true OR a.gym_id IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM user_achievements ua
        WHERE ua.user_id = _user_id AND ua.achievement_id = a.id
      )
  LOOP
    IF (
      (_ach.requirement_type = 'workout_count' AND _workout_count >= _ach.requirement_value) OR
      (_ach.requirement_type = 'streak_days' AND _streak >= _ach.requirement_value) OR
      (_ach.requirement_type = 'xp_total' AND _xp >= _ach.requirement_value) OR
      (_ach.requirement_type = 'level' AND _level >= _ach.requirement_value)
    ) THEN
      -- Award achievement
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (_user_id, _ach.id)
      ON CONFLICT DO NOTHING;

      -- Award bonus XP if any
      IF _ach.xp_reward IS NOT NULL AND _ach.xp_reward > 0 THEN
        UPDATE profiles
        SET xp = xp + _ach.xp_reward,
            level = FLOOR((xp + _ach.xp_reward) / 500) + 1
        WHERE user_id = _user_id;
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- This trigger runs AFTER the streak trigger (alphabetical order: trg_check > trg_update)
-- Actually let's name it to run after streak
CREATE TRIGGER trg_zz_check_achievements
  AFTER INSERT OR UPDATE ON public.workout_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_award_achievements();
