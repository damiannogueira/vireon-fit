
-- =============================================
-- VIREON FIT - Complete Database Schema
-- =============================================

-- 1. ENUM TYPES
CREATE TYPE public.app_role AS ENUM ('admin', 'gym_admin', 'user');
CREATE TYPE public.fitness_level AS ENUM ('beginner', 'intermediate', 'advanced', 'elite');
CREATE TYPE public.muscle_group AS ENUM ('chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core', 'cardio', 'full_body');

-- =============================================
-- 2. BASE TABLES
-- =============================================

-- Gyms table
CREATE TABLE public.gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#8B5CF6',
  secondary_color TEXT DEFAULT '#06B6D4',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  gym_id UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
  display_name TEXT,
  avatar_url TEXT,
  fitness_level public.fitness_level DEFAULT 'beginner',
  xp INTEGER DEFAULT 0 NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,
  streak_days INTEGER DEFAULT 0 NOT NULL,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Exercises table
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  muscle_group public.muscle_group NOT NULL,
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
  is_global BOOLEAN DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  xp_reward INTEGER DEFAULT 0,
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
  is_global BOOLEAN DEFAULT false,
  requirement_type TEXT,
  requirement_value INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================
-- 3. MEMBERSHIP & ROLE TABLES
-- =============================================

-- User roles (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
  UNIQUE(user_id, role, gym_id)
);

-- Gym members
CREATE TABLE public.gym_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(gym_id, user_id)
);

-- User achievements
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, achievement_id)
);

-- =============================================
-- 4. WORKOUT TABLES
-- =============================================

-- Workouts (templates)
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  difficulty public.fitness_level DEFAULT 'beginner',
  estimated_duration INTEGER, -- minutes
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Workout exercises (exercises in a workout template)
CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  sets INTEGER DEFAULT 3,
  reps INTEGER DEFAULT 10,
  rest_seconds INTEGER DEFAULT 60,
  sort_order INTEGER DEFAULT 0
);

-- Workout logs (user completed workouts)
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  gym_id UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  xp_earned INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================
-- 5. ONBOARDING
-- =============================================

CREATE TABLE public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_step INTEGER DEFAULT 1,
  fitness_goal TEXT,
  preferred_days TEXT[],
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================
-- 6. HELPER FUNCTIONS (SECURITY DEFINER)
-- =============================================

-- Get profile id from auth
CREATE OR REPLACE FUNCTION public.get_profile_id_from_auth()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Check if user is member of gym
CREATE OR REPLACE FUNCTION public.is_member_of_gym(_user_id UUID, _gym_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gym_members
    WHERE user_id = _user_id AND gym_id = _gym_id AND is_active = true
  )
$$;

-- Check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if gym admin for specific gym
CREATE OR REPLACE FUNCTION public.is_gym_admin(_user_id UUID, _gym_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'gym_admin' AND gym_id = _gym_id
  )
$$;

-- Check if super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- Get user's gym_id from profile
CREATE OR REPLACE FUNCTION public.get_user_gym_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gym_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- =============================================
-- 7. TRIGGERS
-- =============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_gyms_updated_at BEFORE UPDATE ON public.gyms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_updated_at BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Create onboarding progress
  INSERT INTO public.onboarding_progress (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 8. RLS POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Gym admins can view gym profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_gym_admin(auth.uid(), gym_id));

CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- GYMS policies
CREATE POLICY "Anyone authenticated can view gyms" ON public.gyms
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gym admins can update own gym" ON public.gyms
  FOR UPDATE TO authenticated USING (public.is_gym_admin(auth.uid(), id) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert gyms" ON public.gyms
  FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete gyms" ON public.gyms
  FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()));

