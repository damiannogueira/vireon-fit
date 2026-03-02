import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, SkipForward, Check, Timer, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { XPBar } from "@/components/XPBar";
import { useI18n } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const XP_PER_SET = 10;

interface SetData {
  reps: number;
  weight: number;
  completed: boolean;
}

interface ExerciseState {
  id: string;
  exerciseId: string;
  name: string;
  sets: SetData[];
  restSeconds: number;
}

const Workout = () => {
  const navigate = useNavigate();
  const { workoutId } = useParams<{ workoutId: string }>();
  const { t } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const startedAt = useRef(new Date().toISOString());

  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [exercises, setExercises] = useState<ExerciseState[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load workout + exercises from Supabase
  const { data: workout, isLoading } = useQuery({
    queryKey: ["workout-detail", workoutId],
    queryFn: async () => {
      if (!workoutId) return null;
      const { data, error } = await supabase
        .from("workouts")
        .select("id, name, description, estimated_duration, gym_id")
        .eq("id", workoutId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!workoutId,
  });

  const { data: workoutExercisesData, isLoading: exercisesLoading } = useQuery({
    queryKey: ["workout-exercises", workoutId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_exercises")
        .select("id, exercise_id, sets, reps, rest_seconds, sort_order, exercises(name)")
        .eq("workout_id", workoutId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!workoutId,
  });

  // Initialize exercises state from fetched data
  if (workoutExercisesData && workoutExercisesData.length > 0 && !initialized) {
    const mapped: ExerciseState[] = workoutExercisesData.map((we) => ({
      id: we.id,
      exerciseId: we.exercise_id,
      name: (we.exercises as any)?.name || "Exercise",
      restSeconds: we.rest_seconds || 60,
      sets: Array.from({ length: we.sets || 3 }, () => ({
        reps: we.reps || 10,
        weight: 0,
        completed: false,
      })),
    }));
    setExercises(mapped);
    setInitialized(true);
  }

  // Fallback mock data when no workoutId
  const mockExercises: ExerciseState[] = useMemo(() => [
    { id: "1", exerciseId: "", name: (t.workout as any).benchPress || "Bench Press", sets: [{ reps: 10, weight: 60, completed: false }, { reps: 8, weight: 65, completed: false }, { reps: 8, weight: 65, completed: false }, { reps: 6, weight: 70, completed: false }], restSeconds: 120 },
    { id: "2", exerciseId: "", name: (t.workout as any).inclineDB || "Incline DB Press", sets: [{ reps: 12, weight: 22, completed: false }, { reps: 10, weight: 24, completed: false }, { reps: 10, weight: 24, completed: false }], restSeconds: 90 },
    { id: "3", exerciseId: "", name: (t.workout as any).cableFly || "Cable Fly", sets: [{ reps: 15, weight: 15, completed: false }, { reps: 12, weight: 17, completed: false }, { reps: 12, weight: 17, completed: false }], restSeconds: 60 },
    { id: "4", exerciseId: "", name: (t.workout as any).militaryPress || "Military Press", sets: [{ reps: 10, weight: 40, completed: false }, { reps: 8, weight: 42, completed: false }, { reps: 8, weight: 42, completed: false }], restSeconds: 90 },
    { id: "5", exerciseId: "", name: (t.workout as any).lateralRaise || "Lateral Raise", sets: [{ reps: 15, weight: 10, completed: false }, { reps: 12, weight: 12, completed: false }, { reps: 12, weight: 12, completed: false }], restSeconds: 60 },
    { id: "6", exerciseId: "", name: (t.workout as any).tricepsPushdown || "Triceps Pushdown", sets: [{ reps: 15, weight: 25, completed: false }, { reps: 12, weight: 27, completed: false }, { reps: 12, weight: 27, completed: false }], restSeconds: 60 },
  ], [t]);

  const activeExercises = (workoutId && initialized && exercises.length > 0) ? exercises : (!workoutId ? mockExercises : exercises);

  // Complete workout mutation
  const completeWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const completedSetsCount = activeExercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0);
      const xpEarned = completedSetsCount * XP_PER_SET;
      const now = new Date().toISOString();
      const durationMs = new Date(now).getTime() - new Date(startedAt.current).getTime();
      const durationMinutes = Math.round(durationMs / 60000);

      // Insert workout log
      const { error: logError } = await supabase.from("workout_logs").insert({
        user_id: user.id,
        workout_id: workoutId || null,
        started_at: startedAt.current,
        completed_at: now,
        duration_minutes: durationMinutes,
        xp_earned: xpEarned,
      });
      if (logError) throw logError;

      // Update profile XP and level
      const { data: profile } = await supabase
        .from("profiles")
        .select("xp, level")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        const newXp = (profile.xp || 0) + xpEarned;
        const newLevel = Math.floor(newXp / 500) + 1;
        await supabase
          .from("profiles")
          .update({ xp: newXp, level: newLevel })
          .eq("user_id", user.id);
      }

      return { xpEarned, completedSetsCount };
    },
    onSuccess: ({ xpEarned, completedSetsCount }) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-profile"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-workout-stats"] });
      queryClient.invalidateQueries({ queryKey: ["profile-page"] });
      toast.success(`🏆 +${xpEarned} XP (${completedSetsCount} sets)`);
      navigate("/dashboard");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al guardar el entreno");
    },
  });

  if (isLoading || exercisesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (activeExercises.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <p className="text-muted-foreground mb-4">No se encontraron ejercicios para esta rutina.</p>
        <button onClick={() => navigate("/dashboard")} className="text-primary font-semibold">Volver al Dashboard</button>
      </div>
    );
  }

  const currentExercise = activeExercises[currentExIdx];
  const totalSets = activeExercises.reduce((a, e) => a + e.sets.length, 0);
  const completedSets = activeExercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0);

  const completeSet = (exIdx: number, setIdx: number) => {
    const setter = workoutId && initialized ? setExercises : undefined;
    const updateFn = (prev: ExerciseState[]) => prev.map((ex, ei) =>
      ei === exIdx ? { ...ex, sets: ex.sets.map((s, si) => si === setIdx ? { ...s, completed: !s.completed } : s) } : ex
    );
    if (setter) setter(updateFn);
    // For mock mode, we need local state too — but mockExercises is useMemo so we need exercises state
    if (!workoutId) {
      if (!initialized) {
        setExercises(updateFn(mockExercises));
        setInitialized(true);
      } else {
        setExercises(updateFn);
      }
    }
  };

  const updateSetValue = (exIdx: number, setIdx: number, field: "reps" | "weight", value: number) => {
    if (isNaN(value) || value < 0) return;
    if (field === "weight" && value > 500) return;
    if (field === "reps" && value > 100) return;
    const updateFn = (prev: ExerciseState[]) => prev.map((ex, ei) =>
      ei === exIdx ? { ...ex, sets: ex.sets.map((s, si) => si === setIdx ? { ...s, [field]: value } : s) } : ex
    );
    if (workoutId || initialized) {
      setExercises(updateFn);
    } else {
      setExercises(updateFn(mockExercises));
      setInitialized(true);
    }
  };

  const handleFinish = () => {
    if (user) {
      completeWorkoutMutation.mutate();
    } else {
      navigate("/dashboard");
    }
  };

  const workoutTitle = workout?.name || "Push Day";

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-strong px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h1 className="text-sm font-bold text-foreground">{workoutTitle}</h1>
            <p className="text-xs text-muted-foreground">{completedSets}/{totalSets} sets</p>
          </div>
          <button
            onClick={handleFinish}
            disabled={completeWorkoutMutation.isPending}
            className="text-xs font-semibold text-primary disabled:opacity-50"
          >
            {t.workout.finish}
          </button>
        </div>
        <XPBar current={completedSets} max={totalSets} variant="xp" size="sm" showValues={false} />
      </div>

      {/* Exercise Navigation */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none">
        {activeExercises.map((ex, i) => {
          const allDone = ex.sets.every(s => s.completed);
          return (
            <button
              key={ex.id}
              onClick={() => setCurrentExIdx(i)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                i === currentExIdx
                  ? "bg-primary text-primary-foreground"
                  : allDone
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {i + 1}. {ex.name.split(" ")[0]}
            </button>
          );
        })}
      </div>

      {/* Current Exercise */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentExIdx}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="px-4"
        >
          <div className="mb-4">
            <h2 className="text-xl font-display font-bold text-foreground">{currentExercise.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Timer className="w-3 h-3" /> {currentExercise.restSeconds}s {t.workout.rest}
              </span>
              <span className="text-xs text-muted-foreground">{currentExercise.sets.length} {t.workout.sets}</span>
            </div>
          </div>

          {/* Sets Table */}
          <div className="rounded-2xl overflow-hidden border border-border/50 bg-card">
            <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-0 text-xs text-muted-foreground font-medium px-4 py-2.5 bg-secondary/50">
              <span>SET</span>
              <span className="text-center">KG</span>
              <span className="text-center">REPS</span>
              <span className="text-center w-10">✓</span>
            </div>
            {currentExercise.sets.map((set, si) => (
              <div
                key={si}
                className={cn(
                  "grid grid-cols-[auto_1fr_1fr_auto] gap-0 items-center px-4 py-3 border-t border-border/30",
                  set.completed && "bg-primary/5"
                )}
              >
                <span className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold",
                  set.completed ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                )}>
                  {si + 1}
                </span>
                <div className="flex justify-center">
                  <input
                    type="number"
                    min="0"
                    max="500"
                    step="0.5"
                    value={set.weight}
                    onChange={(e) => updateSetValue(currentExIdx, si, "weight", Number(e.target.value))}
                    className="w-16 h-9 rounded-lg bg-secondary border border-border/50 text-center text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex justify-center">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={set.reps}
                    onChange={(e) => updateSetValue(currentExIdx, si, "reps", Number(e.target.value))}
                    className="w-16 h-9 rounded-lg bg-secondary border border-border/50 text-center text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => completeSet(currentExIdx, si)}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    set.completed
                      ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(142_72%_50%/0.3)]"
                      : "bg-secondary text-muted-foreground hover:bg-primary/20 hover:text-primary"
                  )}
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {currentExIdx > 0 && (
              <button
                onClick={() => setCurrentExIdx(i => i - 1)}
                className="flex-1 h-12 rounded-2xl bg-secondary text-secondary-foreground font-semibold transition-all hover:bg-secondary/80"
              >
                {t.workout.previous}
              </button>
            )}
            {currentExIdx < activeExercises.length - 1 ? (
              <button
                onClick={() => setCurrentExIdx(i => i + 1)}
                className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_hsl(142_72%_50%/0.2)] transition-all active:scale-[0.98]"
              >
                {t.workout.next} <SkipForward className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={completeWorkoutMutation.isPending}
                className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_hsl(142_72%_50%/0.2)] transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {completeWorkoutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.workout.completeWorkout}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Workout;
