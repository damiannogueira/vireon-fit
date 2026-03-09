import { useState } from "react";
import { Target, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

const GOALS = [
  { key: "hipertrofia", icon: "💪", es: "Hipertrofia", en: "Hypertrophy" },
  { key: "fuerza", icon: "🏋️", es: "Fuerza", en: "Strength" },
  { key: "perdida_grasa", icon: "⚡", es: "Pérdida de grasa", en: "Fat Loss" },
  { key: "movilidad", icon: "🧘", es: "Movilidad", en: "Mobility" },
];

interface GoalChangerProps {
  currentGoal: string | null;
}

export function GoalChanger({ currentGoal }: GoalChangerProps) {
  const { locale } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const current = GOALS.find(g => g.key === currentGoal);
  const label = current
    ? `${current.icon} ${current[locale as "es" | "en"]}`
    : locale === "es" ? "🎯 Sin objetivo" : "🎯 No goal set";

  const handleSelect = async (goalKey: string) => {
    if (goalKey === currentGoal || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("onboarding_progress")
        .update({ fitness_goal: goalKey, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["dashboard-onboarding"] });
      await queryClient.invalidateQueries({ queryKey: ["recommended-workouts"] });
      await queryClient.invalidateQueries({ queryKey: ["profile-onboarding"] });
      await queryClient.invalidateQueries({ queryKey: ["assigned-routines-profile"] });

      toast.success(locale === "es" ? "Objetivo actualizado" : "Goal updated");
    } catch {
      toast.error(locale === "es" ? "Error al cambiar objetivo" : "Failed to change goal");
    } finally {
      setSaving(false);
      setOpen(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-card border border-border/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between"
        disabled={saving}
      >
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-primary" />
          <div className="text-left">
            <span className="text-sm font-semibold text-foreground">
              {locale === "es" ? "Objetivo actual" : "Current goal"}
            </span>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform",
          open && "rotate-180"
        )} />
      </button>

      {open && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {GOALS.map(g => (
            <button
              key={g.key}
              onClick={() => handleSelect(g.key)}
              disabled={saving}
              className={cn(
                "p-3 rounded-xl border text-left transition-all text-sm",
                g.key === currentGoal
                  ? "bg-primary/10 border-primary/30 font-semibold text-foreground"
                  : "bg-secondary/50 border-border/30 text-muted-foreground hover:border-primary/20"
              )}
            >
              <span className="text-lg">{g.icon}</span>
              <p className="mt-1 text-xs">{g[locale as "es" | "en"]}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
