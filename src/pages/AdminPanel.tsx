import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Building2, Users, UserCog, CreditCard, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { AdminGymsTab } from "@/components/admin/AdminGymsTab";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { AdminRolesTab } from "@/components/admin/AdminRolesTab";
import { AdminSubscriptionsTab } from "@/components/admin/AdminSubscriptionsTab";

const AdminPanel = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    const checkRole = async () => {
      const { data } = await supabase.rpc("is_super_admin", { _user_id: user.id });
      setIsAdmin(!!data);
    };
    checkRole();
  }, [user]);

  const { data: gyms } = useQuery({
    queryKey: ["admin-gyms"],
    queryFn: async () => {
      const { data } = await supabase.from("gyms").select("*").order("created_at", { ascending: false });
      return data || [];
    },
    enabled: isAdmin === true,
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      return data || [];
    },
    enabled: isAdmin === true,
  });

  const { data: roles } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("*");
      return data || [];
    },
    enabled: isAdmin === true,
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_subscriptions")
        .select("*, subscription_plans(name, price_usd)")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: isAdmin === true,
  });

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Shield className="w-16 h-16 text-destructive" />
        <h1 className="text-xl font-display font-bold text-foreground">{t.admin.accessDenied}</h1>
        <p className="text-muted-foreground">{t.admin.accessDeniedDesc}</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.admin.backToDashboard}
        </Button>
      </div>
    );
  }

  const activeSubsCount = subscriptions?.filter(s => s.status === "active").length || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-destructive" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.admin.title}</h1>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: t.admin.totalGyms, value: gyms?.length || 0, icon: Building2, color: "text-energy" },
            { label: t.admin.totalUsers, value: profiles?.length || 0, icon: Users, color: "text-primary" },
            { label: t.admin.activeSubscriptions, value: activeSubsCount, icon: CreditCard, color: "text-achievement" },
            { label: t.admin.roles, value: roles?.length || 0, icon: UserCog, color: "text-level" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl bg-card border border-border/50 text-center">
              <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <span className="text-2xl font-bold text-foreground block">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="gyms">
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="gyms" className="text-xs md:text-sm">{t.admin.gyms}</TabsTrigger>
            <TabsTrigger value="users" className="text-xs md:text-sm">{t.admin.users}</TabsTrigger>
            <TabsTrigger value="roles" className="text-xs md:text-sm">{t.admin.roles}</TabsTrigger>
            <TabsTrigger value="subscriptions" className="text-xs md:text-sm">{t.admin.subscriptions}</TabsTrigger>
          </TabsList>

          <TabsContent value="gyms">
            <AdminGymsTab gyms={gyms} />
          </TabsContent>
          <TabsContent value="users">
            <AdminUsersTab profiles={profiles} />
          </TabsContent>
          <TabsContent value="roles">
            <AdminRolesTab roles={roles} />
          </TabsContent>
          <TabsContent value="subscriptions">
            <AdminSubscriptionsTab subscriptions={subscriptions as any} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
