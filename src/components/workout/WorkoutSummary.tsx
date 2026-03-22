import { motion } from "framer-motion";
import { Trophy, TrendingUp, Flame, Dumbbell, Clock, Zap, ChevronRight, ArrowUp, Minus as MinusIcon, Equal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProgressionSuggestion } from "@/hooks/useProgressiveOverload";

interface ExerciseSummary {
  name: string;
  muscleGroup: string;
  setsCompleted: number;
  totalSets: number;
  avgWeight: number;
  avgReps: number;
  totalVolume: number;
  progression?: ProgressionSuggestion;
}

interface WorkoutSummaryProps {
  workoutName: string;
  xpEarned: number;
  totalSets: number;
  completedSets: number;
  durationMinutes: number;
  exercises: ExerciseSummary[];
  onClose: () => void;
}

const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chest: "Pecho", back: "Espalda", shoulders: "Hombros",
  biceps: "Bíceps", triceps: "Tríceps", legs: "Piernas",
  core: "Core", cardio: "Cardio", full_body: "Full Body",
};

export const WorkoutSummary = ({
  workoutName,
  xpEarned,
  totalSets,
  completedSets,
  durationMinutes,
  exercises,
  onClose,
}: WorkoutSummaryProps) => {
  const totalVolume = exercises.reduce((a, e) => a + e.totalVolume, 0);
  const progressionCount = exercises.filter(e => e.progression?.isProgression).length;
  const completionRate = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
    >
      <div className="min-h-screen flex flex-col px-6 py-8 max-w-lg mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4"
          >
            <Trophy className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">
            ¡Entrenamiento completado!
          </h1>
          <p className="text-sm text-muted-foreground">{workoutName}</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <StatBox
            icon={<Zap className="w-4 h-4" />}
            label="XP Ganado"
            value={`+${xpEarned}`}
            color="text-primary"
            bgColor="bg-primary/10"
          />
          <StatBox
            icon={<Clock className="w-4 h-4" />}
            label="Duración"
            value={`${durationMinutes} min`}
            color="text-blue-400"
            bgColor="bg-blue-400/10"
          />
          <StatBox
            icon={<Dumbbell className="w-4 h-4" />}
            label="Volumen Total"
            value={`${Math.round(totalVolume).toLocaleString()} kg`}
            color="text-orange-400"
            bgColor="bg-orange-400/10"
          />
          <StatBox
            icon={<Flame className="w-4 h-4" />}
            label="Completado"
            value={`${completionRate}%`}
            color="text-red-400"
            bgColor="bg-red-400/10"
          />
        </motion.div>

        {/* Progression Summary */}
        {progressionCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold text-primary">
                ¡Progresión en {progressionCount} ejercicio{progressionCount > 1 ? "s" : ""}! 🔥
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Superaste tu sesión anterior. ¡Seguí así!
            </p>
          </motion.div>
        )}

        {/* Exercise Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
            Detalle por ejercicio
          </h3>
          <div className="space-y-2">
            {exercises.map((ex, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
              >
                <ExerciseRow exercise={ex} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          onClick={onClose}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-[0_0_24px_hsl(var(--primary)/0.3)] transition-all active:scale-[0.97] hover:shadow-[0_0_32px_hsl(var(--primary)/0.4)] flex items-center justify-center gap-2"
        >
          Volver al Dashboard
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

function StatBox({ icon, label, value, color, bgColor }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-card border border-border/50">
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-2", bgColor, color)}>
        {icon}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-bold", color)}>{value}</p>
    </div>
  );
}

function ExerciseRow({ exercise }: { exercise: ExerciseSummary }) {
  const hasProgression = exercise.progression && exercise.progression.previousWeight > 0;
  const isUp = exercise.progression?.isProgression;

  const weightDiff = hasProgression
    ? exercise.avgWeight - (exercise.progression?.previousWeight || 0)
    : 0;
  const repsDiff = hasProgression
    ? exercise.avgReps - (exercise.progression?.previousReps || 0)
    : 0;

  return (
    <div className="p-3 rounded-xl bg-card border border-border/50 flex items-center gap-3">
      {/* Progression indicator */}
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
        isUp ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
      )}>
        {isUp ? <ArrowUp className="w-4 h-4" /> : <Equal className="w-4 h-4" />}
      </div>

      {/* Exercise info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{exercise.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {exercise.setsCompleted}/{exercise.totalSets} sets
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">
            {exercise.avgWeight > 0 ? `${exercise.avgWeight}kg` : "Peso corporal"}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">
            {exercise.avgReps} reps
          </span>
        </div>
      </div>

      {/* Change badges */}
      {hasProgression && (weightDiff !== 0 || repsDiff !== 0) && (
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          {weightDiff !== 0 && (
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
              weightDiff > 0 ? "bg-primary/15 text-primary" : "bg-red-400/15 text-red-400"
            )}>
              {weightDiff > 0 ? "+" : ""}{weightDiff.toFixed(1)}kg
            </span>
          )}
          {repsDiff !== 0 && (
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
              repsDiff > 0 ? "bg-primary/15 text-primary" : "bg-red-400/15 text-red-400"
            )}>
              {repsDiff > 0 ? "+" : ""}{repsDiff} reps
            </span>
          )}
        </div>
      )}
    </div>
  );
}
