import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface WarmupExercise {
  name: string;
  duration_or_reps: string;
  description: string;
}

interface PlanExercise {
  exercise_name: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  weight_suggestion_kg?: number;
  intensity?: string;
  description: string;
  notes?: string;
}

interface PlanDay {
  day_number: number;
  name: string;
  description?: string;
  warmup: {
    duration_minutes: number;
    exercises: WarmupExercise[];
  };
  exercises: PlanExercise[];
}

interface GeneratedPlan {
  plan_name: string;
  plan_description: string;
  workout_ids: string[];
  days: PlanDay[];
}

export function useSmartRoutineGenerator() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);

  const generate = async () => {
    if (!user) return;
    setGenerating(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-smart-routine`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate routine");
      }

      const data: GeneratedPlan = await response.json();
      setGeneratedPlan(data);

      // Invalidate queries so dashboard picks up new workouts
      queryClient.invalidateQueries({ queryKey: ["recommended-workouts"] });
      queryClient.invalidateQueries({ queryKey: ["global-workouts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-recent-logs"] });

      return data;
    } catch (err: any) {
      console.error("Smart routine error:", err);
      toast.error(err.message || "Error generating routine");
      return null;
    } finally {
      setGenerating(false);
    }
  };

  return { generate, generating, generatedPlan };
}

export type { GeneratedPlan, PlanDay, PlanExercise, WarmupExercise };
