import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Users, Palette, UserPlus, ClipboardList, ChevronRight, Plus, Pencil, Save, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/i18n";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const GymDashboard = () => {
  const { user } = useAuth();
  const { locale } = useI18n();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "routines">("overview");
  const [editingGym, setEditingGym] = useState(false);
  const [gymForm, setGymForm] = useState({ name: "", address: "", primary_color: "", secondary_color: "" });
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [routineDialog, setRoutineDialog] = useState(false);
  const [routineForm, setRoutineForm] = useState({ name: "", description: "", estimated_duration: 60 });

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
        .select("*, profiles:user_id(display_name, level, xp)")
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
        .select("*")
        .eq("gym_id", userGymId!)
        .order("created_at", { ascending: false });
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
    if (!userGymId || !routineForm.name) return;
    try {
      const { error } = await supabase.from("workouts").insert({
        name: routineForm.name,
        description: routineForm.description || null,
        estimated_duration: routineForm.estimated_duration,
        gym_id: userGymId,
        created_by: user!.id,
      });
      if (error) throw error;
      toast.success(locale === "es" ? "Rutina creada" : "Routine created");
      queryClient.invalidateQueries({ queryKey: ["gym-routines"] });
      setRoutineDialog(false);
      setRoutineForm({ name: "", description: "", estimated_duration: 60 });
    } catch (e: any) {
      toast.error(e.message);
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
            {routines && routines.length > 0 ? routines.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-energy/10 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-energy" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{r.name}</span>
                  <p className="text-xs text-muted-foreground">
                    {r.estimated_duration || 0} min · {r.difficulty || "beginner"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {locale === "es" ? "No hay rutinas aún" : "No routines yet"}
              </div>
            )}
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
      <Dialog open={routineDialog} onOpenChange={setRoutineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{locale === "es" ? "Crear Rutina" : "Create Routine"}</DialogTitle>
            <DialogDescription>{locale === "es" ? "Nueva plantilla de entrenamiento" : "New workout template"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{locale === "es" ? "Nombre" : "Name"}</Label>
              <Input value={routineForm.name} onChange={e => setRoutineForm(f => ({ ...f, name: e.target.value }))} placeholder={locale === "es" ? "Ej: Push/Pull/Legs" : "E.g.: Push/Pull/Legs"} />
            </div>
            <div>
              <Label>{locale === "es" ? "Descripción" : "Description"}</Label>
              <Input value={routineForm.description} onChange={e => setRoutineForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <Label>{locale === "es" ? "Duración estimada (min)" : "Estimated duration (min)"}</Label>
              <Input type="number" value={routineForm.estimated_duration} onChange={e => setRoutineForm(f => ({ ...f, estimated_duration: Number(e.target.value) }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoutineDialog(false)}>{locale === "es" ? "Cancelar" : "Cancel"}</Button>
            <Button onClick={handleCreateRoutine} disabled={!routineForm.name}>{locale === "es" ? "Crear" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default GymDashboard;
