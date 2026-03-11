import { motion, AnimatePresence } from "framer-motion";
import { Clock, Zap, Dumbbell, ChevronDown, Calendar, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/i18n";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ExerciseLog {
  exercise_name: string;
  sets_completed: number;
  reps_per_set: number[];
  weight_per_set: number[];
}

function WorkoutDetailPanel({ logId }: { logId: string }) {
  const { locale } = useI18n();

  const { data: exerciseLogs, isLoading } = useQuery({
    queryKey: ["workout-exercise-logs", logId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_exercise_logs")
        .select("exercise_name, sets_completed, reps_per_set, weight_per_set")
        .eq("workout_log_id", logId)
        .order("created_at");
      if (error) throw error;
      return (data || []) as ExerciseLog[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-3">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!exerciseLogs || exerciseLogs.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground text-center py-2">
        {locale === "es" ? "Sin detalle de ejercicios" : "No exercise details"}
      </p>
    );
  }

  return (
    <div className="space-y-2 pt-1">
      {exerciseLogs.map((ex, i) => (
        <div key={i} className="p-2.5 rounded-xl bg-secondary/50 border border-border/30">
          <h5 className="text-xs font-semibold text-foreground mb-1.5">{ex.exercise_name}</h5>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: ex.sets_completed }).map((_, si) => (
              <span
                key={si}
                className="text-[10px] text-muted-foreground bg-background/80 px-2 py-0.5 rounded-md border border-border/30"
              >
                {ex.weight_per_set[si] || 0} kg × {ex.reps_per_set[si] || 0}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function WorkoutHistory() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["workout-history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_logs")
        .select("id, started_at, completed_at, duration_minutes, xp_earned, workout_id, workouts(name)")
        .eq("user_id", user!.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  if (isLoading || !logs || logs.length === 0) return null;

  const visible = expanded ? logs : logs.slice(0, 3);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === "es" ? "es-AR" : "en-US", {
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(locale === "es" ? "es-AR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-foreground">
          {locale === "es" ? "Historial de entrenos" : "Workout History"}
        </h2>
        <span className="text-xs text-muted-foreground">
          {logs.length} {locale === "es" ? "registros" : "entries"}
        </span>
      </div>

      <div className="space-y-2">
        {visible.map((log, i) => {
          const workoutName = (log.workouts as any)?.name || (locale === "es" ? "Entrenamiento" : "Workout");
          const isOpen = expandedLogId === log.id;
          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-2xl bg-card border border-border/50 overflow-hidden"
            >
              <button
                onClick={() => setExpandedLogId(isOpen ? null : log.id)}
                className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-secondary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground truncate">{workoutName}</h4>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Calendar className="w-3 h-3" />
                      {formatDate(log.completed_at!)}
                    </span>
                    {log.duration_minutes && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {log.duration_minutes} min
                      </span>
                    )}
                    {(log.xp_earned || 0) > 0 && (
                      <span className="text-[10px] font-semibold text-xp flex items-center gap-0.5">
                        <Zap className="w-3 h-3" />
                        +{log.xp_earned} XP
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-[10px] text-muted-foreground">
                    {formatTime(log.completed_at!)}
                  </span>
                  <ChevronRight className={cn(
                    "w-3.5 h-3.5 text-muted-foreground transition-transform",
                    isOpen && "rotate-90"
                  )} />
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3.5 pb-3.5 border-t border-border/30 pt-2">
                      <WorkoutDetailPanel logId={log.id} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {logs.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 py-2 text-xs font-semibold text-primary hover:underline"
        >
          {expanded
            ? (locale === "es" ? "Ver menos" : "Show less")
            : (locale === "es" ? `Ver todos (${logs.length})` : `Show all (${logs.length})`)}
          <ChevronDown className={cn("w-3 h-3 transition-transform", expanded && "rotate-180")} />
        </button>
      )}
    </div>
  );
}
