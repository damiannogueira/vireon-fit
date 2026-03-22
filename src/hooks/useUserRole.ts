import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export type UserRoleInfo = {
  role: "admin" | "user";
  isAdmin: boolean;
  isLoading: boolean;
};

export function useUserRole(): UserRoleInfo {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["user-role-info", user?.id],
    queryFn: async () => {
      const { data: isAdmin } = await supabase.rpc("is_super_admin", { _user_id: user!.id });
      return { role: isAdmin ? "admin" as const : "user" as const };
    },
    enabled: !!user,
  });

  const role = data?.role || "user";

  return {
    role,
    isAdmin: role === "admin",
    isLoading,
  };
}
