import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function useSubscription() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["user-subscription", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_subscriptions")
        .select("id, status, plan_id, subscription_plans(name, interval)")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const isPro = !!data && data.status === "active" && (data.subscription_plans as any)?.interval !== "free";

  return { isPro, subscription: data, isLoading };
}

// Free tier limits
export const FREE_LIMITS = {
  workoutsPerWeek: 3,
  maxDaysInPlan: 3,
};
