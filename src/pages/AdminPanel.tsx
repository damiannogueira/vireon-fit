import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Building2, Users, UserCog, CreditCard, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

const AdminPanel = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check admin role server-side
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

  const roleLabel = (role: string) => {
    switch (role) {
      case "admin": return t.admin.superAdmin;
      case "gym_admin": return t.admin.gymAdmin;
      default: return t.admin.user;
    }
  };

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive" as const;
      case "gym_admin": return "default" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-destructive" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t.admin.title}</h1>
        </motion.div>

        {/* Stats */}
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

        {/* Tabs */}
        <Tabs defaultValue="gyms">
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="gyms" className="text-xs md:text-sm">{t.admin.gyms}</TabsTrigger>
            <TabsTrigger value="users" className="text-xs md:text-sm">{t.admin.users}</TabsTrigger>
            <TabsTrigger value="roles" className="text-xs md:text-sm">{t.admin.roles}</TabsTrigger>
            <TabsTrigger value="subscriptions" className="text-xs md:text-sm">{t.admin.subscriptions}</TabsTrigger>
          </TabsList>

          <TabsContent value="gyms">
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.admin.gymName}</TableHead>
                    <TableHead>{t.admin.gymSlug}</TableHead>
                    <TableHead>{t.admin.gymStatus}</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gyms?.length ? gyms.map(gym => (
                    <TableRow key={gym.id}>
                      <TableCell className="font-medium">{gym.name}</TableCell>
                      <TableCell className="text-muted-foreground">{gym.slug}</TableCell>
                      <TableCell>
                        <Badge variant={gym.is_active ? "default" : "secondary"}>
                          {gym.is_active ? t.admin.active : t.admin.inactive}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{gym.id.slice(0, 8)}...</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t.admin.noData}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.admin.userName}</TableHead>
                    <TableHead>{t.admin.userLevel}</TableHead>
                    <TableHead>{t.admin.userXP}</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles?.length ? profiles.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.display_name || "—"}</TableCell>
                      <TableCell>{p.level}</TableCell>
                      <TableCell>{p.xp} XP</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{p.user_id.slice(0, 8)}...</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t.admin.noData}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="roles">
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>{t.admin.role}</TableHead>
                    <TableHead>{t.admin.userGym}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles?.length ? roles.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs font-mono text-muted-foreground">{r.user_id.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(r.role)}>
                          {roleLabel(r.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {r.gym_id ? `${r.gym_id.slice(0, 8)}...` : "—"}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">{t.admin.noData}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions">
            <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.admin.plan}</TableHead>
                    <TableHead>{t.admin.status}</TableHead>
                    <TableHead>{t.admin.startedAt}</TableHead>
                    <TableHead>{t.admin.expiresAt}</TableHead>
                    <TableHead>User ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions?.length ? subscriptions.map(sub => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        {(sub as any).subscription_plans?.name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(sub.started_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{sub.user_id.slice(0, 8)}...</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t.admin.noData}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
