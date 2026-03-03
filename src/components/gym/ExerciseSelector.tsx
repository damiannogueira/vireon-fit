import { useState, useMemo } from "react";
import { Search, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface ExerciseSelectorProps {
  exercises: { id: string; name: string; muscle_group: string }[] | undefined;
  isLoading: boolean;
  selectedIds: string[];
  onToggle: (ex: { id: string; name: string }) => void;
  locale: string;
}

export const ExerciseSelector = ({ exercises, isLoading, selectedIds, onToggle, locale }: ExerciseSelectorProps) => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterMuscle, setFilterMuscle] = useState<string>("all");
  const t = (es: string, en: string) => locale === "es" ? es : en;

  const filtered = useMemo(() => {
    if (!exercises) return [];
    return exercises.filter(ex => {
      if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
      const activeGroups = filterType !== "all"
        ? TRAINING_TYPES[filterType]?.groups || []
        : filterMuscle !== "all" ? [filterMuscle as MuscleGroup] : null;
      if (activeGroups && !activeGroups.includes(ex.muscle_group as MuscleGroup)) return false;
      return true;
    });
  }, [exercises, search, filterType, filterMuscle]);

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t("Buscar ejercicio...", "Search exercise...")}
          className="pl-8 h-9 text-sm"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Training type filters */}
      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => { setFilterType("all"); setFilterMuscle("all"); }}
          className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors",
            filterType === "all" && filterMuscle === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
          )}
        >{t("Todos", "All")}</button>
        {Object.entries(TRAINING_TYPES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => { setFilterType(key); setFilterMuscle("all"); }}
            className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors",
              filterType === key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            )}
          >{locale === "es" ? val.label_es : val.label_en}</button>
        ))}
      </div>

      {/* Muscle group sub-filters */}
      {filterType === "all" && (
        <div className="flex gap-1 flex-wrap">
          {MUSCLE_GROUPS.map(mg => (
            <button
              key={mg}
              onClick={() => setFilterMuscle(filterMuscle === mg ? "all" : mg)}
              className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors",
                filterMuscle === mg ? "bg-energy/20 text-energy" : "bg-secondary/60 text-muted-foreground"
              )}
            >{MUSCLE_LABELS[mg]?.[locale as "es" | "en"] || mg}</button>
          ))}
        </div>
      )}

      {/* Results count */}
      <p className="text-[10px] text-muted-foreground">{filtered.length} {t("ejercicios", "exercises")}</p>

      {/* List */}
      <ScrollArea className="h-56 max-h-[35vh] rounded-lg border border-border/50">
        <div className="p-1.5 space-y-0.5">
          {isLoading && <p className="text-xs text-muted-foreground px-2 py-2">{t("Cargando...", "Loading...")}</p>}
          {!isLoading && filtered.length === 0 && <p className="text-xs text-muted-foreground px-2 py-2">{t("Sin resultados", "No results")}</p>}
          {filtered.map(ex => {
            const isSelected = selectedIds.includes(ex.id);
            return (
              <button
                key={ex.id}
                onClick={() => onToggle(ex)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all text-sm",
                  isSelected ? "bg-primary/10 text-primary" : "hover:bg-secondary text-foreground"
                )}
              >
                <div className={cn("w-5 h-5 rounded flex items-center justify-center border shrink-0", isSelected ? "bg-primary border-primary" : "border-border")}>
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <span className="flex-1 truncate">{ex.name}</span>
                <span className="text-[10px] text-muted-foreground uppercase shrink-0">
                  {MUSCLE_LABELS[ex.muscle_group as MuscleGroup]?.[locale as "es" | "en"] || ex.muscle_group}
                </span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
