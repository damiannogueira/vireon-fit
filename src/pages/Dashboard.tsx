import { motion } from "framer-motion";
import { NotificationBell } from "@/components/NotificationBell";
import { Dumbbell, Play, ChevronRight, Building2, Users, ClipboardList, CreditCard, Target, Lock, Ruler, Check, Trophy, RefreshCw, ChevronDown } from "lucide-react";
import { GoalChanger } from "@/components/GoalChanger";
import { WeeklyChallenge } from "@/components/WeeklyChallenge";
import { BottomNav } from "@/components/BottomNav";
import { XPBar } from "@/components/XPBar";
import { LevelBadge } from "@/components/LevelBadge";
import { StatCard } from "@/components/StatCard";
import { ProUpsell } from "@/components/ProUpsell";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscription, FREE_LIMITS } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

const XP_PER_LEVEL = 500;

const GOAL_LABELS: Record<string, Record<string, string>> = {
  hipertrofia: { es: "💪 Hipertrofia", en: "💪 Hypertrophy" },
  fuerza: { es: "🏋️ Fuerza", en: "🏋️ Strength" },
  perdida_grasa: { es: "⚡ Pérdida de grasa", en: "⚡ Fat Loss" },
  movilidad: { es: "🧘 Movilidad", en: "🧘 Mobility" },
  general: { es: "🎯 General", en: "🎯 General" },
};

