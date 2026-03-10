import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Building2, Users, Activity, AlertTriangle, Trophy, 
  TrendingUp, Send, Dumbbell, UserX, UserCheck, ChevronRight,
  Filter, Bell, BarChart3, Calendar, Clock, Target, RefreshCw, Download
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/i18n";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ActivityStatus = "active" | "inactive" | "at_risk";

interface MemberStats {
  user_id: string;
  display_name: string;
  level: number;
  xp: number;
  streak_days: number;
  last_workout_at: string | null;
  workout_count_week: number;
  cycle_count: number;
}

function getStatus(lastWorkoutAt: string | null): ActivityStatus {
  if (!lastWorkoutAt) return "at_risk";
  const days = Math.floor((Date.now() - new Date(lastWorkoutAt).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 7) return "active";
  if (days <= 14) return "inactive";
  return "at_risk";
}

function getDaysSince(dateStr: string | null): number {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

const statusConfig = {
  active: { label: { es: "Activo", en: "Active" }, color: "bg-primary/15 text-primary border-primary/30" },
  inactive: { label: { es: "Inactivo", en: "Inactive" }, color: "bg-achievement/15 text-achievement border-achievement/30" },
  at_risk: { label: { es: "En riesgo", en: "At Risk" }, color: "bg-destructive/15 text-destructive border-destructive/30" },
};

const GymCoachDashboard = () => {
  const { user } = useAuth();
  const { gymId, gymName, isGymAdmin } = useUserRole();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<"all" | ActivityStatus>("all");
  const [selectedMember, setSelectedMember] = useState<MemberStats | null>(null);
  const [notifyDialog, setNotifyDialog] = useState<MemberStats | null>(null);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [assignDialog, setAssignDialog] = useState<MemberStats | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>("");
  const [goalDialog, setGoalDialog] = useState<MemberStats | null>(null);
  const [newGoal, setNewGoal] = useState<string>("");
  const [resetCycleDialog, setResetCycleDialog] = useState<MemberStats | null>(null);

  // Gym info
  const { data: gym } = useQuery({
    queryKey: ["coach-gym", gymId],
    queryFn: async () => {
      const { data } = await supabase.from("gyms").select("*").eq("id", gymId!).maybeSingle();
      return data;
    },
    enabled: !!gymId,
  });

  // Member stats via RPC
  const { data: memberStats, isLoading } = useQuery({
    queryKey: ["coach-member-stats", gymId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_gym_member_stats", { _gym_id: gymId! });
      if (error) throw error;
      return (data || []) as MemberStats[];
    },
    enabled: !!gymId && isGymAdmin,
  });

  // Gym workouts for assignment
  const { data: gymWorkouts } = useQuery({
    queryKey: ["coach-gym-workouts", gymId],
    queryFn: async () => {
      const { data } = await supabase.from("workouts").select("id, name").eq("gym_id", gymId!);
      return data || [];
    },
    enabled: !!gymId,
  });

  const members = memberStats || [];

  // All member goals for table display
  const { data: allMemberGoals } = useQuery({
    queryKey: ["coach-all-member-goals", gymId, members.map(m => m.user_id).join(",")],
    queryFn: async () => {
      if (!members.length) return {};
      const { data } = await supabase
        .from("onboarding_progress")
        .select("user_id, fitness_goal")
        .in("user_id", members.map(m => m.user_id));
      const map: Record<string, string | null> = {};
      (data || []).forEach((d: any) => { map[d.user_id] = d.fitness_goal; });
      return map;
    },
    enabled: !!gymId && members.length > 0,
  });

  // Member cycles for detail panel
  const { data: memberCycles } = useQuery({
    queryKey: ["coach-member-cycles", selectedMember?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("cycle_completions")
        .select("*")
        .eq("user_id", selectedMember!.user_id)
        .order("completed_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!selectedMember,
  });

  // Member onboarding (goal) for detail panel
  const { data: memberGoal, refetch: refetchMemberGoal } = useQuery({
    queryKey: ["coach-member-goal", selectedMember?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("onboarding_progress")
        .select("fitness_goal")
        .eq("user_id", selectedMember!.user_id)
        .maybeSingle();
      return data?.fitness_goal || null;
    },
    enabled: !!selectedMember,
  });

  // Member active status for detail panel
  const { data: memberActiveStatus, refetch: refetchMemberStatus } = useQuery({
    queryKey: ["coach-member-active", selectedMember?.user_id, gymId],
    queryFn: async () => {
      const { data } = await supabase
        .from("gym_members")
        .select("is_active")
        .eq("user_id", selectedMember!.user_id)
        .eq("gym_id", gymId!)
        .maybeSingle();
      return data?.is_active ?? true;
    },
    enabled: !!selectedMember && !!gymId,
  });

  // Computed insights
  const insights = useMemo(() => {
    if (!members.length) return null;
    const active = members.filter(m => getStatus(m.last_workout_at) === "active");
    const inactive = members.filter(m => getStatus(m.last_workout_at) === "inactive");
    const atRisk = members.filter(m => getStatus(m.last_workout_at) === "at_risk");
    const totalWorkoutsWeek = members.reduce((s, m) => s + m.workout_count_week, 0);
    const totalCycles = members.reduce((s, m) => s + m.cycle_count, 0);
    const avgXp = Math.round(members.reduce((s, m) => s + m.xp, 0) / members.length);
    const mostActive = [...members].sort((a, b) => b.workout_count_week - a.workout_count_week)[0];

    return { active, inactive, atRisk, totalWorkoutsWeek, totalCycles, avgXp, mostActive };
  }, [members]);

  const filteredMembers = useMemo(() => {
    if (statusFilter === "all") return members;
    return members.filter(m => getStatus(m.last_workout_at) === statusFilter);
  }, [members, statusFilter]);

  const handleSendNotification = async (member: MemberStats, message: string) => {
    if (!gymId) return;
    setSendingNotification(true);
    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: member.user_id,
        gym_id: gymId,
        type: "coach_message",
        title: locale === "es" ? "💬 Mensaje de tu coach" : "💬 Coach Message",
        message,
      });
      if (error) throw error;
      toast.success(locale === "es" ? "Notificación enviada" : "Notification sent");
      setNotifyDialog(null);
    } catch {
      toast.error(locale === "es" ? "Error al enviar" : "Failed to send");
    } finally {
      setSendingNotification(false);
    }
  };

  const handleAssignWorkout = async () => {
    if (!assignDialog || !selectedWorkoutId || !gymId || !user) return;
    try {
      const { error } = await supabase.from("workout_assignments").upsert({
        workout_id: selectedWorkoutId,
        user_id: assignDialog.user_id,
        gym_id: gymId,
        assigned_by: user.id,
      }, { onConflict: "workout_id,user_id" });
      if (error) throw error;
      toast.success(locale === "es" ? "Rutina asignada" : "Workout assigned");
      setAssignDialog(null);
      setSelectedWorkoutId("");
    } catch {
      toast.error(locale === "es" ? "Error al asignar" : "Failed to assign");
    }
  };

  const handleToggleMember = async (memberId: string, activate: boolean) => {
    if (!gymId) return;
    try {
      const { error } = await supabase
        .from("gym_members")
        .update({ is_active: activate })
        .eq("user_id", memberId)
        .eq("gym_id", gymId);
      if (error) throw error;
      toast.success(activate 
        ? (locale === "es" ? "Miembro reactivado" : "Member reactivated")
        : (locale === "es" ? "Miembro desactivado" : "Member deactivated")
      );
    } catch {
      toast.error("Error");
    }
  };

  const handleChangeGoal = async () => {
    if (!goalDialog || !newGoal || !gymId) return;
    try {
      const { error } = await supabase
        .from("onboarding_progress")
        .update({ fitness_goal: newGoal })
        .eq("user_id", goalDialog.user_id);
      if (error) throw error;
      toast.success(locale === "es" ? "Objetivo actualizado" : "Goal updated");
      setGoalDialog(null);
      setNewGoal("");
      refetchMemberGoal();
    } catch {
      toast.error(locale === "es" ? "Error al cambiar objetivo" : "Failed to change goal");
    }
  };

  const handleResetCycle = async () => {
    if (!resetCycleDialog || !gymId) return;
    try {
      const { error } = await supabase
        .from("workout_logs")
        .delete()
        .eq("user_id", resetCycleDialog.user_id)
        .not("completed_at", "is", null);
      if (error) throw error;
      toast.success(locale === "es" ? "Ciclo reseteado" : "Cycle reset");
      setResetCycleDialog(null);
    } catch {
      toast.error(locale === "es" ? "Error al resetear" : "Failed to reset");
    }
  };

  const handleToggleMemberFromPanel = async (memberId: string, activate: boolean) => {
    await handleToggleMember(memberId, activate);
    refetchMemberStatus();
  };

  const handleBulkNotify = async (memberList: MemberStats[], message: string) => {
    if (!gymId) return;
    setSendingNotification(true);
    try {
      const inserts = memberList.map(m => ({
        user_id: m.user_id,
        gym_id: gymId,
        type: "coach_message",
        title: locale === "es" ? "💬 Mensaje de tu coach" : "💬 Coach Message",
        message,
      }));
      const { error } = await supabase.from("notifications").insert(inserts);
      if (error) throw error;
      toast.success(locale === "es" ? `Notificación enviada a ${memberList.length} alumnos` : `Notification sent to ${memberList.length} members`);
    } catch {
      toast.error(locale === "es" ? "Error al enviar" : "Failed to send");
    } finally {
      setSendingNotification(false);
    }
  };

  const handleExportCSV = () => {
    if (!members.length) return;
    const headers = ["Name", "Level", "XP", "Streak", "Workouts/Week", "Cycles", "Goal", "Status", "Last Workout"];
    const rows = members.map(m => {
      const goal = allMemberGoals?.[m.user_id] || "";
      const status = getStatus(m.last_workout_at);
      const goalLabel = goal ? (GOAL_LABELS[goal]?.[locale as "es" | "en"] || goal).replace(/[^\w\s]/g, "") : "";
      const statusLabel = statusConfig[status].label[locale as "es" | "en"];
      const lastWorkout = m.last_workout_at ? new Date(m.last_workout_at).toLocaleDateString() : "-";
      return [m.display_name, m.level, m.xp, m.streak_days, m.workout_count_week, m.cycle_count, goalLabel, statusLabel, lastWorkout].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `members-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(locale === "es" ? "CSV exportado" : "CSV exported");
  };

  const GOAL_LABELS: Record<string, Record<string, string>> = {
    hipertrofia: { es: "💪 Hipertrofia", en: "💪 Hypertrophy" },
    fuerza: { es: "🏋️ Fuerza", en: "🏋️ Strength" },
    perdida_grasa: { es: "⚡ Pérdida de grasa", en: "⚡ Fat Loss" },
    movilidad: { es: "🧘 Movilidad", en: "🧘 Mobility" },
    general: { es: "🎯 General", en: "🎯 General" },
  };

  if (!isGymAdmin || !gymId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">
            {locale === "es" ? "Acceso denegado" : "Access Denied"}
          </h1>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            {locale === "es" ? "Volver" : "Go back"}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-8">
        {/* Header */}
        <button 
          onClick={() => navigate("/gym")} 
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === "es" ? "Volver al gym" : "Back to gym"}
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden"
            style={{ background: gym?.logo_url ? 'transparent' : `linear-gradient(135deg, ${gym?.primary_color || '#8B5CF6'}, ${gym?.secondary_color || '#06B6D4'})` }}
          >
            {gym?.logo_url ? (
              <img src={gym.logo_url} alt={gym.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold text-foreground">
              {locale === "es" ? "Panel Coach" : "Coach Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground">{gymName || gym?.name}</p>
          </div>
        </div>

        {/* Section 1: Gym Insights */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { 
              label: locale === "es" ? "Activos" : "Active", 
              value: insights?.active.length || 0, 
              icon: UserCheck, 
              color: "text-primary" 
            },
            { 
              label: locale === "es" ? "Entrenos/sem" : "Workouts/wk", 
              value: insights?.totalWorkoutsWeek || 0, 
              icon: Dumbbell, 
              color: "text-energy" 
            },
            { 
              label: locale === "es" ? "Inactivos" : "Inactive", 
              value: insights?.inactive.length || 0, 
              icon: Clock, 
              color: "text-achievement" 
            },
            { 
              label: locale === "es" ? "En riesgo" : "At Risk", 
              value: insights?.atRisk.length || 0, 
              icon: AlertTriangle, 
              color: "text-destructive" 
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl bg-card border border-border/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={cn("w-4 h-4", stat.color)} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              </div>
              <span className="text-2xl font-bold text-foreground">{stat.value}</span>
            </motion.div>
          ))}
        </div>

        {/* Extra insights row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-card border border-border/50 text-center">
            <span className="text-lg font-bold text-foreground">{insights?.totalCycles || 0}</span>
            <p className="text-[10px] text-muted-foreground uppercase">{locale === "es" ? "Ciclos" : "Cycles"}</p>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border/50 text-center">
            <span className="text-lg font-bold text-foreground">{insights?.avgXp || 0}</span>
            <p className="text-[10px] text-muted-foreground uppercase">{locale === "es" ? "XP prom." : "Avg XP"}</p>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border/50 text-center">
            <span className="text-lg font-bold text-foreground">{members.length}</span>
            <p className="text-[10px] text-muted-foreground uppercase">{locale === "es" ? "Total" : "Total"}</p>
          </div>
        </div>

        {/* Section 7: Quick Insights */}
        {insights?.mostActive && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-primary/5 border border-primary/20 mb-6"
          >
            <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              {locale === "es" ? "Insights" : "Insights"}
            </h3>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>🏆 {locale === "es" ? "Más activo" : "Most active"}: <span className="text-foreground font-medium">{insights.mostActive.display_name}</span> ({insights.mostActive.workout_count_week} {locale === "es" ? "entrenos/sem" : "workouts/wk"})</p>
              {insights.atRisk.length > 0 && (
                <p>⚠️ {insights.atRisk.length} {locale === "es" ? "alumnos en riesgo de abandono" : "members at risk of dropping out"}</p>
              )}
              {insights.inactive.length > 0 && (
                <p>💤 {insights.inactive.length} {locale === "es" ? "alumnos sin actividad reciente" : "members with no recent activity"}</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Section 6: Engagement Tools */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!members.length}
            className="text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {locale === "es" ? "Exportar CSV" : "Export CSV"}
          </Button>
          {insights && insights.inactive.length + insights.atRisk.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={sendingNotification}
              onClick={() => {
                const inactive = [...(insights.inactive || []), ...(insights.atRisk || [])];
                handleBulkNotify(
                  inactive,
                  locale === "es"
                    ? "Tu coach notó que no entrenaste esta semana. ¡Volvé a la acción! 💪"
                    : "Your coach noticed you haven't trained this week. Get back in action! 💪"
                );
              }}
              className="text-xs"
            >
              <Bell className="w-3.5 h-3.5 mr-1.5" />
              {locale === "es" ? "Notificar inactivos" : "Notify inactive"}
            </Button>
          )}
        </div>

        {/* Section 5: Status Filters */}
        <div className="flex gap-1 p-1 rounded-xl bg-secondary mb-4">
          {(["all", "active", "inactive", "at_risk"] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-all",
                statusFilter === f
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "all" 
                ? (locale === "es" ? "Todos" : "All")
                : statusConfig[f].label[locale as "es" | "en"]
              }
              {f !== "all" && (
                <span className="ml-1 text-[10px]">
                  ({f === "active" ? insights?.active.length : f === "inactive" ? insights?.inactive.length : insights?.atRisk.length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Section 2: Member Monitoring Table */}
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{locale === "es" ? "Alumno" : "Member"}</TableHead>
                  <TableHead className="text-xs">{locale === "es" ? "Nivel" : "Lvl"}</TableHead>
                  <TableHead className="text-xs">XP</TableHead>
                  <TableHead className="text-xs">{locale === "es" ? "Objetivo" : "Goal"}</TableHead>
                  <TableHead className="text-xs">{locale === "es" ? "Ciclos" : "Cycles"}</TableHead>
                  <TableHead className="text-xs">{locale === "es" ? "Últ. entreno" : "Last WO"}</TableHead>
                  <TableHead className="text-xs">{locale === "es" ? "Estado" : "Status"}</TableHead>
                  <TableHead className="text-xs"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length > 0 ? filteredMembers.map(m => {
                  const status = getStatus(m.last_workout_at);
                  const days = getDaysSince(m.last_workout_at);
                  const cfg = statusConfig[status];
                  const goal = allMemberGoals?.[m.user_id];
                  return (
                    <TableRow key={m.user_id} className="cursor-pointer hover:bg-secondary/50" onClick={() => setSelectedMember(m)}>
                      <TableCell className="font-medium text-sm">{m.display_name || "—"}</TableCell>
                      <TableCell className="text-sm">{m.level}</TableCell>
                      <TableCell className="text-sm">{m.xp}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {goal ? (GOAL_LABELS[goal]?.[locale]?.split(" ")[0] || goal) : "—"}
                      </TableCell>
                      <TableCell className="text-sm">{m.cycle_count}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.last_workout_at 
                          ? (days === 0 ? (locale === "es" ? "Hoy" : "Today") : `${days}d`)
                          : "—"
                        }
                      </TableCell>
                      <TableCell>
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", cfg.color)}>
                          {cfg.label[locale as "es" | "en"]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setNotifyDialog(m); }}
                            className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                            title={locale === "es" ? "Enviar mensaje" : "Send message"}
                          >
                            <Send className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setAssignDialog(m); }}
                            className="w-7 h-7 rounded-lg bg-energy/10 flex items-center justify-center text-energy hover:bg-energy/20 transition-colors"
                            title={locale === "es" ? "Asignar rutina" : "Assign workout"}
                          >
                            <Dumbbell className="w-3 h-3" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      {locale === "es" ? "Sin alumnos" : "No members"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Section 3: Member Detail Panel */}
      <Sheet open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedMember?.display_name || "—"}</SheetTitle>
            <SheetDescription>
              {locale === "es" ? "Detalle del alumno" : "Member details"}
            </SheetDescription>
          </SheetHeader>
          {selectedMember && (
            <div className="mt-6 space-y-6">
              {/* Status badge */}
              {(() => {
                const status = getStatus(selectedMember.last_workout_at);
                const cfg = statusConfig[status];
                return (
                  <span className={cn("text-xs font-semibold px-3 py-1 rounded-full border", cfg.color)}>
                    {cfg.label[locale as "es" | "en"]}
                  </span>
                );
              })()}

              {/* Goal */}
              {memberGoal && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{locale === "es" ? "Objetivo" : "Goal"}</p>
                  <p className="text-sm font-semibold text-foreground">{GOAL_LABELS[memberGoal]?.[locale] || memberGoal}</p>
                </div>
              )}

              {/* Level & XP */}
              <div className="p-4 rounded-xl bg-secondary/50 border border-border/30">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">
                    {locale === "es" ? "Nivel" : "Level"} {selectedMember.level}
                  </span>
                  <span className="text-xs text-muted-foreground">{selectedMember.xp} XP</span>
                </div>
                <Progress value={(selectedMember.xp % 500) / 5} className="h-2" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {500 - (selectedMember.xp % 500)} XP → {locale === "es" ? "Nivel" : "Level"} {selectedMember.level + 1}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-card border border-border/30 text-center">
                  <span className="text-lg font-bold text-foreground">{selectedMember.streak_days}</span>
                  <p className="text-[10px] text-muted-foreground">{locale === "es" ? "Racha" : "Streak"}</p>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/30 text-center">
                  <span className="text-lg font-bold text-foreground">{selectedMember.workout_count_week}</span>
                  <p className="text-[10px] text-muted-foreground">{locale === "es" ? "Sem." : "Week"}</p>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/30 text-center">
                  <span className="text-lg font-bold text-foreground">{selectedMember.cycle_count}</span>
                  <p className="text-[10px] text-muted-foreground">{locale === "es" ? "Ciclos" : "Cycles"}</p>
                </div>
              </div>

              {/* Cycle History */}
              {memberCycles && memberCycles.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    {locale === "es" ? "Ciclos completados" : "Completed cycles"}
                  </h4>
                  <div className="space-y-2">
                    {memberCycles.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/30">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {GOAL_LABELS[c.goal_type]?.[locale] || c.goal_type}
                          </p>
                          <div className="flex gap-3 text-[10px] text-muted-foreground">
                            <span>{c.workouts_count} {locale === "es" ? "entrenos" : "workouts"}</span>
                            {c.xp_earned > 0 && <span>⚡ {c.xp_earned} XP</span>}
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(c.completed_at).toLocaleDateString(locale === "es" ? "es-AR" : "en-US", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: Management Actions */}
              <div className="space-y-2 pt-2 border-t border-border/30">
                <h4 className="text-sm font-semibold text-foreground">
                  {locale === "es" ? "Acciones" : "Actions"}
                </h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => { setAssignDialog(selectedMember); setSelectedMember(null); }}
                >
                  <Dumbbell className="w-4 h-4 mr-2" />
                  {locale === "es" ? "Asignar rutina" : "Assign workout"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => { setGoalDialog(selectedMember); setNewGoal(memberGoal || ""); setSelectedMember(null); }}
                >
                  <Target className="w-4 h-4 mr-2" />
                  {locale === "es" ? "Cambiar objetivo" : "Change goal"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => { setResetCycleDialog(selectedMember); setSelectedMember(null); }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {locale === "es" ? "Resetear ciclo" : "Reset cycle"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => { setNotifyDialog(selectedMember); setSelectedMember(null); }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {locale === "es" ? "Enviar mensaje" : "Send message"}
                </Button>
                <Button 
                  variant={memberActiveStatus === false ? "default" : "destructive"}
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => selectedMember && handleToggleMemberFromPanel(selectedMember.user_id, !memberActiveStatus)}
                >
                  {memberActiveStatus === false ? (
                    <><UserCheck className="w-4 h-4 mr-2" />{locale === "es" ? "Reactivar miembro" : "Reactivate member"}</>
                  ) : (
                    <><UserX className="w-4 h-4 mr-2" />{locale === "es" ? "Desactivar miembro" : "Deactivate member"}</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Notification Dialog */}
      <Dialog open={!!notifyDialog} onOpenChange={() => setNotifyDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locale === "es" ? `Mensaje para ${notifyDialog?.display_name}` : `Message for ${notifyDialog?.display_name}`}
            </DialogTitle>
            <DialogDescription>
              {locale === "es" ? "Enviá una notificación motivacional" : "Send a motivational notification"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {[
              locale === "es" 
                ? "Tu coach notó que no entrenaste esta semana. ¡Volvé a la acción! 💪"
                : "Your coach noticed you haven't trained this week. Get back in action! 💪",
              locale === "es"
                ? "¡Gran progreso! Seguí así y vas a alcanzar tus metas 🔥"
                : "Great progress! Keep it up and you'll reach your goals 🔥",
              locale === "es"
                ? "Tenés una nueva rutina asignada. ¡Mirala! 🏋️"
                : "You have a new assigned workout. Check it out! 🏋️",
            ].map((msg, i) => (
              <button
                key={i}
                disabled={sendingNotification}
                onClick={() => notifyDialog && handleSendNotification(notifyDialog, msg)}
                className="w-full text-left p-3 rounded-xl bg-secondary/50 border border-border/30 hover:border-primary/30 transition-all text-sm text-foreground disabled:opacity-50"
              >
                {msg}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Workout Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={() => { setAssignDialog(null); setSelectedWorkoutId(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locale === "es" ? `Asignar rutina a ${assignDialog?.display_name}` : `Assign workout to ${assignDialog?.display_name}`}
            </DialogTitle>
            <DialogDescription>
              {locale === "es" ? "Seleccioná una rutina del gimnasio" : "Select a gym workout"}
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedWorkoutId} onValueChange={setSelectedWorkoutId}>
            <SelectTrigger>
              <SelectValue placeholder={locale === "es" ? "Elegir rutina..." : "Choose workout..."} />
            </SelectTrigger>
            <SelectContent>
              {gymWorkouts?.map(w => (
                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(null)}>
              {locale === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button onClick={handleAssignWorkout} disabled={!selectedWorkoutId}>
              {locale === "es" ? "Asignar" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Goal Dialog */}
      <Dialog open={!!goalDialog} onOpenChange={() => { setGoalDialog(null); setNewGoal(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locale === "es" ? `Cambiar objetivo de ${goalDialog?.display_name}` : `Change goal for ${goalDialog?.display_name}`}
            </DialogTitle>
            <DialogDescription>
              {locale === "es" ? "Seleccioná el nuevo objetivo fitness" : "Select the new fitness goal"}
            </DialogDescription>
          </DialogHeader>
          <Select value={newGoal} onValueChange={setNewGoal}>
            <SelectTrigger>
              <SelectValue placeholder={locale === "es" ? "Elegir objetivo..." : "Choose goal..."} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(GOAL_LABELS).map(([key, labels]) => (
                <SelectItem key={key} value={key}>{labels[locale] || labels.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalDialog(null)}>
              {locale === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button onClick={handleChangeGoal} disabled={!newGoal}>
              {locale === "es" ? "Guardar" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Cycle Confirmation Dialog */}
      <Dialog open={!!resetCycleDialog} onOpenChange={() => setResetCycleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locale === "es" ? "Resetear ciclo" : "Reset cycle"}
            </DialogTitle>
            <DialogDescription>
              {locale === "es" 
                ? `¿Estás seguro de resetear el ciclo de ${resetCycleDialog?.display_name}? Esto eliminará los workout logs completados.`
                : `Are you sure you want to reset ${resetCycleDialog?.display_name}'s cycle? This will delete completed workout logs.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetCycleDialog(null)}>
              {locale === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button variant="destructive" onClick={handleResetCycle}>
              {locale === "es" ? "Resetear" : "Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default GymCoachDashboard;
