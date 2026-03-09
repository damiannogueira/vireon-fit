import { motion } from "framer-motion";
import { Play, Flame } from "lucide-react";

const MOTIVATIONAL_MESSAGES = [
  "¡Es tu momento! 🔥",
  "¡Dale con todo! 💪",
  "¡Sin excusas! ⚡",
  "¡Vos podés! 🚀",
  "¡A romperla! 🏆",
  "¡Cada rep cuenta! 💥",
];

interface ExerciseStartPromptProps {
  exerciseName: string;
  exerciseNumber: number;
  totalExercises: number;
  onStart: () => void;
}

export const ExerciseStartPrompt = ({
  exerciseName,
  exerciseNumber,
  totalExercises,
  onStart,
}: ExerciseStartPromptProps) => {
  const message = MOTIVATIONAL_MESSAGES[(exerciseNumber - 1) % MOTIVATIONAL_MESSAGES.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center gap-5"
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Flame className="w-8 h-8 text-primary" />
      </div>

      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
          Ejercicio {exerciseNumber} de {totalExercises}
        </p>
        <h3 className="text-2xl font-display font-bold text-foreground">
          {exerciseName}
        </h3>
      </div>

      <p className="text-lg font-semibold text-primary">{message}</p>

      <button
        onClick={onStart}
        className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-[0_0_24px_hsl(var(--primary)/0.3)] transition-all active:scale-[0.97] hover:shadow-[0_0_32px_hsl(var(--primary)/0.4)]"
      >
        <Play className="w-5 h-5" />
        Comenzar
      </button>
    </motion.div>
  );
};