-- GYM_MEMBERS policies
CREATE POLICY "Members can view own gym members" ON public.gym_members
  FOR SELECT TO authenticated USING (
    public.is_member_of_gym(auth.uid(), gym_id) OR public.is_gym_admin(auth.uid(), gym_id) OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Gym admins can manage gym members" ON public.gym_members
  FOR INSERT TO authenticated WITH CHECK (public.is_gym_admin(auth.uid(), gym_id) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Gym admins can update gym members" ON public.gym_members
  FOR UPDATE TO authenticated USING (public.is_gym_admin(auth.uid(), gym_id) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Gym admins can delete gym members" ON public.gym_members
  FOR DELETE TO authenticated USING (public.is_gym_admin(auth.uid(), gym_id) OR public.is_super_admin(auth.uid()));

-- USER_ROLES policies
CREATE POLICY "Gym admins can view roles in their gym" ON public.user_roles
  FOR SELECT TO authenticated USING (
    public.is_gym_admin(auth.uid(), gym_id) OR public.is_super_admin(auth.uid()) OR user_id = auth.uid()
  );

CREATE POLICY "Gym admins can manage roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.is_gym_admin(auth.uid(), gym_id) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Gym admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (public.is_gym_admin(auth.uid(), gym_id) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Gym admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.is_gym_admin(auth.uid(), gym_id) OR public.is_super_admin(auth.uid()));

-- EXERCISES policies
CREATE POLICY "Anyone can view exercises" ON public.exercises
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gym admins can manage exercises" ON public.exercises
  FOR INSERT TO authenticated WITH CHECK (public.is_gym_admin(auth.uid(), gym_id) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Gym admins can update exercises" ON public.exercises
  FOR UPDATE TO authenticated USING (public.is_gym_admin(auth.uid(), gym_id) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Gym admins can delete exercises" ON public.exercises
  FOR DELETE TO authenticated USING (public.is_gym_admin(auth.uid(), gym_id) OR public.is_super_admin(auth.uid()));

-- ACHIEVEMENTS policies
CREATE POLICY "Anyone can view achievements" ON public.achievements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gym admins can manage achievements" ON public.achievements
  FOR INSERT TO authenticated WITH CHECK (public.is_gym_admin(auth.uid(), gym_id) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Gym admins can update achievements" ON public.achievements
  FOR UPDATE TO authenticated USING (public.is_gym_admin(auth.uid(), gym_id) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Gym admins can delete achievements" ON public.achievements
  FOR DELETE TO authenticated USING (public.is_gym_admin(auth.uid(), gym_id) OR public.is_super_admin(auth.uid()));

-- USER_ACHIEVEMENTS policies
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users can earn achievements" ON public.user_achievements
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users can delete own achievements" ON public.user_achievements
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- WORKOUTS policies
CREATE POLICY "Users can view accessible workouts" ON public.workouts
  FOR SELECT TO authenticated USING (
    is_global = true OR public.is_member_of_gym(auth.uid(), gym_id) OR public.is_gym_admin(auth.uid(), gym_id) OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Gym admins can create workouts" ON public.workouts
  FOR INSERT TO authenticated WITH CHECK (public.is_gym_admin(auth.uid(), gym_id) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Gym admins can update workouts" ON public.workouts
  FOR UPDATE TO authenticated USING (public.is_gym_admin(auth.uid(), gym_id) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Gym admins can delete workouts" ON public.workouts
  FOR DELETE TO authenticated USING (public.is_gym_admin(auth.uid(), gym_id) OR public.is_super_admin(auth.uid()));

-- WORKOUT_EXERCISES policies
CREATE POLICY "Users can view workout exercises" ON public.workout_exercises
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.workouts w WHERE w.id = workout_id
      AND (w.is_global = true OR public.is_member_of_gym(auth.uid(), w.gym_id) OR public.is_gym_admin(auth.uid(), w.gym_id) OR public.is_super_admin(auth.uid()))
    )
  );

CREATE POLICY "Gym admins can manage workout exercises" ON public.workout_exercises
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND (public.is_gym_admin(auth.uid(), w.gym_id) OR public.is_super_admin(auth.uid())))
  );

CREATE POLICY "Gym admins can update workout exercises" ON public.workout_exercises
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND (public.is_gym_admin(auth.uid(), w.gym_id) OR public.is_super_admin(auth.uid())))
  );

CREATE POLICY "Gym admins can delete workout exercises" ON public.workout_exercises
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND (public.is_gym_admin(auth.uid(), w.gym_id) OR public.is_super_admin(auth.uid())))
  );

-- WORKOUT_LOGS policies
CREATE POLICY "Users can view own workout logs" ON public.workout_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_gym_admin(auth.uid(), gym_id) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users can create own workout logs" ON public.workout_logs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own workout logs" ON public.workout_logs
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own workout logs" ON public.workout_logs
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- ONBOARDING_PROGRESS policies
CREATE POLICY "Users can view own onboarding" ON public.onboarding_progress
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own onboarding" ON public.onboarding_progress
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own onboarding" ON public.onboarding_progress
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
