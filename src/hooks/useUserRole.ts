import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export type UserRoleInfo = {
  role: "admin" | "gym_admin" | "user";
  gymId: string | null;
  isGymAdmin: boolean;
  isIndividual: boolean; // user without gym
  isLoading: boolean;
};

export function useUserRole(): UserRoleInfo {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["user-role-info", user?.id],
    queryFn: async () => {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role, gym_id")
        .eq("user_id", user!.id)
        .order("role");

      const roles = roleData || [];
      const gymAdminRole = roles.find(r => r.role === "gym_admin");
      const adminRole = roles.find(r => r.role === "admin");

      // Also check profile gym_id for regular users
      const { data: profile } = await supabase
        .from("profiles")
        .select("gym_id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (adminRole) return { role: "admin" as const, gymId: adminRole.gym_id };
      if (gymAdminRole) return { role: "gym_admin" as const, gymId: gymAdminRole.gym_id };
      return { role: "user" as const, gymId: profile?.gym_id || null };
    },
    enabled: !!user,
  });

  const role = data?.role || "user";
  const gymId = data?.gymId || null;

  return {
    role,
    gymId,
    isGymAdmin: role === "gym_admin" || role === "admin",
    isIndividual: role === "user" && !gymId,
    isLoading,
  };
}
