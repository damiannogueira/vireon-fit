import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProgressionSuggestion {
  suggestedWeight: number;
  suggestedReps: number;
  previousWeight: number;
  previousReps: number;
  isProgression: boolean;
  message: string;
}

interface ExerciseHistory {
  exercise_name: string;
  sets_completed: number;
  reps_per_set: number[];
  weight_per_set: number[];
  created_at: string;
}

/**
 * Progressive overload rules:
 * 1. If user completed all reps at target weight → increase weight by 2.5kg (upper) or 5kg (lower)
 * 2. If user didn't complete all reps → keep same weight, try to add 1 rep per set
 * 3. If no history → use the default from workout_exercises
 * 4. Consider fitness level for increment size
 */
function calculateProgression(
  history: ExerciseHistory[],
  defaultWeight: number,
  defaultReps: number,
  muscleGroup: string,
  fitnessLevel?: string,
  weeklyMultiplier: number = 1.0,
  weeklyRepsModifier: number = 0
): ProgressionSuggestion {
  if (!history || history.length === 0) {
    return {
      suggestedWeight: defaultWeight,
      suggestedReps: defaultReps,
      previousWeight: 0,
      previousReps: 0,
      isProgression: false,
      message: "Primera vez con este ejercicio",
    };
  }

  // Get the most recent session
  const lastSession = history[0];
  const lastWeights = lastSession.weight_per_set || [];
  const lastReps = lastSession.reps_per_set || [];

  if (lastWeights.length === 0 || lastReps.length === 0) {
    return {
      suggestedWeight: defaultWeight,
      suggestedReps: defaultReps,
      previousWeight: 0,
      previousReps: 0,
      isProgression: false,
      message: "Sin datos previos suficientes",
    };
  }

  const avgWeight = lastWeights.reduce((a, b) => a + b, 0) / lastWeights.length;
  const avgReps = Math.round(lastReps.reduce((a, b) => a + b, 0) / lastReps.length);
  const allSetsCompleted = lastSession.sets_completed >= lastReps.length;
  const targetReps = defaultReps || 10;

  // Determine weight increment based on muscle group and fitness level
  const isLowerBody = ["legs", "full_body"].includes(muscleGroup);
  const isBodyweight = ["core", "cardio"].includes(muscleGroup);

  let weightIncrement: number;
  switch (fitnessLevel) {
    case "beginner":
      weightIncrement = isLowerBody ? 2.5 : 1.25;
      break;
    case "intermediate":
      weightIncrement = isLowerBody ? 5 : 2.5;
      break;
    case "advanced":
    case "elite":
      weightIncrement = isLowerBody ? 5 : 2.5;
      break;
    default:
      weightIncrement = isLowerBody ? 2.5 : 1.25;
  }

  // For bodyweight exercises, progress via reps
  if (isBodyweight || avgWeight === 0) {
    const repIncrease = allSetsCompleted && avgReps >= targetReps ? 2 : 1;
    const newReps = allSetsCompleted ? Math.min(avgReps + repIncrease, targetReps + 10) : avgReps;
    return {
      suggestedWeight: 0,
      suggestedReps: newReps,
      previousWeight: 0,
      previousReps: avgReps,
      isProgression: newReps > avgReps,
      message: newReps > avgReps
        ? `+${newReps - avgReps} reps vs sesión anterior 💪`
        : "Mantené las reps, buen trabajo",
    };
  }

  // Check if user hit all target reps across all sets
  const allRepsHit = lastReps.every(r => r >= targetReps);

  if (allSetsCompleted && allRepsHit) {
    // User completed all sets at target reps → increase weight
    const baseNewWeight = roundToNearest(avgWeight + weightIncrement, weightIncrement);
    const adjustedWeight = roundToNearest(baseNewWeight * weeklyMultiplier, weightIncrement);
    return {
      suggestedWeight: adjustedWeight,
      suggestedReps: Math.max(1, targetReps + weeklyRepsModifier),
      previousWeight: avgWeight,
      previousReps: avgReps,
      isProgression: true,
      message: `+${weightIncrement}kg vs sesión anterior 🔥`,
    };
  } else if (allSetsCompleted && !allRepsHit) {
    // Completed all sets but didn't hit target reps → keep weight, try more reps
    const adjustedWeight = roundToNearest(avgWeight * weeklyMultiplier, 1.25);
    const newReps = Math.max(1, Math.min(avgReps + 1 + weeklyRepsModifier, targetReps));
    return {
      suggestedWeight: adjustedWeight,
      suggestedReps: newReps,
      previousWeight: avgWeight,
      previousReps: avgReps,
      isProgression: newReps > avgReps,
      message: newReps > avgReps
        ? `Mismo peso, +1 rep por serie ⬆️`
        : `Mantené peso y reps, consolidá 💪`,
    };
  } else {
    // Didn't complete all sets → apply weekly adjustment (may reduce)
    const adjustedWeight = roundToNearest(avgWeight * weeklyMultiplier, 1.25);
    return {
      suggestedWeight: adjustedWeight,
      suggestedReps: Math.max(1, avgReps + weeklyRepsModifier),
      previousWeight: avgWeight,
      previousReps: avgReps,
      isProgression: false,
      message: "Repetí la sesión anterior, vas bien 👊",
    };
  }
}

function roundToNearest(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

export function useProgressiveOverload(
  userId: string | undefined,
  exerciseNames: string[],
  fitnessLevel?: string
) {
  return useQuery({
    queryKey: ["progressive-overload", userId, exerciseNames.join(",")],
    queryFn: async () => {
      if (!userId || exerciseNames.length === 0) return {};

      // Get the last 3 sessions for each exercise name
      const { data, error } = await supabase
        .from("workout_exercise_logs")
        .select("exercise_name, sets_completed, reps_per_set, weight_per_set, created_at, workout_log_id")
        .in("exercise_name", exerciseNames)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching exercise history:", error);
        return {};
      }

      // Filter to only this user's logs by joining with workout_logs
      const logIds = [...new Set((data || []).map(d => d.workout_log_id))];
      
      if (logIds.length === 0) return {};

      const { data: userLogs } = await supabase
        .from("workout_logs")
        .select("id")
        .eq("user_id", userId)
        .in("id", logIds.slice(0, 50));

      const userLogIds = new Set((userLogs || []).map(l => l.id));

      // Group by exercise name, most recent first
      const historyMap: Record<string, ExerciseHistory[]> = {};
      for (const row of (data || [])) {
        if (!userLogIds.has(row.workout_log_id)) continue;
        if (!historyMap[row.exercise_name]) {
          historyMap[row.exercise_name] = [];
        }
        if (historyMap[row.exercise_name].length < 3) {
          historyMap[row.exercise_name].push(row as ExerciseHistory);
        }
      }

      return historyMap;
    },
    enabled: !!userId && exerciseNames.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export { calculateProgression };
export type { ProgressionSuggestion, ExerciseHistory };
