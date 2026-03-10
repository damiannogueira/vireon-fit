import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export type UserRoleInfo = {
  role: "admin" | "gym_admin" | "user";
  gymId: string | null;
  gymName: string | null;
  isGymAdmin: boolean;
  isIndividual: boolean; // user without active gym membership
  isGymMember: boolean; // user WITH active gym membership
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

      // Determine active gym membership for regular users (more reliable than profiles.gym_id)
      const { data: membership } = await supabase
        .from("gym_members")
        .select("gym_id, gyms(name)")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .maybeSingle();

      const activeGymId = membership?.gym_id || null;
      const activeGymName = (membership?.gyms as any)?.name || null;

      if (adminRole) return { role: "admin" as const, gymId: adminRole.gym_id, gymName: activeGymName };
      if (gymAdminRole) {
        // Get gym name for gym admin
        const { data: adminGym } = await supabase
          .from("gyms")
          .select("name")
          .eq("id", gymAdminRole.gym_id!)
          .maybeSingle();
        return { role: "gym_admin" as const, gymId: gymAdminRole.gym_id, gymName: adminGym?.name || null };
      }

      // Regular users: only consider them "in a gym" if they have an active membership row
      return { role: "user" as const, gymId: activeGymId, gymName: activeGymName };
    },
    enabled: !!user,
  });

  const role = data?.role || "user";
  const gymId = data?.gymId || null;
  const gymName = data?.gymName || null;

  return {
    role,
    gymId,
    gymName,
    isGymAdmin: role === "gym_admin" || role === "admin",
    isIndividual: role === "user" && !gymId,
    isGymMember: role === "user" && !!gymId,
    isLoading,
  };
}
