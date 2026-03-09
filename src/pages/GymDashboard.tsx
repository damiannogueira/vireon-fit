import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Users, Palette, UserPlus, ClipboardList, ChevronRight, Plus, Pencil, Save, X, Play, Check, Dumbbell, UserCheck, CreditCard, Copy, Link, Mail, Bell, Send, Trash2, Upload, Image } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/i18n";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ExerciseManager } from "@/components/gym/ExerciseManager";
import { ExerciseSelector } from "@/components/gym/ExerciseSelector";
import { Switch } from "@/components/ui/switch";

const GymDashboard = () => {
  const { user } = useAuth();
  const { locale } = useI18n();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "routines" | "exercises" | "payments">("overview");
  const [editingGym, setEditingGym] = useState(false);
  const [gymForm, setGymForm] = useState({ name: "", address: "", primary_color: "", secondary_color: "" });
  const [inviteDialog, setInviteDialog] = useState(false);
  const [addManualDialog, setAddManualDialog] = useState(false);
  const [manualForm, setManualForm] = useState({ displayName: "", email: "" });
  const [routineDialog, setRoutineDialog] = useState(false);
  const [routineForm, setRoutineForm] = useState({ name: "", description: "", estimated_duration: 60 });
  const [selectedExercises, setSelectedExercises] = useState<{ id: string; name: string; sets: number; reps: number; rest: number }[]>([]);
  const [assignDialog, setAssignDialog] = useState<{ workoutId: string; workoutName: string } | null>(null);
  const [assignSelectedMembers, setAssignSelectedMembers] = useState<string[]>([]);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [sendingBulkReminder, setSendingBulkReminder] = useState(false);
  const [removeMemberDialog, setRemoveMemberDialog] = useState<{ id: string; userId: string; name: string } | null>(null);
  const [removingMember, setRemovingMember] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Get user's gym
  const { data: userGymId } = useQuery({
    queryKey: ["user-gym-id", user?.id],
    queryFn: async () => {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("gym_id")
        .eq("user_id", user!.id)
        .in("role", ["gym_admin", "admin"])
        .not("gym_id", "is", null)
        .maybeSingle();
      if (roleData?.gym_id) return roleData.gym_id;
      const { data: profileData } = await supabase
        .from("profiles")
        .select("gym_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (profileData?.gym_id) return profileData.gym_id;
      const { data: isAdmin } = await supabase.rpc("is_super_admin", { _user_id: user!.id });
      if (isAdmin) {
        const { data: firstGym } = await supabase.from("gyms").select("id").limit(1).maybeSingle();
        return firstGym?.id || null;
      }
      return null;
    },
    enabled: !!user,
  });

  const { data: gym, isLoading: gymLoading } = useQuery({
    queryKey: ["gym-detail", userGymId],
    queryFn: async () => {
      const { data, error } = await supabase.from("gyms").select("*").eq("id", userGymId!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userGymId,
  });

  const { data: members } = useQuery({
    queryKey: ["gym-members", userGymId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gym_members")
        .select("*, profiles!gym_members_user_id_profiles_fkey(display_name, level, xp)")
        .eq("gym_id", userGymId!)
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userGymId,
  });

  const { data: routines } = useQuery({
    queryKey: ["gym-routines", userGymId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("*, workout_exercises(id, exercise_id, sets, reps, rest_seconds, exercises(name))")
        .eq("gym_id", userGymId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userGymId,
  });

  const { data: availableExercises, isLoading: isLoadingExercises } = useQuery({
    queryKey: ["available-exercises", userGymId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name, muscle_group")
        .or(`is_global.eq.true,gym_id.eq.${userGymId}`)
        .order("muscle_group")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!userGymId,
  });

  // Payments for current month
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  const { data: payments } = useQuery({
    queryKey: ["gym-payments", userGymId, currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gym_payments")
        .select("*")
        .eq("gym_id", userGymId!)
        .eq("period_month", currentMonth);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userGymId,
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gym) return;
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${gym.id}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage.from("gym-logos").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("gym-logos").getPublicUrl(filePath);
      const logoUrl = `${publicUrl}?t=${Date.now()}`;
      await supabase.from("gyms").update({ logo_url: logoUrl }).eq("id", gym.id);
      queryClient.invalidateQueries({ queryKey: ["gym-detail"] });
      toast.success(locale === "es" ? "Logo actualizado" : "Logo updated");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveGym = async () => {
    if (!gym) return;
    try {
      const { error } = await supabase.from("gyms").update({
        name: gymForm.name,
        address: gymForm.address || null,
        primary_color: gymForm.primary_color || gym.primary_color,
        secondary_color: gymForm.secondary_color || gym.secondary_color,
      }).eq("id", gym.id);
      if (error) throw error;
      toast.success(locale === "es" ? "Gimnasio actualizado" : "Gym updated");
      queryClient.invalidateQueries({ queryKey: ["gym-detail"] });
      setEditingGym(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const inviteLink = userGymId
    ? `${window.location.origin}/auth?invite=${userGymId}`
    : "";

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success(locale === "es" ? "Link copiado al portapapeles" : "Link copied to clipboard");
  };

  const handleAddManualMember = async () => {
    if (!userGymId || !manualForm.displayName) return;
    try {
      // Use SECURITY DEFINER function to search profiles with gym_id IS NULL
      const { data: foundProfiles, error: searchError } = await supabase
        .rpc("search_unlinked_profiles", { _search: manualForm.displayName });

      if (searchError) throw searchError;

      if (foundProfiles && foundProfiles.length > 0) {
        const targetUserId = foundProfiles[0].user_id;
        // Add to gym_members
        const { error: memberError } = await supabase.from("gym_members").insert({
          gym_id: userGymId,
          user_id: targetUserId,
        });
        if (memberError) throw memberError;
        // Update profile gym_id
        await supabase.rpc("link_user_to_gym", { _user_id: targetUserId, _gym_id: userGymId });
        toast.success(locale === "es" ? `${foundProfiles[0].display_name} agregado al gimnasio` : `${foundProfiles[0].display_name} added to gym`);
        queryClient.invalidateQueries({ queryKey: ["gym-members"] });
      } else {
        toast.error(locale === "es" ? "No se encontró un usuario con ese nombre. Debe registrarse primero." : "No user found with that name. They must register first.");
      }
      setAddManualDialog(false);
      setManualForm({ displayName: "", email: "" });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCreateRoutine = async () => {
    if (!userGymId || !routineForm.name || selectedExercises.length === 0) {
      toast.error(locale === "es" ? "Agregá al menos un ejercicio" : "Add at least one exercise");
      return;
    }
    try {
      const { data: workout, error } = await supabase.from("workouts").insert({
        name: routineForm.name,
        description: routineForm.description || null,
        estimated_duration: routineForm.estimated_duration,
        gym_id: userGymId,
        created_by: user!.id,
      }).select("id").single();
      if (error) throw error;
      const exerciseInserts = selectedExercises.map((ex, i) => ({
        workout_id: workout.id,
        exercise_id: ex.id,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest,
        sort_order: i,
      }));
      const { error: exError } = await supabase.from("workout_exercises").insert(exerciseInserts);
      if (exError) throw exError;
      toast.success(locale === "es" ? `Rutina creada con ${selectedExercises.length} ejercicios` : `Routine created with ${selectedExercises.length} exercises`);
      queryClient.invalidateQueries({ queryKey: ["gym-routines"] });
      setRoutineDialog(false);
      setRoutineForm({ name: "", description: "", estimated_duration: 60 });
      setSelectedExercises([]);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAssignRoutine = async () => {
    if (!assignDialog || assignSelectedMembers.length === 0 || !userGymId) return;
    try {
      const inserts = assignSelectedMembers.map(userId => ({
        workout_id: assignDialog.workoutId,
        user_id: userId,
        gym_id: userGymId,
        assigned_by: user!.id,
      }));
      const { error } = await supabase.from("workout_assignments").upsert(inserts, { onConflict: "workout_id,user_id" });
      if (error) throw error;
      toast.success(locale === "es" ? `Rutina asignada a ${assignSelectedMembers.length} alumno(s)` : `Routine assigned to ${assignSelectedMembers.length} member(s)`);
      setAssignDialog(null);
      setAssignSelectedMembers([]);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleTogglePayment = async (memberId: string, memberUserId: string, currentlyPaid: boolean) => {
    if (!userGymId) return;
    try {
      if (currentlyPaid) {
        // Mark as unpaid
        await supabase
          .from("gym_payments")
          .update({ is_paid: false, paid_at: null, marked_by: user!.id })
          .eq("gym_id", userGymId)
          .eq("user_id", memberUserId)
          .eq("period_month", currentMonth);
      } else {
        // Upsert as paid
        await supabase.from("gym_payments").upsert({
          gym_id: userGymId,
          user_id: memberUserId,
          period_month: currentMonth,
          is_paid: true,
          paid_at: new Date().toISOString(),
          marked_by: user!.id,
          amount: 0,
        }, { onConflict: "gym_id,user_id,period_month" });
      }
      queryClient.invalidateQueries({ queryKey: ["gym-payments"] });
      toast.success(locale === "es" ? "Estado de pago actualizado" : "Payment status updated");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleExercise = (ex: { id: string; name: string }) => {
    setSelectedExercises(prev => {
      const exists = prev.find(e => e.id === ex.id);
      if (exists) return prev.filter(e => e.id !== ex.id);
      return [...prev, { id: ex.id, name: ex.name, sets: 3, reps: 10, rest: 60 }];
    });
  };

  const handleSendReminder = async (userId: string) => {
    if (!userGymId || !gym) return;
    setSendingReminder(userId);
    try {
      const { data, error } = await supabase.functions.invoke("send-payment-reminder", {
        body: { gymId: userGymId, userIds: [userId], gymName: gym.name },
      });
      if (error) throw error;
      toast.success(locale === "es" ? "Recordatorio enviado" : "Reminder sent");
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setSendingReminder(null);
    }
  };

  const handleBulkReminder = async () => {
    if (!userGymId || !gym || !members) return;
    const unpaidUserIds = members
      .filter((m: any) => !getPaymentStatus(m.user_id)?.is_paid)
      .map((m: any) => m.user_id);
    if (unpaidUserIds.length === 0) {
      toast.info(locale === "es" ? "Todos los alumnos están al día" : "All members are paid up");
      return;
    }
    setSendingBulkReminder(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-payment-reminder", {
        body: { gymId: userGymId, userIds: unpaidUserIds, gymName: gym.name },
      });
      if (error) throw error;
      toast.success(
        locale === "es"
          ? `Recordatorio enviado a ${unpaidUserIds.length} alumno(s)`
          : `Reminder sent to ${unpaidUserIds.length} member(s)`
      );
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setSendingBulkReminder(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeMemberDialog || !userGymId) return;
    setRemovingMember(true);
    try {
      // Deactivate in gym_members
      await supabase
        .from("gym_members")
        .update({ is_active: false })
        .eq("id", removeMemberDialog.id);
      // Remove gym_id from profile
      await supabase
        .from("profiles")
        .update({ gym_id: null })
        .eq("user_id", removeMemberDialog.userId);
      toast.success(
        locale === "es"
          ? `${removeMemberDialog.name} fue removido del gimnasio`
          : `${removeMemberDialog.name} was removed from the gym`
      );
      queryClient.invalidateQueries({ queryKey: ["gym-members"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRemovingMember(false);
      setRemoveMemberDialog(null);
    }
  };

  if (gymLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <BottomNav />
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-6 pt-8 flex flex-col items-center justify-center gap-4 min-h-[60vh]">
          <Building2 className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-xl font-display font-bold text-foreground">
            {locale === "es" ? "Sin gimnasio asignado" : "No gym assigned"}
          </h1>
          <p className="text-muted-foreground text-center text-sm">
            {locale === "es"
              ? "No tenés un gimnasio vinculado. Pedile al administrador que te asigne uno."
              : "You don't have a linked gym. Ask your admin to assign one."}
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const openEditGym = () => {
    setGymForm({
      name: gym.name,
      address: gym.address || "",
      primary_color: gym.primary_color || "#8B5CF6",
      secondary_color: gym.secondary_color || "#06B6D4",
    });
    setEditingGym(true);
  };

  const getPaymentStatus = (userId: string) => {
    return payments?.find(p => p.user_id === userId);
  };

  const monthLabel = new Date().toLocaleString(locale === "es" ? "es-AR" : "en-US", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-8">
        {/* Gym Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden"
            style={{ background: gym.logo_url ? 'transparent' : `linear-gradient(135deg, ${gym.primary_color || '#8B5CF6'}, ${gym.secondary_color || '#06B6D4'})` }}
          >
            {gym.logo_url ? (
              <img src={gym.logo_url} alt={gym.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold text-foreground">{gym.name}</h1>
            <p className="text-sm text-muted-foreground">{gym.address || (locale === "es" ? "Panel de administración" : "Admin panel")}</p>
          </div>
          <button onClick={openEditGym} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-secondary mb-6 overflow-x-auto">
          {[
            { id: "overview" as const, label: locale === "es" ? "General" : "Overview" },
            { id: "members" as const, label: locale === "es" ? "Alumnos" : "Members" },
            { id: "routines" as const, label: locale === "es" ? "Rutinas" : "Routines" },
            { id: "payments" as const, label: locale === "es" ? "Cuotas" : "Payments" },
            { id: "exercises" as const, label: locale === "es" ? "Ejercicios" : "Exercises" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-card border border-border/50 text-center">
                <span className="text-2xl font-bold text-foreground">{members?.length || 0}</span>
                <p className="text-[10px] text-muted-foreground uppercase">{locale === "es" ? "Alumnos" : "Members"}</p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/50 text-center">
                <span className="text-2xl font-bold text-foreground">{routines?.length || 0}</span>
                <p className="text-[10px] text-muted-foreground uppercase">{locale === "es" ? "Rutinas" : "Routines"}</p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/50 text-center">
                <span className="text-2xl font-bold text-foreground">{gym.is_active ? "✓" : "✗"}</span>
                <p className="text-[10px] text-muted-foreground uppercase">{locale === "es" ? "Estado" : "Status"}</p>
              </div>
            </div>

            {/* Branding */}
            <div className="p-4 rounded-2xl bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-energy" />
                <h3 className="font-semibold text-foreground text-sm">Branding</h3>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <span className="text-xs text-muted-foreground">{locale === "es" ? "Primario" : "Primary"}</span>
                  <div className="mt-1 h-8 rounded-lg" style={{ backgroundColor: gym.primary_color || '#8B5CF6' }} />
                </div>
                <div className="flex-1">
                  <span className="text-xs text-muted-foreground">{locale === "es" ? "Secundario" : "Secondary"}</span>
                  <div className="mt-1 h-8 rounded-lg" style={{ backgroundColor: gym.secondary_color || '#06B6D4' }} />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground text-sm">{locale === "es" ? "Acciones rápidas" : "Quick actions"}</h3>
              {[
                { icon: UserPlus, label: locale === "es" ? "Invitar alumno" : "Invite member", desc: locale === "es" ? "Link de invitación o agregar manual" : "Invite link or add manually", action: () => setInviteDialog(true) },
                { icon: ClipboardList, label: locale === "es" ? "Crear rutina" : "Create routine", desc: locale === "es" ? "Nueva plantilla de entrenamiento" : "New workout template", action: () => setRoutineDialog(true) },
                { icon: CreditCard, label: locale === "es" ? "Control de cuotas" : "Payment control", desc: locale === "es" ? "Ver estado de pagos del mes" : "View monthly payment status", action: () => setActiveTab("payments") },
                { icon: Pencil, label: locale === "es" ? "Editar gimnasio" : "Edit gym", desc: locale === "es" ? "Nombre, dirección, colores" : "Name, address, colors", action: openEditGym },
              ].map((action, i) => (
                <button key={i} onClick={action.action} className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-energy/30 transition-all text-left">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <action.icon className="w-5 h-5 text-energy" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">{action.label}</span>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "members" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setInviteDialog(true)}
                className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl border border-dashed border-border text-muted-foreground hover:border-energy/40 hover:text-energy transition-all"
              >
                <Link className="w-4 h-4" />
                <span className="text-xs font-medium">{locale === "es" ? "Invitar" : "Invite"}</span>
              </button>
              <button
                onClick={() => setAddManualDialog(true)}
                className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="text-xs font-medium">{locale === "es" ? "Agregar manual" : "Add manually"}</span>
              </button>
            </div>
            {members && members.length > 0 ? members.map((m: any) => {
              const payment = getPaymentStatus(m.user_id);
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-sm font-bold text-foreground">
                    {(m.profiles?.display_name || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">{m.profiles?.display_name || "—"}</span>
                    <p className="text-xs text-muted-foreground">
                      {locale === "es" ? "Nivel" : "Level"} {m.profiles?.level || 1} · {m.profiles?.xp || 0} XP
                    </p>
                  </div>
                   <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    payment?.is_paid ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                  )}>
                    {payment?.is_paid ? (locale === "es" ? "Al día" : "Paid") : (locale === "es" ? "Debe" : "Unpaid")}
                  </span>
                  <button
                    onClick={() => setRemoveMemberDialog({ id: m.id, userId: m.user_id, name: m.profiles?.display_name || "—" })}
                    className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors"
                    title={locale === "es" ? "Remover alumno" : "Remove member"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {locale === "es" ? "No hay alumnos aún" : "No members yet"}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "routines" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <button
              onClick={() => setRoutineDialog(true)}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border border-dashed border-border text-muted-foreground hover:border-energy/40 hover:text-energy transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">{locale === "es" ? "Crear plantilla" : "Create template"}</span>
            </button>
            {routines && routines.length > 0 ? routines.map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-energy/10 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-energy" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{r.name}</span>
                  <p className="text-xs text-muted-foreground">
                    {r.estimated_duration || 0} min · {r.workout_exercises?.length || 0} {locale === "es" ? "ejercicios" : "exercises"}
                  </p>
                </div>
                <button
                  onClick={() => { setAssignDialog({ workoutId: r.id, workoutName: r.name }); setAssignSelectedMembers([]); }}
                  className="w-9 h-9 rounded-lg bg-achievement/10 flex items-center justify-center text-achievement hover:bg-achievement/20 transition-colors"
                  title={locale === "es" ? "Asignar a alumnos" : "Assign to members"}
                >
                  <UserCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate(`/workout/${r.id}`)}
                  className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                >
                  <Play className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {locale === "es" ? "No hay rutinas aún" : "No routines yet"}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "payments" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="p-4 rounded-2xl bg-card border border-border/50">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm capitalize">{monthLabel}</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkReminder}
                  disabled={sendingBulkReminder}
                  className="text-xs gap-1.5"
                >
                  <Send className={cn("w-3.5 h-3.5", sendingBulkReminder && "animate-pulse")} />
                  {locale === "es" ? "Recordar a todos" : "Remind all"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {locale === "es" ? "Marcá el pago de cada alumno" : "Mark each member's payment"}
              </p>
            </div>

            {members && members.length > 0 ? members.map((m: any) => {
              const payment = getPaymentStatus(m.user_id);
              const isPaid = !!payment?.is_paid;
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-sm font-bold text-foreground">
                    {(m.profiles?.display_name || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">{m.profiles?.display_name || "—"}</span>
                    <p className="text-xs text-muted-foreground">
                      {isPaid
                        ? (locale === "es" ? "✓ Pagado" : "✓ Paid")
                        : (locale === "es" ? "✗ Pendiente" : "✗ Pending")}
                    </p>
                  </div>
                  {!isPaid && (
                    <button
                      onClick={() => handleSendReminder(m.user_id)}
                      disabled={sendingReminder === m.user_id}
                      className="w-8 h-8 rounded-lg bg-achievement/10 flex items-center justify-center text-achievement hover:bg-achievement/20 transition-colors disabled:opacity-50"
                      title={locale === "es" ? "Enviar recordatorio" : "Send reminder"}
                    >
                      <Bell className={cn("w-4 h-4", sendingReminder === m.user_id && "animate-pulse")} />
                    </button>
                  )}
                  <Switch
                    checked={isPaid}
                    onCheckedChange={() => handleTogglePayment(m.id, m.user_id, isPaid)}
                  />
                </div>
              );
            }) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {locale === "es" ? "No hay alumnos para mostrar" : "No members to display"}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "exercises" && userGymId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ExerciseManager gymId={userGymId} />
          </motion.div>
        )}
      </div>

      {/* Edit Gym Dialog */}
      <Dialog open={editingGym} onOpenChange={setEditingGym}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{locale === "es" ? "Editar Gimnasio" : "Edit Gym"}</DialogTitle>
            <DialogDescription>{locale === "es" ? "Modificá los datos de tu gimnasio" : "Update your gym info"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Logo upload */}
            <div>
              <Label>{locale === "es" ? "Logo del gimnasio" : "Gym logo"}</Label>
              <div className="flex items-center gap-3 mt-2">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden border border-border"
                  style={{ background: gym?.logo_url ? 'transparent' : `linear-gradient(135deg, ${gymForm.primary_color || '#8B5CF6'}, ${gymForm.secondary_color || '#06B6D4'})` }}
                >
                  {gym?.logo_url ? (
                    <img src={gym.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Image className="w-6 h-6 text-white" />
                  )}
                </div>
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-sm font-medium text-foreground cursor-pointer hover:bg-secondary/80 transition-colors">
                  <Upload className="w-4 h-4" />
                  {uploadingLogo ? (locale === "es" ? "Subiendo..." : "Uploading...") : (locale === "es" ? "Subir logo" : "Upload logo")}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                </label>
              </div>
            </div>
            <div>
              <Label>{locale === "es" ? "Nombre" : "Name"}</Label>
              <Input value={gymForm.name} onChange={e => setGymForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>{locale === "es" ? "Dirección" : "Address"}</Label>
              <Input value={gymForm.address} onChange={e => setGymForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{locale === "es" ? "Color primario" : "Primary color"}</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={gymForm.primary_color} onChange={e => setGymForm(f => ({ ...f, primary_color: e.target.value }))} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
                  <Input value={gymForm.primary_color} onChange={e => setGymForm(f => ({ ...f, primary_color: e.target.value }))} className="flex-1" />
                </div>
              </div>
              <div>
                <Label>{locale === "es" ? "Color secundario" : "Secondary color"}</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={gymForm.secondary_color} onChange={e => setGymForm(f => ({ ...f, secondary_color: e.target.value }))} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
                  <Input value={gymForm.secondary_color} onChange={e => setGymForm(f => ({ ...f, secondary_color: e.target.value }))} className="flex-1" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGym(false)}>{locale === "es" ? "Cancelar" : "Cancel"}</Button>
            <Button onClick={handleSaveGym}>{locale === "es" ? "Guardar" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog with link + manual */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{locale === "es" ? "Invitar Alumno" : "Invite Member"}</DialogTitle>
            <DialogDescription>{locale === "es" ? "Compartí el link o agregá manualmente" : "Share the link or add manually"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Invite link */}
            <div>
              <Label className="mb-2 block">{locale === "es" ? "Link de invitación" : "Invite link"}</Label>
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly className="text-xs flex-1" />
                <Button variant="outline" size="icon" onClick={handleCopyInviteLink}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {locale === "es" ? "El alumno se registra con este link y queda vinculado automáticamente." : "The member registers via this link and is auto-linked."}
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">o</span></div>
            </div>

            <Button variant="outline" className="w-full" onClick={() => { setInviteDialog(false); setAddManualDialog(true); }}>
              <UserPlus className="w-4 h-4 mr-2" />
              {locale === "es" ? "Agregar alumno manualmente" : "Add member manually"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Add Dialog */}
      <Dialog open={addManualDialog} onOpenChange={setAddManualDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{locale === "es" ? "Agregar Alumno" : "Add Member"}</DialogTitle>
            <DialogDescription>{locale === "es" ? "Buscá un usuario registrado por nombre" : "Search a registered user by name"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{locale === "es" ? "Nombre del alumno" : "Member name"}</Label>
              <Input
                value={manualForm.displayName}
                onChange={e => setManualForm(f => ({ ...f, displayName: e.target.value }))}
                placeholder={locale === "es" ? "Buscar por nombre..." : "Search by name..."}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddManualDialog(false)}>{locale === "es" ? "Cancelar" : "Cancel"}</Button>
            <Button onClick={handleAddManualMember} disabled={!manualForm.displayName}>
              {locale === "es" ? "Agregar" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Routine Dialog */}
      <Dialog open={routineDialog} onOpenChange={(open) => { setRoutineDialog(open); if (!open) setSelectedExercises([]); }}>
        <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] sm:w-full flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{locale === "es" ? "Crear Rutina" : "Create Routine"}</DialogTitle>
            <DialogDescription>{locale === "es" ? "Nueva plantilla de entrenamiento" : "New workout template"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1">
            <div>
              <Label>{locale === "es" ? "Nombre" : "Name"}</Label>
              <Input value={routineForm.name} onChange={e => setRoutineForm(f => ({ ...f, name: e.target.value }))} placeholder={locale === "es" ? "Ej: Push Day" : "E.g.: Push Day"} />
            </div>
            <div>
              <Label>{locale === "es" ? "Descripción" : "Description"}</Label>
              <Input value={routineForm.description} onChange={e => setRoutineForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <Label>{locale === "es" ? "Duración estimada (min)" : "Estimated duration (min)"}</Label>
              <Input type="number" value={routineForm.estimated_duration} onChange={e => setRoutineForm(f => ({ ...f, estimated_duration: Number(e.target.value) }))} />
            </div>
            <div>
              <Label className="mb-2 block">{locale === "es" ? "Ejercicios" : "Exercises"} ({selectedExercises.length})</Label>
              {selectedExercises.length > 0 && (
                <div className="space-y-2 mb-3">
                  {selectedExercises.map((ex, i) => (
                    <div key={ex.id} className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                      <span className="text-xs font-bold text-primary w-5">{i + 1}</span>
                      <span className="flex-1 text-sm text-foreground truncate">{ex.name}</span>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number" min="1" max="10" value={ex.sets}
                          onChange={e => setSelectedExercises(prev => prev.map(p => p.id === ex.id ? { ...p, sets: Number(e.target.value) } : p))}
                          className="w-12 h-7 text-xs text-center p-0"
                        />
                        <span className="text-[10px] text-muted-foreground">×</span>
                        <Input
                          type="number" min="1" max="100" value={ex.reps}
                          onChange={e => setSelectedExercises(prev => prev.map(p => p.id === ex.id ? { ...p, reps: Number(e.target.value) } : p))}
                          className="w-12 h-7 text-xs text-center p-0"
                        />
                      </div>
                      <button onClick={() => setSelectedExercises(prev => prev.filter(p => p.id !== ex.id))} className="text-muted-foreground hover:text-destructive">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <ExerciseSelector
                exercises={availableExercises}
                isLoading={isLoadingExercises}
                selectedIds={selectedExercises.map(e => e.id)}
                onToggle={toggleExercise}
                locale={locale}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRoutineDialog(false); setSelectedExercises([]); }}>{locale === "es" ? "Cancelar" : "Cancel"}</Button>
            <Button onClick={handleCreateRoutine} disabled={!routineForm.name || selectedExercises.length === 0}>
              {locale === "es" ? `Crear (${selectedExercises.length})` : `Create (${selectedExercises.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Routine Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={(open) => { if (!open) { setAssignDialog(null); setAssignSelectedMembers([]); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{locale === "es" ? "Asignar Rutina" : "Assign Routine"}</DialogTitle>
            <DialogDescription>
              {assignDialog?.workoutName} — {locale === "es" ? "Seleccioná los alumnos" : "Select members"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {members && members.length > 0 ? members.map((m: any) => {
              const isSelected = assignSelectedMembers.includes(m.user_id);
              return (
                <button
                  key={m.id}
                  onClick={() => setAssignSelectedMembers(prev => isSelected ? prev.filter(id => id !== m.user_id) : [...prev, m.user_id])}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                    isSelected ? "bg-primary/10 border-primary/30" : "bg-card border-border/50 hover:border-primary/20"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  )}>
                    {isSelected ? <Check className="w-4 h-4" /> : (m.profiles?.display_name || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground">{m.profiles?.display_name || "—"}</span>
                </button>
              );
            }) : (
              <p className="text-center text-muted-foreground text-sm py-4">
                {locale === "es" ? "No hay alumnos en el gimnasio" : "No members in the gym"}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssignDialog(null); setAssignSelectedMembers([]); }}>
              {locale === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button onClick={handleAssignRoutine} disabled={assignSelectedMembers.length === 0}>
              {locale === "es" ? `Asignar (${assignSelectedMembers.length})` : `Assign (${assignSelectedMembers.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <Dialog open={!!removeMemberDialog} onOpenChange={(open) => { if (!open) setRemoveMemberDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{locale === "es" ? "Remover alumno" : "Remove member"}</DialogTitle>
            <DialogDescription>
              {locale === "es"
                ? `¿Estás seguro de que querés remover a ${removeMemberDialog?.name} del gimnasio? Podrá ser re-invitado en el futuro.`
                : `Are you sure you want to remove ${removeMemberDialog?.name} from the gym? They can be re-invited later.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveMemberDialog(null)} disabled={removingMember}>
              {locale === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button variant="destructive" onClick={handleRemoveMember} disabled={removingMember}>
              {removingMember
                ? (locale === "es" ? "Removiendo..." : "Removing...")
                : (locale === "es" ? "Sí, remover" : "Yes, remove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default GymDashboard;
