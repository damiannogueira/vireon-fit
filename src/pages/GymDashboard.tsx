import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Users, Palette, UserPlus, ClipboardList, ChevronRight, Plus, Pencil, Save, X, Play, Check, Dumbbell, UserCheck } from "lucide-react";
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

const GymDashboard = () => {
  const { user } = useAuth();
  const { locale } = useI18n();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "routines" | "exercises">("overview");
  const [editingGym, setEditingGym] = useState(false);
  const [gymForm, setGymForm] = useState({ name: "", address: "", primary_color: "", secondary_color: "" });
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [routineDialog, setRoutineDialog] = useState(false);
  const [routineForm, setRoutineForm] = useState({ name: "", description: "", estimated_duration: 60 });
  const [selectedExercises, setSelectedExercises] = useState<{ id: string; name: string; sets: number; reps: number; rest: number }[]>([]);
  const [assignDialog, setAssignDialog] = useState<{ workoutId: string; workoutName: string } | null>(null);
  const [assignSelectedMembers, setAssignSelectedMembers] = useState<string[]>([]);

  // Get user's gym - check user_roles first, then profile
  const { data: userGymId } = useQuery({
    queryKey: ["user-gym-id", user?.id],
    queryFn: async () => {
      // Check if user is gym_admin with a gym
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("gym_id")
        .eq("user_id", user!.id)
        .in("role", ["gym_admin", "admin"])
        .not("gym_id", "is", null)
        .maybeSingle();
      if (roleData?.gym_id) return roleData.gym_id;

      // Check profile gym_id
      const { data: profileData } = await supabase
        .from("profiles")
        .select("gym_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (profileData?.gym_id) return profileData.gym_id;

      // For super admins, get first gym
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

  // Fetch all available exercises
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

  const handleInviteMember = async () => {
    if (!userGymId || !inviteEmail) return;
    try {
      // Find user by display_name (since we can't query auth.users)
      // For now, we add by user_id if provided, or show instructions
      toast.info(locale === "es"
        ? "Funcionalidad de invitación por email requiere integración de emails. Por ahora, agregá miembros desde el panel admin."
        : "Email invitation requires email integration. For now, add members from the admin panel.");
      setInviteDialog(false);
      setInviteEmail("");
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

      // Insert workout exercises
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

  const toggleExercise = (ex: { id: string; name: string }) => {
    setSelectedExercises(prev => {
      const exists = prev.find(e => e.id === ex.id);
      if (exists) return prev.filter(e => e.id !== ex.id);
      return [...prev, { id: ex.id, name: ex.name, sets: 3, reps: 10, rest: 60 }];
    });
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-8">
        {/* Gym Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: `linear-gradient(135deg, ${gym.primary_color || '#8B5CF6'}, ${gym.secondary_color || '#06B6D4'})` }}
          >
            <Building2 className="w-6 h-6 text-white" />
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
        <div className="flex gap-1 p-1 rounded-xl bg-secondary mb-6">
          {[
            { id: "overview" as const, label: locale === "es" ? "General" : "Overview" },
            { id: "members" as const, label: locale === "es" ? "Alumnos" : "Members" },
           { id: "routines" as const, label: locale === "es" ? "Rutinas" : "Routines" },
           { id: "exercises" as const, label: locale === "es" ? "Ejercicios" : "Exercises" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
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
                { icon: UserPlus, label: locale === "es" ? "Invitar alumno" : "Invite member", desc: locale === "es" ? "Agregar nuevo miembro" : "Add new member", action: () => setInviteDialog(true) },
                { icon: ClipboardList, label: locale === "es" ? "Crear rutina" : "Create routine", desc: locale === "es" ? "Nueva plantilla de entrenamiento" : "New workout template", action: () => setRoutineDialog(true) },
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
            <button
              onClick={() => setInviteDialog(true)}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border border-dashed border-border text-muted-foreground hover:border-energy/40 hover:text-energy transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">{locale === "es" ? "Invitar alumno" : "Invite member"}</span>
            </button>
            {members && members.length > 0 ? members.map((m: any) => (
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
                <span className="text-xs text-xp font-semibold">{m.is_active ? (locale === "es" ? "Activo" : "Active") : (locale === "es" ? "Inactivo" : "Inactive")}</span>
              </div>
            )) : (
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

      {/* Invite Dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{locale === "es" ? "Invitar Alumno" : "Invite Member"}</DialogTitle>
            <DialogDescription>{locale === "es" ? "Ingresá el email del alumno" : "Enter the member's email"}</DialogDescription>
          </DialogHeader>
          <div>
            <Label>Email</Label>
            <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="usuario@email.com" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialog(false)}>{locale === "es" ? "Cancelar" : "Cancel"}</Button>
            <Button onClick={handleInviteMember}>{locale === "es" ? "Invitar" : "Invite"}</Button>
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

            {/* Exercise Selection */}
            <div>
              <Label className="mb-2 block">{locale === "es" ? "Ejercicios" : "Exercises"} ({selectedExercises.length})</Label>
              
              {/* Selected exercises */}
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

              {/* Exercise selector with search and filters */}
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

      <BottomNav />
    </div>
  );
};

export default GymDashboard;
