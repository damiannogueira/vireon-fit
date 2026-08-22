import { motion } from "framer-motion";
import { Dumbbell, Play, Clock, Loader2, Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/i18n";
import { localizedField } from "@/i18n/dbLabels";
import { useSmartRoutineGenerator } from "@/hooks/useSmartRoutineGenerator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AssignedRoutines() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locale } = useI18n();
  const { generate, generating } = useSmartRoutineGenerator();

  // Onboarding check
  const { data: hasOnboarding } = useQuery({
    queryKey: ["assigned-routines-onboarding", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("onboarding_progress")
        .select("fitness_goal")
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data?.fitness_goal;
    },
    enabled: !!user,
  });

  // Personal AI-generated workouts only
  const { data: personalWorkouts, isLoading } = useQuery({
    queryKey: ["personal-workouts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("id, name, name_en, description, description_en, estimated_duration, difficulty, workout_exercises(id)")
        .eq("created_by", user!.id)
        .eq("is_global", false)
        .order("created_at");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
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

  const handleGenerate = async () => {
    const result = await generate();
    if (result) {
      toast.success(
        locale === "es"
          ? `🧠 Plan "${result.plan_name}" generado con ${result.days?.length || 0} días`
          : `🧠 Plan "${result.plan_name}" generated with ${result.days?.length || 0} days`
      );
    }
  };

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

  const routines = (personalWorkouts || []).map(w => ({
    id: w.id,
    name: localizedField(w, "name", locale),
    description: localizedField(w, "description", locale),
    duration: w.estimated_duration,
    difficulty: w.difficulty,
    exerciseCount: w.workout_exercises?.length || 0,
  }));

  if (routines.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-foreground text-sm font-semibold mb-1">
          {locale === "es" ? "Aún no tenés rutinas" : "You don't have routines yet"}
        </p>
        <p className="text-xs text-muted-foreground mb-5">
          {!hasOnboarding
            ? (locale === "es"
                ? "Completá tu configuración inicial para generar tu plan."
                : "Complete your setup first to generate your plan.")
            : (locale === "es"
                ? "Generá tu rutina personalizada con inteligencia artificial 🤖"
                : "Generate your personalized routine with AI 🤖")}
        </p>
        {!hasOnboarding ? (
          <button
            onClick={() => navigate("/onboarding")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            {locale === "es" ? "Configurar ahora" : "Set up now"}
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {locale === "es" ? "Generando..." : "Generating..."}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {locale === "es" ? "🧠 Generar mi rutina" : "🧠 Generate my routine"}
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-foreground">
          {locale === "es" ? "Tus Rutinas" : "Your Routines"}
        </h2>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {locale === "es" ? "Regenerar con IA" : "Regenerate with AI"}
        </button>
      </div>

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
