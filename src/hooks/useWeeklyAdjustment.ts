import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WeeklyAdjustment {
  id: string;
  week_start: string;
  completion_rate: number;
  volume_change_pct: number;
  consistency_score: number;
  adjustment_type: "increase" | "maintain" | "decrease";
  weight_multiplier: number;
  reps_modifier: number;
  message: string;
}

export function useWeeklyAdjustment(userId: string | undefined) {
  return useQuery({
    queryKey: ["weekly-adjustment", userId],
    queryFn: async () => {
      if (!userId) return null;

      // Get the most recent adjustment
      const { data, error } = await supabase
        .from("weekly_adjustments" as any)
        .select("*")
        .eq("user_id", userId)
        .order("week_start", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching weekly adjustment:", error);
        return null;
      }

      return data as unknown as WeeklyAdjustment | null;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 min
  });
}
