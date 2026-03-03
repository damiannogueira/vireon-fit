import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Dumbbell, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Constants } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type MuscleGroup = Database["public"]["Enums"]["muscle_group"];

const MUSCLE_GROUPS = Constants.public.Enums.muscle_group;

const TRAINING_TYPES: Record<string, { label_es: string; label_en: string; groups: MuscleGroup[] }> = {
  push: { label_es: "Push", label_en: "Push", groups: ["chest", "shoulders", "triceps"] },
  pull: { label_es: "Pull", label_en: "Pull", groups: ["back", "biceps"] },
  legs: { label_es: "Piernas", label_en: "Legs", groups: ["legs"] },
  core: { label_es: "Core", label_en: "Core", groups: ["core"] },
  cardio: { label_es: "Cardio", label_en: "Cardio", groups: ["cardio"] },
  full_body: { label_es: "Full Body", label_en: "Full Body", groups: ["full_body"] },
};

const MUSCLE_LABELS: Record<MuscleGroup, { es: string; en: string }> = {
  chest: { es: "Pecho", en: "Chest" },
  back: { es: "Espalda", en: "Back" },
  shoulders: { es: "Hombros", en: "Shoulders" },
  biceps: { es: "Bíceps", en: "Biceps" },
  triceps: { es: "Tríceps", en: "Triceps" },
  legs: { es: "Piernas", en: "Legs" },
  core: { es: "Core", en: "Core" },
  cardio: { es: "Cardio", en: "Cardio" },
  full_body: { es: "Full Body", en: "Full Body" },
};

interface ExerciseManagerProps {
  gymId: string;
}

export const ExerciseManager = ({ gymId }: ExerciseManagerProps) => {
  const { user } = useAuth();
  const { locale } = useI18n();
  const queryClient = useQueryClient();
  const t = (es: string, en: string) => locale === "es" ? es : en;

  const [search, setSearch] = useState("");
  const [filterMuscle, setFilterMuscle] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", muscle_group: "chest" as MuscleGroup });

  const { data: exercises, isLoading } = useQuery({
    queryKey: ["gym-exercises", gymId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .or(`is_global.eq.true,gym_id.eq.${gymId}`)
        .order("muscle_group")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!gymId,
  });

  const filtered = exercises?.filter(ex => {
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
    const activeGroups = filterType !== "all"
      ? TRAINING_TYPES[filterType]?.groups || []
      : filterMuscle !== "all" ? [filterMuscle as MuscleGroup] : null;
    if (activeGroups && !activeGroups.includes(ex.muscle_group as MuscleGroup)) return false;
    return true;
  }) || [];

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", description: "", muscle_group: "chest" });
    setDialogOpen(true);
  };

  const openEdit = (ex: any) => {
    setEditingId(ex.id);
    setForm({ name: ex.name, description: ex.description || "", muscle_group: ex.muscle_group });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(t("El nombre es obligatorio", "Name is required")); return; }
    try {
      if (editingId) {
        const { error } = await supabase.from("exercises").update({
          name: form.name.trim(),
          description: form.description.trim() || null,
          muscle_group: form.muscle_group,
        }).eq("id", editingId);
        if (error) throw error;
        toast.success(t("Ejercicio actualizado", "Exercise updated"));
      } else {
        const { error } = await supabase.from("exercises").insert({
          name: form.name.trim(),
          description: form.description.trim() || null,
          muscle_group: form.muscle_group,
          gym_id: gymId,
          is_global: false,
        });
        if (error) throw error;
        toast.success(t("Ejercicio creado", "Exercise created"));
      }
      queryClient.invalidateQueries({ queryKey: ["gym-exercises"] });
      queryClient.invalidateQueries({ queryKey: ["available-exercises"] });
      setDialogOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("exercises").delete().eq("id", id);
      if (error) throw error;
      toast.success(t("Ejercicio eliminado", "Exercise deleted"));
      queryClient.invalidateQueries({ queryKey: ["gym-exercises"] });
      queryClient.invalidateQueries({ queryKey: ["available-exercises"] });
      setDeleteDialog(null);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t("Buscar ejercicio...", "Search exercise...")}
          className="pl-9"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Training type filters */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => { setFilterType("all"); setFilterMuscle("all"); }}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-colors",
            filterType === "all" && filterMuscle === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          {t("Todos", "All")}
        </button>
        {Object.entries(TRAINING_TYPES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => { setFilterType(key); setFilterMuscle("all"); }}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              filterType === key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {locale === "es" ? val.label_es : val.label_en}
          </button>
        ))}
      </div>

      {/* Muscle group filters (only when no training type selected) */}
      {filterType === "all" && (
        <div className="flex gap-1.5 flex-wrap">
          {MUSCLE_GROUPS.map(mg => (
            <button
              key={mg}
              onClick={() => setFilterMuscle(filterMuscle === mg ? "all" : mg)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors",
                filterMuscle === mg ? "bg-energy/20 text-energy" : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {MUSCLE_LABELS[mg]?.[locale as "es" | "en"] || mg}
            </button>
          ))}
        </div>
      )}

      {/* Create button */}
      <button
        onClick={openCreate}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl border border-dashed border-border text-muted-foreground hover:border-energy/40 hover:text-energy transition-all"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-medium">{t("Crear ejercicio", "Create exercise")}</span>
      </button>

      {/* Exercise list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-6 text-sm text-muted-foreground">{t("Sin resultados", "No results")}</p>
      ) : (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">{filtered.length} {t("ejercicios", "exercises")}</p>
          {filtered.map(ex => {
            const isGlobal = ex.is_global;
            return (
              <div key={ex.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border/50">
                <div className="w-9 h-9 rounded-lg bg-energy/10 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-4 h-4 text-energy" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground block truncate">{ex.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {MUSCLE_LABELS[ex.muscle_group as MuscleGroup]?.[locale as "es" | "en"] || ex.muscle_group}
                    {isGlobal && ` · ${t("Global", "Global")}`}
                  </span>
                </div>
                {!isGlobal && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(ex)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteDialog(ex.id)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? t("Editar Ejercicio", "Edit Exercise") : t("Crear Ejercicio", "Create Exercise")}</DialogTitle>
            <DialogDescription>{editingId ? t("Modificá los datos del ejercicio", "Update exercise info") : t("Agregá un ejercicio personalizado a tu gimnasio", "Add a custom exercise to your gym")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("Nombre", "Name")}</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t("Ej: Press Inclinado Mancuernas", "E.g.: Incline Dumbbell Press")} />
            </div>
            <div>
              <Label>{t("Descripción (opcional)", "Description (optional)")}</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <Label>{t("Grupo muscular", "Muscle group")}</Label>
              <Select value={form.muscle_group} onValueChange={(v) => setForm(f => ({ ...f, muscle_group: v as MuscleGroup }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MUSCLE_GROUPS.map(mg => (
                    <SelectItem key={mg} value={mg}>
                      {MUSCLE_LABELS[mg]?.[locale as "es" | "en"] || mg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("Cancelar", "Cancel")}</Button>
            <Button onClick={handleSave}>{editingId ? t("Guardar", "Save") : t("Crear", "Create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("¿Eliminar ejercicio?", "Delete exercise?")}</DialogTitle>
            <DialogDescription>{t("Esta acción no se puede deshacer", "This action cannot be undone")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>{t("Cancelar", "Cancel")}</Button>
            <Button variant="destructive" onClick={() => deleteDialog && handleDelete(deleteDialog)}>{t("Eliminar", "Delete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
