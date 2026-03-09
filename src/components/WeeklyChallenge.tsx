import { useMemo } from "react";
import { XPBar } from "@/components/XPBar";
import { useI18n } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface WeeklyChallengeProps {
  goalKey: string;
  thisWeekWorkouts: number;
}

type Challenge = {
  icon: string;
  target: number;
  xpReward: number;
  title: Record<string, string>;
  desc: Record<string, string>;
};

const CHALLENGES_BY_GOAL: Record<string, Challenge[]> = {
  hipertrofia: [
    { icon: "💪", target: 4, xpReward: 400, title: { es: "Semana de Volumen", en: "Volume Week" }, desc: { es: "Completá 4 entrenos de hipertrofia", en: "Complete 4 hypertrophy workouts" } },
    { icon: "🔥", target: 5, xpReward: 600, title: { es: "Bestia Muscular", en: "Muscle Beast" }, desc: { es: "5 sesiones para máximo crecimiento", en: "5 sessions for max growth" } },
    { icon: "🎯", target: 3, xpReward: 300, title: { es: "Triple Impacto", en: "Triple Impact" }, desc: { es: "3 entrenos intensos esta semana", en: "3 intense workouts this week" } },
  ],
  fuerza: [
    { icon: "🏋️", target: 4, xpReward: 450, title: { es: "Semana de Fuerza", en: "Strength Week" }, desc: { es: "4 sesiones de fuerza pura", en: "4 pure strength sessions" } },
    { icon: "⚡", target: 3, xpReward: 350, title: { es: "Potencia Total", en: "Total Power" }, desc: { es: "3 entrenos pesados esta semana", en: "3 heavy workouts this week" } },
    { icon: "🦾", target: 5, xpReward: 650, title: { es: "Imparable", en: "Unstoppable" }, desc: { es: "5 días levantando hierro", en: "5 days lifting iron" } },
  ],
  perdida_grasa: [
    { icon: "⚡", target: 5, xpReward: 500, title: { es: "Semana Quema-Grasa", en: "Fat Burn Week" }, desc: { es: "5 sesiones de alto gasto calórico", en: "5 high calorie burn sessions" } },
    { icon: "🔥", target: 4, xpReward: 400, title: { es: "Metabolismo Activo", en: "Active Metabolism" }, desc: { es: "4 entrenos para acelerar tu metabolismo", en: "4 workouts to boost metabolism" } },
    { icon: "💨", target: 6, xpReward: 700, title: { es: "Inferno", en: "Inferno" }, desc: { es: "6 sesiones intensas ¡sin excusas!", en: "6 intense sessions, no excuses!" } },
  ],
  movilidad: [
    { icon: "🧘", target: 4, xpReward: 350, title: { es: "Flexibilidad Total", en: "Total Flexibility" }, desc: { es: "4 sesiones de movilidad esta semana", en: "4 mobility sessions this week" } },
    { icon: "🌊", target: 3, xpReward: 250, title: { es: "Flujo Constante", en: "Steady Flow" }, desc: { es: "3 sesiones para mejorar tu rango", en: "3 sessions to improve range" } },
    { icon: "🧘‍♂️", target: 5, xpReward: 500, title: { es: "Maestro del Movimiento", en: "Movement Master" }, desc: { es: "5 días trabajando movilidad", en: "5 days working mobility" } },
  ],
  general: [
    { icon: "🔥", target: 5, xpReward: 500, title: { es: "Semana de Fuego", en: "Fire Week" }, desc: { es: "Completá 5 entrenos esta semana", en: "Complete 5 workouts this week" } },
    { icon: "💪", target: 4, xpReward: 400, title: { es: "Constancia", en: "Consistency" }, desc: { es: "4 sesiones para mantenerte activo", en: "4 sessions to stay active" } },
    { icon: "🏆", target: 3, xpReward: 300, title: { es: "Arranque Sólido", en: "Solid Start" }, desc: { es: "3 entrenos para comenzar fuerte", en: "3 workouts to start strong" } },
  ],
};

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return monday.toISOString().slice(0, 10);
}

export function WeeklyChallenge({ goalKey, thisWeekWorkouts }: WeeklyChallengeProps) {
  const { locale } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const weekStart = getWeekStart();

  const challenge = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    const pool = CHALLENGES_BY_GOAL[goalKey] || CHALLENGES_BY_GOAL.general;
    return pool[weekNum % pool.length];
  }, [goalKey]);

  // Check if already claimed this week
  const { data: alreadyClaimed } = useQuery({
    queryKey: ["weekly-challenge-claimed", user?.id, weekStart],
    queryFn: async () => {
      const { data } = await supabase
        .from("weekly_challenge_completions")
        .select("id")
        .eq("user_id", user!.id)
        .eq("week_start", weekStart)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Insert completion record
      const { error: insertErr } = await supabase
        .from("weekly_challenge_completions")
        .insert({
          user_id: user.id,
          week_start: weekStart,
          goal_key: goalKey,
          xp_awarded: challenge.xpReward,
        });
      if (insertErr) throw insertErr;

      // Award XP to profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("xp, level")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        const newXp = (profile.xp || 0) + challenge.xpReward;
        const newLevel = Math.floor(newXp / 500) + 1;
        await supabase
          .from("profiles")
          .update({ xp: newXp, level: newLevel })
          .eq("user_id", user.id);
      }

      return challenge.xpReward;
    },
    onSuccess: (xp) => {
      queryClient.invalidateQueries({ queryKey: ["weekly-challenge-claimed"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile-page"] });
      toast.success(`🎉 +${xp} XP ${locale === "es" ? "de bonificación semanal!" : "weekly bonus!"}`);
    },
    onError: () => {
      toast.error(locale === "es" ? "Error al reclamar recompensa" : "Failed to claim reward");
    },
  });

  const progress = Math.min(thisWeekWorkouts, challenge.target);
  const completed = progress >= challenge.target;

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-achievement/10 to-transparent border border-achievement/20">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{challenge.icon}</span>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{challenge.title[locale]}</h3>
          <p className="text-xs text-muted-foreground">{challenge.desc[locale]}</p>
        </div>
        {completed && alreadyClaimed && <span className="text-lg">✅</span>}
      </div>
      <XPBar
        current={progress}
        max={challenge.target}
        variant="achievement"
        size="sm"
        label={locale === "es" ? "Progreso" : "Progress"}
      />
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-achievement font-semibold">
          +{challenge.xpReward} XP {locale === "es" ? "de bonificación" : "bonus"}
        </p>
        {completed && !alreadyClaimed && (
          <button
            onClick={() => claimMutation.mutate()}
            disabled={claimMutation.isPending}
            className="px-4 py-1.5 rounded-xl bg-achievement text-accent-foreground text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 animate-pulse"
          >
            {claimMutation.isPending
              ? "..."
              : locale === "es" ? "🎁 Reclamar XP" : "🎁 Claim XP"}
          </button>
        )}
      </div>
    </div>
  );
}