const GOAL_DESCRIPTIONS: Record<string, Record<string, string>> = {
  hipertrofia: { es: "Ganando masa muscular", en: "Building muscle mass" },
  fuerza: { es: "Moviendo más peso", en: "Lifting heavier" },
  perdida_grasa: { es: "Quemando grasa y definiendo", en: "Burning fat and getting lean" },
  movilidad: { es: "Mejorando flexibilidad", en: "Improving flexibility" },
  general: { es: "Entrenamiento integral", en: "Well-rounded training" },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const { isGymAdmin, gymId, isLoading: roleLoading } = useUserRole();
  const { isPro } = useSubscription();
  const queryClient = useQueryClient();
  const [resetting, setResetting] = useState(false);
  const [showCycleHistory, setShowCycleHistory] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["dashboard-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, level, xp, streak_days, fitness_level, gender, height_cm, weight_kg")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: onboarding } = useQuery({
    queryKey: ["dashboard-onboarding", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("onboarding_progress")
        .select("fitness_goal, preferred_days, completed_at")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !isGymAdmin,
  });

  const { data: workoutStats } = useQuery({
    queryKey: ["dashboard-workout-stats", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_logs")
        .select("duration_minutes, xp_earned, completed_at")
        .eq("user_id", user!.id);
      if (error) throw error;

      const totalWorkouts = data?.filter(w => w.completed_at).length || 0;
      const totalMinutes = data?.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) || 0;
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
      startOfWeek.setHours(0, 0, 0, 0);
      const thisWeekWorkouts = data?.filter(w => w.completed_at && new Date(w.completed_at) >= startOfWeek).length || 0;

      return { totalWorkouts, totalHours, totalMinutes, thisWeekWorkouts };
    },
    enabled: !!user && !isGymAdmin,
  });

  const userGoal = onboarding?.fitness_goal || null;
  const userGender = profile?.gender || null;
  const { data: recommendedWorkouts } = useQuery({
    queryKey: ["recommended-workouts", userGoal, userGender],
    queryFn: async () => {
      let query = supabase
        .from("workouts")
        .select("id, name, description, estimated_duration, difficulty, goal_type, target_gender, workout_exercises(id)")
        .eq("is_global", true)
        .in("goal_type", [userGoal!, "general"])
        .order("created_at");
      if (userGender && userGender !== "other") {
        query = query.in("target_gender", [userGender, "unisex"]);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!userGoal,
  });

  const { data: recentLogs } = useQuery({
    queryKey: ["dashboard-recent-logs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_logs")
        .select("workout_id, completed_at")
        .eq("user_id", user!.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user && !isGymAdmin,
  });

  // Cycle completions history
  const { data: cycleCompletions } = useQuery({
    queryKey: ["cycle-completions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("cycle_completions")
        .select("id, goal_type, workouts_count, completed_at, xp_earned, total_duration_minutes")
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false });
      return data || [];
    },
    enabled: !!user && !isGymAdmin,
  });

  // Gym admin stats
  const { data: gymStats } = useQuery({
    queryKey: ["gym-admin-stats", gymId],
    queryFn: async () => {
      const { data: members } = await supabase.from("gym_members").select("id").eq("gym_id", gymId!).eq("is_active", true);
      const { data: routines } = await supabase.from("workouts").select("id").eq("gym_id", gymId!);
      const { data: gym } = await supabase.from("gyms").select("name").eq("id", gymId!).maybeSingle();
      const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
      const { data: payments } = await supabase.from("gym_payments").select("is_paid").eq("gym_id", gymId!).eq("period_month", currentMonth);
      const pendingPayments = (payments || []).filter(p => !p.is_paid).length;
      return { memberCount: members?.length || 0, routineCount: routines?.length || 0, gymName: gym?.name || "", pendingPayments };
    },
    enabled: !!gymId && isGymAdmin,
  });

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "—";
  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const streak = profile?.streak_days || 0;
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL;

  if (profileLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ========== GYM ADMIN DASHBOARD ==========
  if (isGymAdmin) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground">{t.dashboard.welcomeBack}</p>
              <h1 className="text-2xl font-display font-bold text-foreground">{gymStats?.gymName || displayName}</h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-card border border-border/50 text-center">
              <span className="text-2xl font-bold text-foreground">{gymStats?.memberCount || 0}</span>
              <p className="text-[10px] text-muted-foreground uppercase">{locale === "es" ? "Alumnos" : "Members"}</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/50 text-center">
              <span className="text-2xl font-bold text-foreground">{gymStats?.routineCount || 0}</span>
              <p className="text-[10px] text-muted-foreground uppercase">{locale === "es" ? "Rutinas" : "Routines"}</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/50 text-center">
              <span className="text-2xl font-bold text-achievement">{gymStats?.pendingPayments || 0}</span>
              <p className="text-[10px] text-muted-foreground uppercase">{locale === "es" ? "Cuotas pend." : "Pending"}</p>
            </div>
          </div>
          <h2 className="text-lg font-display font-bold text-foreground mb-3">{locale === "es" ? "Acciones rápidas" : "Quick actions"}</h2>
          <div className="space-y-2">
            {[
              { icon: Users, label: locale === "es" ? "Gestionar alumnos" : "Manage members", desc: locale === "es" ? "Invitar, agregar y ver alumnos" : "Invite, add and view members", action: () => navigate("/gym") },
              { icon: ClipboardList, label: locale === "es" ? "Rutinas" : "Routines", desc: locale === "es" ? "Crear y asignar rutinas" : "Create and assign routines", action: () => navigate("/gym") },
              { icon: CreditCard, label: locale === "es" ? "Cuotas" : "Payments", desc: locale === "es" ? "Control de pagos mensuales" : "Monthly payment tracking", action: () => navigate("/gym") },
            ].map((action, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={action.action}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <action.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-foreground">{action.label}</span>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.button>
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ========== REGULAR USER / INDIVIDUAL DASHBOARD ==========
  const hasOnboarding = !!onboarding?.completed_at;
  const goalKey = userGoal || "general";
  const goalLabel = GOAL_LABELS[goalKey]?.[locale] || GOAL_LABELS.general[locale];
  const goalDesc = GOAL_DESCRIPTIONS[goalKey]?.[locale] || GOAL_DESCRIPTIONS.general[locale];

  const lastWorkoutId = recentLogs?.[0]?.workout_id;
  const workouts = recommendedWorkouts || [];
  const goalWorkouts = workouts.filter(w => w.goal_type === goalKey);
  const generalWorkouts = workouts.filter(w => w.goal_type === "general");
  const orderedWorkouts = [...goalWorkouts, ...generalWorkouts];

  // Free users see limited days
  const maxDays = isPro ? orderedWorkouts.length : Math.min(FREE_LIMITS.maxDaysInPlan, orderedWorkouts.length);
  const visibleWorkouts = orderedWorkouts.slice(0, maxDays);
  const hasLockedDays = !isPro && orderedWorkouts.length > FREE_LIMITS.maxDaysInPlan;

  let nextWorkout = visibleWorkouts[0];
  if (lastWorkoutId && visibleWorkouts.length > 1) {
    const lastIdx = visibleWorkouts.findIndex(w => w.id === lastWorkoutId);
    if (lastIdx >= 0) {
      nextWorkout = visibleWorkouts[(lastIdx + 1) % visibleWorkouts.length];
    }
  }

  const getCompletionCount = (workoutId: string) => recentLogs?.filter(l => l.workout_id === workoutId).length || 0;

  // Check if all plan workouts are completed
  const allPlanCompleted = visibleWorkouts.length > 0 && visibleWorkouts.every(w => getCompletionCount(w.id) > 0);


  const handleRestartCycle = async () => {
    if (!user || resetting) return;
    setResetting(true);
    try {
      // Calculate cycle stats before deleting logs
      const workoutIds = visibleWorkouts.map(w => w.id);
      const { data: cycleLogs } = await supabase
        .from("workout_logs")
        .select("xp_earned, duration_minutes")
        .eq("user_id", user.id)
        .in("workout_id", workoutIds)
        .not("completed_at", "is", null);

      const cycleXp = (cycleLogs || []).reduce((sum, l) => sum + (l.xp_earned || 0), 0);
      const cycleDuration = (cycleLogs || []).reduce((sum, l) => sum + (l.duration_minutes || 0), 0);

      // Record cycle completion with stats
      await supabase.from("cycle_completions").insert({
        user_id: user.id,
        goal_type: goalKey || "general",
        workouts_count: visibleWorkouts.length,
        xp_earned: cycleXp,
        total_duration_minutes: cycleDuration,
      });

      const { error } = await supabase
        .from("workout_logs")
        .delete()
        .eq("user_id", user.id)
        .in("workout_id", workoutIds);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["dashboard-recent-logs"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-workout-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["recent-workout-logs"] });
      await queryClient.invalidateQueries({ queryKey: ["cycle-completions"] });
      toast.success(locale === "es" ? "¡Ciclo reiniciado! A entrenar 💪" : "Cycle restarted! Let's train 💪");
    } catch {
      toast.error(locale === "es" ? "Error al reiniciar" : "Failed to restart");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">{t.dashboard.welcomeBack}</p>
            <h1 className="text-2xl font-display font-bold text-foreground">{displayName} 💪</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <LevelBadge level={level} />
          </div>
        </div>

        {/* XP Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-card border border-border/50 mb-6"
        >
          <XPBar current={xpInLevel} max={xpToNext} label={t.dashboard.experience} variant="xp" size="md" />
          <p className="text-xs text-muted-foreground mt-2">
            {xpToNext - xpInLevel} XP → {t.profile.level} {level + 1}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <StatCard label={t.dashboard.streak} value={`${streak}d`} icon="streak" />
          <StatCard label={t.dashboard.workouts} value={String(workoutStats?.totalWorkouts || 0)} icon="workouts" />
          <StatCard label="XP" value={String(xp)} icon="weight" />
        </div>

        {/* Physical data summary */}
        {profile?.gender && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 }}
            className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/50 mb-6"
          >
            <Ruler className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{profile.gender === "male" ? "🙋‍♂️" : profile.gender === "female" ? "🙋‍♀️" : "🧑"}</span>
              {profile.height_cm && <span>{profile.height_cm} cm</span>}
              {profile.weight_kg && <span>{profile.weight_kg} kg</span>}
            </div>
          </motion.div>
        )}
      </div>

      {/* Goal Banner */}
      <div className="px-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">{goalLabel}</h3>
                <p className="text-xs text-muted-foreground">{goalDesc}</p>
              </div>
            </div>
            {!hasOnboarding && (
              <button
                onClick={() => navigate("/onboarding")}
                className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
              >
                {locale === "es" ? "Configurar" : "Set up"}
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Free limit indicator */}
      {!isPro && (
        <div className="px-6 mb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {locale === "es"
                ? `Entrenos esta semana: ${workoutStats?.thisWeekWorkouts || 0}/${FREE_LIMITS.workoutsPerWeek}`
                : `Workouts this week: ${workoutStats?.thisWeekWorkouts || 0}/${FREE_LIMITS.workoutsPerWeek}`}
            </span>
            <ProUpsell compact />
          </div>
        </div>
      )}

      {/* Next Workout CTA or Completion Banner */}
      {allPlanCompleted ? (
        <div className="px-6 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-2xl bg-gradient-to-r from-achievement/15 to-primary/10 border border-achievement/30 text-center"
          >
            <Trophy className="w-10 h-10 text-achievement mx-auto mb-2" />
            <h3 className="text-lg font-bold text-foreground">
              {locale === "es" ? "¡Plan completado! 🎉" : "Plan completed! 🎉"}
            </h3>
            {(cycleCompletions?.length || 0) > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setShowCycleHistory(!showCycleHistory)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  🔄 {cycleCompletions!.length} {locale === "es"
                    ? (cycleCompletions!.length === 1 ? "ciclo completado" : "ciclos completados")
                    : (cycleCompletions!.length === 1 ? "cycle completed" : "cycles completed")}
                  <ChevronDown className={cn("w-3 h-3 transition-transform", showCycleHistory && "rotate-180")} />
                </button>
                {showCycleHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2 space-y-1.5 text-left"
                  >
                    {cycleCompletions!.map((c) => (
                      <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-card/50 border border-border/30">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {GOAL_LABELS[c.goal_type]?.[locale] || c.goal_type}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {c.workouts_count} {locale === "es" ? "entrenos" : "workouts"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            {(c as any).xp_earned > 0 && <span>⚡ {(c as any).xp_earned} XP</span>}
                            {(c as any).total_duration_minutes > 0 && <span>⏱ {(c as any).total_duration_minutes} min</span>}
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(c.completed_at).toLocaleDateString(locale === "es" ? "es-AR" : "en-US", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {locale === "es"
                ? "Completaste todos los entrenos de tu plan. ¡Cambiá tu objetivo o repetí el ciclo!"
                : "You finished all workouts in your plan. Change your goal or repeat the cycle!"}
            </p>
            {isPro ? (
              <button
                onClick={handleRestartCycle}
                disabled={resetting}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <RefreshCw className={cn("w-4 h-4", resetting && "animate-spin")} />
                {locale === "es" ? "Reiniciar ciclo" : "Restart cycle"}
              </button>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground">
                  {locale === "es"
                    ? "Pasate a Pro para reiniciar ciclos y entrenar sin límites"
                    : "Go Pro to restart cycles and train without limits"}
                </p>
                <button
                  onClick={() => navigate("/pricing")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-achievement text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  {locale === "es" ? "🚀 Pasate a Pro" : "🚀 Go Pro"}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      ) : nextWorkout && (
        <div className="px-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-bold text-foreground">
              {locale === "es" ? "Tu próximo entreno" : "Your next workout"}
            </h2>
          </div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <button
              onClick={() => navigate(`/workout/${nextWorkout.id}`)}
              className="w-full p-5 rounded-2xl bg-primary/10 border border-primary/30 shadow-[0_0_30px_hsl(142_72%_50%/0.12)] text-left group hover:shadow-[0_0_40px_hsl(142_72%_50%/0.2)] transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_20px_hsl(142_72%_50%/0.3)]">
                  <Play className="w-7 h-7 text-primary-foreground ml-0.5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">{nextWorkout.name}</h3>
                  <p className="text-sm text-muted-foreground">{nextWorkout.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-semibold text-xp">+{(nextWorkout.workout_exercises?.length || 3) * 30} XP</span>
                    {nextWorkout.estimated_duration && (
                      <span className="text-xs text-muted-foreground">~{nextWorkout.estimated_duration} {t.common.minutes}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{nextWorkout.workout_exercises?.length || 0} {t.common.exercises}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>
          </motion.div>
        </div>
      )}

      {/* Goal Changer */}
      <div className="px-6 mb-6">
        <GoalChanger currentGoal={goalKey} />
      </div>

      {/* Training Plan - Day 1, Day 2, etc. */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-bold text-foreground">
            {locale === "es" ? "Tu plan de entrenamiento" : "Your training plan"}
          </h2>
          <button onClick={() => navigate("/workout")} className="text-xs text-primary font-semibold">
            {locale === "es" ? "Ver todas" : "View all"}
          </button>
        </div>
        <div className="space-y-2">
          {visibleWorkouts.map((w, i) => {
            const completions = getCompletionCount(w.id);
            const isNext = w.id === nextWorkout?.id;
            const dayLabel = `${locale === "es" ? "Día" : "Day"} ${i + 1}`;
            return (
              <motion.button
                key={w.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                onClick={() => completions === 0 && navigate(`/workout/${w.id}`)}
                disabled={completions > 0}
                className={cn(
                  "w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left",
                  completions > 0
                    ? "bg-primary/5 border-primary/20 opacity-50 cursor-not-allowed"
                    : isNext
                    ? "bg-primary/5 border-primary/30 group"
                    : "bg-card border-border/50 hover:border-primary/20 group"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  completions > 0 ? "bg-primary/15" : isNext ? "bg-primary/20" : "bg-secondary"
                )}>
                  {completions > 0
                    ? <Check className="w-4 h-4 text-primary" />
                    : <span className="text-xs font-bold text-foreground">{i + 1}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-primary uppercase">{dayLabel}</span>
                    {w.goal_type && w.goal_type !== "general" && (
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {GOAL_LABELS[w.goal_type]?.[locale]?.split(" ").slice(1).join(" ")}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground truncate">{w.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {w.estimated_duration && (
                      <span className="text-[10px] text-muted-foreground">{w.estimated_duration} min</span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {w.workout_exercises?.length || 0} {t.common.exercises}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {completions > 0 && (
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      ✓ {completions}×
                    </span>
                  )}
                  {isNext && completions === 0 && (
                    <span className="text-[9px] font-bold text-primary bg-primary/15 px-2 py-0.5 rounded-full uppercase">
                      {locale === "es" ? "Siguiente" : "Next"}
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}

          {/* Locked days indicator for free users */}
          {hasLockedDays && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-dashed border-achievement/30 bg-achievement/5">
              <div className="w-10 h-10 rounded-xl bg-achievement/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-achievement" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">
                  {locale === "es"
                    ? `+${orderedWorkouts.length - FREE_LIMITS.maxDaysInPlan} días más con Pro`
                    : `+${orderedWorkouts.length - FREE_LIMITS.maxDaysInPlan} more days with Pro`}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {locale === "es" ? "Desbloqueá el plan completo" : "Unlock the full plan"}
                </p>
              </div>
              <ProUpsell compact />
            </div>
          )}
        </div>
      </div>

      {/* Weekly Challenge */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-display font-bold text-foreground mb-3">{t.dashboard.weeklyChallenge}</h2>
        <WeeklyChallenge goalKey={goalKey} thisWeekWorkouts={workoutStats?.thisWeekWorkouts || 0} />
      </div>

      {/* Pro Upsell for free users - subtle bottom placement */}
      {!isPro && (
        <div className="px-6 mb-6">
          <ProUpsell />
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Dashboard;
