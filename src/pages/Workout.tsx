import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, SkipForward, Check, Timer, Loader2, Lock, Dumbbell, TrendingUp, Minus, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { XPBar } from "@/components/XPBar";
import { BottomNav } from "@/components/BottomNav";
import { AssignedRoutines } from "@/components/AssignedRoutines";
import { ProUpsell } from "@/components/ProUpsell";
import { useI18n } from "@/i18n";
import { localizedField, translateDbLabel } from "@/i18n/dbLabels";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, FREE_LIMITS } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { RestTimer } from "@/components/workout/RestTimer";
import { ExerciseStartPrompt } from "@/components/workout/ExerciseStartPrompt";
import { WorkoutSummary } from "@/components/workout/WorkoutSummary";
import { WarmupPhase } from "@/components/workout/WarmupPhase";
import { useProgressiveOverload, calculateProgression } from "@/hooks/useProgressiveOverload";
import type { ProgressionSuggestion } from "@/hooks/useProgressiveOverload";
import { useWeeklyAdjustment } from "@/hooks/useWeeklyAdjustment";

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
  description: string;
  displayName: string;
  displayDescription: string;
  muscleGroup: string;
  sets: SetData[];
  restSeconds: number;
  progression?: ProgressionSuggestion;
}

const Workout = () => {
  const navigate = useNavigate();
  const { workoutId } = useParams<{ workoutId: string }>();
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const queryClient = useQueryClient();
  const startedAt = useRef(new Date().toISOString());

  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [exercises, setExercises] = useState<ExerciseState[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restSeconds, setRestSeconds] = useState(60);
  const [exerciseStarted, setExerciseStarted] = useState<Record<number, boolean>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [warmupCompleted, setWarmupCompleted] = useState(false);
  const [summaryData, setSummaryData] = useState<{ xpEarned: number; completedSetsCount: number; durationMinutes: number } | null>(null);

  // Check weekly workout count for free limit
  const { data: weeklyCount } = useQuery({
    queryKey: ["weekly-workout-count", user?.id],
    queryFn: async () => {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
      startOfWeek.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("workout_logs")
        .select("id")
        .eq("user_id", user!.id)
        .not("completed_at", "is", null)
        .gte("completed_at", startOfWeek.toISOString());
      return data?.length || 0;
    },
    enabled: !!user && !!workoutId,
  });

  const atFreeLimit = !isPro && (weeklyCount || 0) >= FREE_LIMITS.workoutsPerWeek;

  // Load workout + exercises from Supabase
  const { data: workout, isLoading } = useQuery({
    queryKey: ["workout-detail", workoutId],
    queryFn: async () => {
      if (!workoutId) return null;
      const { data, error } = await supabase
        .from("workouts")
        .select("id, name, name_en, description, description_en, estimated_duration, gym_id")
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
        .select("id, exercise_id, sets, reps, rest_seconds, sort_order, default_weight, exercises(name, name_en, description, description_en, muscle_group, image_url)")
        .eq("workout_id", workoutId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!workoutId,
  });

  // Get user fitness level for progression calculations
  const { data: userProfile } = useQuery({
    queryKey: ["workout-user-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("fitness_level")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Get exercise names for progressive overload query
  const exerciseNames = useMemo(() => {
    if (!workoutExercisesData) return [];
    return workoutExercisesData.map(we => (we.exercises as any)?.name || "").filter(Boolean);
  }, [workoutExercisesData]);

  // Progressive overload data
  const { data: historyMap } = useProgressiveOverload(
    user?.id,
    exerciseNames,
    userProfile?.fitness_level || undefined
  );

  // Weekly adjustment data
  const { data: weeklyAdjustment } = useWeeklyAdjustment(user?.id);
  const weeklyMultiplier = weeklyAdjustment?.weight_multiplier ?? 1.0;
  const weeklyRepsModifier = weeklyAdjustment?.reps_modifier ?? 0;

  // Initialize exercises state from fetched data WITH progressive overload
  useEffect(() => {
    if (!workoutExercisesData || workoutExercisesData.length === 0 || initialized) return;
    if (!historyMap && exerciseNames.length > 0) return; // Wait for history

    const mapped: ExerciseState[] = workoutExercisesData.map((we) => {
      const name = (we.exercises as any)?.name || "Exercise";
      const muscleGroup = (we.exercises as any)?.muscle_group || "";
      const defaultWeight = Number((we as any).default_weight) || 0;
      const defaultReps = we.reps || 10;

      // Calculate progression with weekly adjustment
      const history = historyMap?.[name] || [];
      const progression = calculateProgression(
        history,
        defaultWeight,
        defaultReps,
        muscleGroup,
        userProfile?.fitness_level || undefined,
        weeklyMultiplier,
        weeklyRepsModifier
      );

      const appliedWeight = progression.isProgression || history.length > 0
        ? progression.suggestedWeight
        : defaultWeight;
      const appliedReps = progression.isProgression || history.length > 0
        ? progression.suggestedReps
        : defaultReps;

      return {
        id: we.id,
        exerciseId: we.exercise_id,
        name,
        description: (we.exercises as any)?.description || "",
        displayName: localizedField(we.exercises as any, "name", locale) || name,
        displayDescription: localizedField(we.exercises as any, "description", locale),
        muscleGroup,
        restSeconds: we.rest_seconds || 60,
        progression,
        sets: Array.from({ length: we.sets || 3 }, () => ({
          reps: appliedReps,
          weight: appliedWeight,
          completed: false,
        })),
      };
    });
    setExercises(mapped);
    setInitialized(true);
  }, [workoutExercisesData, historyMap, initialized, userProfile, exerciseNames.length, locale, weeklyMultiplier, weeklyRepsModifier]);

  const activeExercises = initialized ? exercises : [];
  const workoutTitle = localizedField(workout, "name", locale) || "Workout";

  // Collect muscle groups for warmup
  const workoutMuscleGroups = useMemo(() => {
    return [...new Set(activeExercises.map(e => e.muscleGroup).filter(Boolean))];
  }, [activeExercises]);

  const adjustWeight = (exIdx: number, setIdx: number, delta: number) => {
    setExercises(prev => prev.map((ex, ei) =>
      ei === exIdx ? {
        ...ex,
        sets: ex.sets.map((s, si) =>
          si === setIdx ? { ...s, weight: Math.max(0, +(s.weight + delta).toFixed(2)) } : s
        ),
      } : ex
    ));
  };

  const adjustReps = (exIdx: number, setIdx: number, delta: number) => {
    setExercises(prev => prev.map((ex, ei) =>
      ei === exIdx ? {
        ...ex,
        sets: ex.sets.map((s, si) =>
          si === setIdx ? { ...s, reps: Math.max(1, s.reps + delta) } : s
        ),
      } : ex
    ));
  };

  // Complete workout mutation
  const completeWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const completedSetsCount = activeExercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0);
      const xpEarned = completedSetsCount * XP_PER_SET;
      const now = new Date().toISOString();
      const durationMinutes = workout?.estimated_duration || Math.max(1, Math.round((new Date(now).getTime() - new Date(startedAt.current).getTime()) / 60000));

      const { data: logData, error: logError } = await supabase.from("workout_logs").insert({
        user_id: user.id,
        workout_id: workoutId || null,
        started_at: startedAt.current,
        completed_at: now,
        duration_minutes: durationMinutes,
        xp_earned: xpEarned,
      }).select("id").single();
      if (logError) throw logError;

      // Save per-exercise detail logs
      const exerciseLogs = activeExercises
        .filter(e => e.sets.some(s => s.completed))
        .map(e => {
          const completedSets = e.sets.filter(s => s.completed);
          return {
            workout_log_id: logData.id,
            exercise_name: e.name,
            sets_completed: completedSets.length,
            reps_per_set: completedSets.map(s => s.reps),
            weight_per_set: completedSets.map(s => s.weight),
          };
        });
      if (exerciseLogs.length > 0) {
        await supabase.from("workout_exercise_logs").insert(exerciseLogs);
      }

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

      const actualDuration = Math.max(1, Math.round((new Date(now).getTime() - new Date(startedAt.current).getTime()) / 60000));
      return { xpEarned, completedSetsCount, durationMinutes: actualDuration };
    },
    onSuccess: ({ xpEarned, completedSetsCount, durationMinutes: dur }) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-profile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-workout-stats", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-recent-logs", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["profile-page", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["user-achievements", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["achievements-workout-count", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["achievements-weekly-workouts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["weekly-workout-count", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["progressive-overload", user?.id] });
      setSummaryData({ xpEarned, completedSetsCount, durationMinutes: dur });
      setShowSummary(true);
    },
    onError: (err: any) => {
      toast.error(err.message || (locale === "es" ? "Error al guardar el entreno" : "Failed to save workout"));
    },
  });

  // If no workoutId, show routine picker
  if (!workoutId) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-6 pt-8">
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">
            {t.nav.workout}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {locale === "es" ? "Elegí una rutina para entrenar" : "Choose a routine to train"}
          </p>
          <AssignedRoutines />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (isLoading || exercisesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Free limit reached
  if (atFreeLimit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center gap-4">
        <Lock className="w-12 h-12 text-achievement" />
        <h2 className="text-xl font-bold text-foreground">
          {locale === "es" ? "Límite semanal alcanzado" : "Weekly limit reached"}
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          {locale === "es"
            ? `Ya completaste ${FREE_LIMITS.workoutsPerWeek} entrenos esta semana. ¡Pasate a Pro para entrenar sin límites!`
            : `You've completed ${FREE_LIMITS.workoutsPerWeek} workouts this week. Go Pro for unlimited training!`}
        </p>
        <ProUpsell message={locale === "es" ? "Entrenamientos ilimitados, retos exclusivos y más" : "Unlimited workouts, exclusive challenges and more"} />
        <button onClick={() => navigate("/dashboard")} className="text-primary font-semibold text-sm mt-2">
          {locale === "es" ? "Volver al Dashboard" : "Back to Dashboard"}
        </button>
      </div>
    );
  }

  if (activeExercises.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <p className="text-muted-foreground mb-4">
          {locale === "es" ? "No se encontraron ejercicios para esta rutina." : "No exercises found for this routine."}
        </p>
        <button onClick={() => navigate("/dashboard")} className="text-primary font-semibold">
          {locale === "es" ? "Volver al Dashboard" : "Back to Dashboard"}
        </button>
      </div>
    );
  }

  // Show warmup phase before exercises
  if (!warmupCompleted && activeExercises.length > 0) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 glass-strong px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-sm font-bold text-foreground">{workoutTitle}</h1>
          <div className="w-6" />
        </div>
        <WarmupPhase
          muscleGroups={workoutMuscleGroups}
          onComplete={() => setWarmupCompleted(true)}
          locale={locale}
        />
      </div>
    );
  }

  const currentExercise = activeExercises[currentExIdx];
  const totalSets = activeExercises.reduce((a, e) => a + e.sets.length, 0);
  const completedSets = activeExercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0);

  const canCompleteSet = (exIdx: number, setIdx: number) => {
    if (setIdx === 0) return true;
    return activeExercises[exIdx].sets[setIdx - 1].completed;
  };

  const allSetsCompleted = (exIdx: number) => {
    return activeExercises[exIdx].sets.every(s => s.completed);
  };

  const completeSet = (exIdx: number, setIdx: number) => {
    if (!canCompleteSet(exIdx, setIdx)) return;
    const set = activeExercises[exIdx].sets[setIdx];
    const wasCompleted = set.completed;
    
    if (wasCompleted) {
      setExercises(prev => prev.map((ex, ei) =>
        ei === exIdx ? { ...ex, sets: ex.sets.map((s, si) => si >= setIdx ? { ...s, completed: false } : s) } : ex
      ));
      return;
    }

    setExercises(prev => prev.map((ex, ei) =>
      ei === exIdx ? { ...ex, sets: ex.sets.map((s, si) => si === setIdx ? { ...s, completed: true } : s) } : ex
    ));

    if (!wasCompleted) {
      const exercise = activeExercises[exIdx];
      const isLastSet = setIdx === exercise.sets.length - 1 && exercise.sets.slice(0, setIdx).every(s => s.completed);
      const isLastExercise = exIdx === activeExercises.length - 1;
      if (!(isLastSet && isLastExercise)) {
        setRestSeconds(exercise.restSeconds);
        setShowRestTimer(true);
      }
    }
  };

  const handleStartExercise = (idx: number) => {
    setExerciseStarted(prev => ({ ...prev, [idx]: true }));
  };

  const isCurrentExerciseStarted = exerciseStarted[currentExIdx] ?? false;

  const handleFinish = () => {
    if (user) {
      completeWorkoutMutation.mutate();
    } else {
      navigate("/dashboard");
    }
  };


  // Build summary exercise data
  const summaryExercises = activeExercises.map(ex => {
    const completedSetsList = ex.sets.filter(s => s.completed);
    const avgWeight = completedSetsList.length > 0
      ? Math.round((completedSetsList.reduce((a, s) => a + s.weight, 0) / completedSetsList.length) * 10) / 10
      : 0;
    const avgReps = completedSetsList.length > 0
      ? Math.round(completedSetsList.reduce((a, s) => a + s.reps, 0) / completedSetsList.length)
      : 0;
    const totalVolume = completedSetsList.reduce((a, s) => a + s.weight * s.reps, 0);
    return {
      name: ex.displayName,
      muscleGroup: ex.muscleGroup,
      setsCompleted: completedSetsList.length,
      totalSets: ex.sets.length,
      avgWeight,
      avgReps,
      totalVolume,
      progression: ex.progression,
    };
  });

  if (showSummary && summaryData) {
    return (
      <WorkoutSummary
        workoutName={workoutTitle}
        xpEarned={summaryData.xpEarned}
        totalSets={totalSets}
        completedSets={summaryData.completedSetsCount}
        durationMinutes={summaryData.durationMinutes}
        exercises={summaryExercises}
        locale={locale}
        onClose={() => navigate("/dashboard")}
      />
    );
  }

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
              {i + 1}. {ex.displayName}
            </button>
          );
        })}
      </div>

      {/* Rest Timer Overlay */}
      <AnimatePresence>
        {showRestTimer && (
          <RestTimer
            seconds={restSeconds}
            locale={locale}
            onComplete={() => setShowRestTimer(false)}
            onSkip={() => setShowRestTimer(false)}
          />
        )}
      </AnimatePresence>

      {/* Current Exercise */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentExIdx}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="px-4"
        >
          {!isCurrentExerciseStarted ? (
            <ExerciseStartPrompt
              exerciseName={currentExercise.displayName}
              exerciseNumber={currentExIdx + 1}
              totalExercises={activeExercises.length}
              description={currentExercise.displayDescription}
              muscleGroup={currentExercise.muscleGroup}
              exerciseId={currentExercise.exerciseId}
              onStart={() => handleStartExercise(currentExIdx)}
            />
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-xl font-display font-bold text-foreground">{currentExercise.displayName}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Timer className="w-3 h-3" /> {currentExercise.restSeconds}s {t.workout.rest}
                  </span>
                  <span className="text-xs text-muted-foreground">{currentExercise.sets.length} {t.workout.sets}</span>
                </div>
              </div>

              {/* Progressive Overload Banner */}
              {currentExercise.progression && currentExercise.progression.previousWeight > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mb-4 p-3 rounded-xl border flex items-center gap-3",
                    currentExercise.progression.isProgression
                      ? "bg-primary/10 border-primary/30"
                      : "bg-secondary border-border/50"
                  )}
                >
                  <TrendingUp className={cn(
                    "w-5 h-5 flex-shrink-0",
                    currentExercise.progression.isProgression ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs font-semibold",
                      currentExercise.progression.isProgression ? "text-primary" : "text-foreground"
                    )}>
                      {translateDbLabel(currentExercise.progression.message, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {locale === "es" ? "Anterior" : "Previous"}: {currentExercise.progression.previousWeight}kg × {currentExercise.progression.previousReps} reps
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Sets Table */}
              <div className="rounded-2xl overflow-hidden border border-border/50 bg-card">
                <div className="grid grid-cols-[40px_1fr_1fr_44px] gap-0 text-xs text-muted-foreground font-medium px-3 py-2.5 bg-secondary/50">
                  <span className="text-center">SET</span>
                  <span className="text-center">KG</span>
                  <span className="text-center">REPS</span>
                  <span className="text-center">✓</span>
                </div>
                {currentExercise.sets.map((set, si) => (
                  <div
                    key={si}
                    className={cn(
                      "grid grid-cols-[40px_1fr_1fr_44px] gap-0 items-center px-3 py-2 border-t border-border/30",
                      set.completed && "bg-primary/5"
                    )}
                  >
                    <span className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mx-auto",
                      set.completed ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                    )}>
                      {si + 1}
                    </span>

                    {/* Editable Weight */}
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => adjustWeight(currentExIdx, si, -2.5)}
                        disabled={set.completed}
                        className="w-7 h-7 rounded-lg bg-secondary/70 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-14 h-8 rounded-lg bg-secondary/50 border border-border/30 flex items-center justify-center text-sm font-semibold text-foreground">
                        {set.weight}
                      </span>
                      <button
                        onClick={() => adjustWeight(currentExIdx, si, 2.5)}
                        disabled={set.completed}
                        className="w-7 h-7 rounded-lg bg-secondary/70 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Editable Reps */}
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => adjustReps(currentExIdx, si, -1)}
                        disabled={set.completed}
                        className="w-7 h-7 rounded-lg bg-secondary/70 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-10 h-8 rounded-lg bg-secondary/50 border border-border/30 flex items-center justify-center text-sm font-semibold text-foreground">
                        {set.reps}
                      </span>
                      <button
                        onClick={() => adjustReps(currentExIdx, si, 1)}
                        disabled={set.completed}
                        className="w-7 h-7 rounded-lg bg-secondary/70 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => completeSet(currentExIdx, si)}
                      disabled={!canCompleteSet(currentExIdx, si) && !set.completed}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all mx-auto",
                        set.completed
                          ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                          : canCompleteSet(currentExIdx, si)
                            ? "bg-secondary text-muted-foreground hover:bg-primary/20 hover:text-primary"
                            : "bg-secondary/50 text-muted-foreground/30 cursor-not-allowed"
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
                    disabled={!allSetsCompleted(currentExIdx)}
                    className={cn(
                      "flex-1 h-12 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                      allSetsCompleted(currentExIdx)
                        ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.2)]"
                        : "bg-secondary text-muted-foreground cursor-not-allowed opacity-50"
                    )}
                  >
                    {t.workout.next} <SkipForward className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinish}
                    disabled={completeWorkoutMutation.isPending || !allSetsCompleted(currentExIdx)}
                    className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_hsl(var(--primary)/0.2)] transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {completeWorkoutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.workout.completeWorkout}
                  </button>
                )}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Workout;
