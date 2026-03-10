import { motion } from "framer-motion";
import { Dumbbell, Play, Clock, Loader2, Target, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/i18n";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const GOAL_FILTERS = [
  { key: "all", es: "Todas", en: "All" },
  { key: "hipertrofia", es: "💪 Hipertrofia", en: "💪 Hypertrophy" },
  { key: "fuerza", es: "🏋️ Fuerza", en: "🏋️ Strength" },
  { key: "perdida_grasa", es: "⚡ Quema grasa", en: "⚡ Fat Loss" },
  { key: "movilidad", es: "🧘 Movilidad", en: "🧘 Mobility" },
  { key: "general", es: "🎯 General", en: "🎯 General" },
];

export function AssignedRoutines() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locale } = useI18n();
  const { isIndividual, isGymMember, gymName } = useUserRole();
  

  // Fetch user's fitness goal and gender for pre-selection
  const { data: userProfile } = useQuery({
    queryKey: ["assigned-routines-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("onboarding_progress")
        .select("fitness_goal")
        .eq("user_id", user!.id)
        .maybeSingle();
      const { data: prof } = await supabase
        .from("profiles")
        .select("gender")
        .eq("user_id", user!.id)
        .maybeSingle();
      return { fitnessGoal: data?.fitness_goal || null, gender: prof?.gender || null };
    },
    enabled: !!user && isIndividual,
  });

  

  // Assigned routines (gym members)
  const { data: assignments, isLoading: assignLoading } = useQuery({
    queryKey: ["my-assignments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_assignments")
        .select("id, notes, assigned_at, workout_id, workouts(id, name, description, estimated_duration, difficulty, goal_type, workout_exercises(id))")
        .eq("user_id", user!.id)
        .order("assigned_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !isIndividual,
  });

  // Global workouts (for individual users) - filtered by gender
  const userGender = userProfile?.gender;
  const { data: globalWorkouts, isLoading: globalLoading } = useQuery({
    queryKey: ["global-workouts", userGender],
    queryFn: async () => {
      let query = supabase
        .from("workouts")
        .select("id, name, description, estimated_duration, difficulty, goal_type, target_gender, workout_exercises(id)")
        .eq("is_global", true)
        .order("name");
      // Filter by gender: show unisex + user's gender
      if (userGender && userGender !== "other") {
        query = query.in("target_gender", [userGender, "unisex"]);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && isIndividual,
  });

  // Recent workout logs
  const { data: recentLogs } = useQuery({
    queryKey: ["recent-workout-logs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_logs")
        .select("workout_id, completed_at")
        .eq("user_id", user!.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  const isLoading = assignLoading || globalLoading;

  const difficultyLabel = (d: string | null) => {
    const map: Record<string, string> = {
      beginner: locale === "es" ? "Principiante" : "Beginner",
      intermediate: locale === "es" ? "Intermedio" : "Intermediate",
      advanced: locale === "es" ? "Avanzado" : "Advanced",
      elite: "Elite",
    };
    return map[d || "beginner"] || d;
  };

  const difficultyColor = (d: string | null) => {
    const map: Record<string, string> = {
      beginner: "text-primary",
      intermediate: "text-achievement",
      advanced: "text-energy",
      elite: "text-destructive",
    };
    return map[d || "beginner"] || "text-muted-foreground";
  };

  const getCompletionCount = (workoutId: string) => {
    return recentLogs?.filter(l => l.workout_id === workoutId).length || 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Build routines list
  let routines = !isIndividual
    ? (assignments || []).map(a => ({
        id: (a.workouts as any)?.id,
        name: (a.workouts as any)?.name || "—",
        description: (a.workouts as any)?.description,
        duration: (a.workouts as any)?.estimated_duration,
        difficulty: (a.workouts as any)?.difficulty,
        goalType: (a.workouts as any)?.goal_type,
        exerciseCount: (a.workouts as any)?.workout_exercises?.length || 0,
        notes: a.notes,
      }))
    : (globalWorkouts || []).map(w => ({
        id: w.id,
        name: w.name,
        description: w.description,
        duration: w.estimated_duration,
        difficulty: w.difficulty,
        goalType: (w as any).goal_type,
        exerciseCount: w.workout_exercises?.length || 0,
        notes: null,
      }));

  // For individual users: only show routines matching their goal
  if (isIndividual && userProfile?.fitnessGoal) {
    routines = routines.filter(r => r.goalType === userProfile.fitnessGoal);
  }

  if (routines.length === 0) {
    return (
      <div className="text-center py-12">
        <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground text-sm mb-2">
          {isGymMember
            ? (locale === "es" ? "Tu gym aún no te asignó rutinas" : "Your gym hasn't assigned routines yet")
            : (locale === "es" ? "No hay rutinas disponibles para tu objetivo" : "No routines available for your goal")}
        </p>
        {isIndividual && (
          <p className="text-xs text-muted-foreground/70">
            {locale === "es" ? "Cambiá tu objetivo desde Perfil para ver otras rutinas" : "Change your goal from Profile to see other routines"}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Clear header showing mode */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-foreground">
          {isGymMember
            ? (locale === "es" ? `Rutinas de ${gymName || "tu gimnasio"}` : `${gymName || "Your gym"}'s Routines`)
            : (locale === "es" ? "Catálogo Global" : "Global Catalog")}
        </h2>
        {isGymMember && (
          <span className="text-xs px-2 py-1 rounded-full bg-achievement/10 text-achievement font-medium">
            🏋️ Gym
          </span>
        )}
        {isIndividual && (
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
            🏃 Individual
          </span>
        )}
      </div>

      {/* No filter chips - routines are auto-filtered by user's goal */}

      {routines.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-6">
          {locale === "es" ? "No hay rutinas para tu objetivo actual" : "No routines for your current goal"}
        </p>
      )}

      {routines.map((r, i) => {
        const completions = getCompletionCount(r.id);
        const isCompleted = completions > 0;
        return (
          <motion.button
            key={r.id || i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => !isCompleted && r.id && navigate(`/workout/${r.id}`)}
            disabled={isCompleted}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
              isCompleted
                ? "bg-primary/5 border-primary/20 opacity-50 cursor-not-allowed"
                : "bg-card border-border/50 hover:border-primary/30 group"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
              isCompleted ? "bg-primary/10" : "bg-primary/10 group-hover:bg-primary/20"
            )}>
              {isCompleted ? <Check className="w-6 h-6 text-primary" /> : <Dumbbell className="w-6 h-6 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{r.name}</h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {r.duration && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Clock className="w-3 h-3" /> {r.duration} min
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">
                  {r.exerciseCount} {locale === "es" ? "ejercicios" : "exercises"}
                </span>
                {r.difficulty && (
                  <span className={`text-[10px] font-medium ${difficultyColor(r.difficulty)}`}>
                    {difficultyLabel(r.difficulty)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {isCompleted ? (
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                  ✓ {locale === "es" ? "Hecho" : "Done"}
                </span>
              ) : (
                <Play className="w-5 h-5 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </motion.button>
        );
      })}

    </div>
  );
}
