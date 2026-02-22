import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Play, Pause, SkipForward, Check, Timer, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { XPBar } from "@/components/XPBar";

interface Exercise {
  id: string;
  name: string;
  sets: SetData[];
  restSeconds: number;
  notes?: string;
}

interface SetData {
  reps: number;
  weight: number;
  completed: boolean;
}

const mockExercises: Exercise[] = [
  { id: "1", name: "Press Banca", sets: [{ reps: 10, weight: 60, completed: false }, { reps: 8, weight: 65, completed: false }, { reps: 8, weight: 65, completed: false }, { reps: 6, weight: 70, completed: false }], restSeconds: 120 },
  { id: "2", name: "Press Inclinado Mancuernas", sets: [{ reps: 12, weight: 22, completed: false }, { reps: 10, weight: 24, completed: false }, { reps: 10, weight: 24, completed: false }], restSeconds: 90 },
  { id: "3", name: "Aperturas en Polea", sets: [{ reps: 15, weight: 15, completed: false }, { reps: 12, weight: 17, completed: false }, { reps: 12, weight: 17, completed: false }], restSeconds: 60 },
  { id: "4", name: "Press Militar", sets: [{ reps: 10, weight: 40, completed: false }, { reps: 8, weight: 42, completed: false }, { reps: 8, weight: 42, completed: false }], restSeconds: 90 },
  { id: "5", name: "Elevaciones Laterales", sets: [{ reps: 15, weight: 10, completed: false }, { reps: 12, weight: 12, completed: false }, { reps: 12, weight: 12, completed: false }], restSeconds: 60 },
  { id: "6", name: "Tríceps en Polea", sets: [{ reps: 15, weight: 25, completed: false }, { reps: 12, weight: 27, completed: false }, { reps: 12, weight: 27, completed: false }], restSeconds: 60 },
];

const Workout = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>(mockExercises);
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [resting, setResting] = useState(false);
  const [restTime, setRestTime] = useState(0);

  const currentExercise = exercises[currentExIdx];
  const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0);
  const completedSets = exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0);

  const completeSet = (exIdx: number, setIdx: number) => {
    setExercises(prev => prev.map((ex, ei) =>
      ei === exIdx
        ? { ...ex, sets: ex.sets.map((s, si) => si === setIdx ? { ...s, completed: !s.completed } : s) }
        : ex
    ));
  };

  const updateSetValue = (exIdx: number, setIdx: number, field: "reps" | "weight", value: number) => {
    setExercises(prev => prev.map((ex, ei) =>
      ei === exIdx
        ? { ...ex, sets: ex.sets.map((s, si) => si === setIdx ? { ...s, [field]: value } : s) }
        : ex
    ));
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-strong px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h1 className="text-sm font-bold text-foreground">Push Day</h1>
            <p className="text-xs text-muted-foreground">Pecho, Hombros, Tríceps</p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-xs font-semibold text-primary"
          >
            Finalizar
          </button>
        </div>
        <XPBar current={completedSets} max={totalSets} variant="xp" size="sm" showValues={false} />
      </div>

      {/* Exercise Navigation */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none">
        {exercises.map((ex, i) => {
          const allDone = ex.sets.every(s => s.completed);
          return (
            <button
              key={ex.id}
              onClick={() => setCurrentExIdx(i)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                i === currentExIdx
                  ? "bg-primary text-primary-foreground"
                  : allDone
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {i + 1}. {ex.name.split(" ")[0]}
            </button>
          );
        })}
      </div>

      {/* Current Exercise */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentExIdx}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="px-4"
        >
          <div className="mb-4">
            <h2 className="text-xl font-display font-bold text-foreground">{currentExercise.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Timer className="w-3 h-3" /> {currentExercise.restSeconds}s descanso
              </span>
              <span className="text-xs text-muted-foreground">{currentExercise.sets.length} series</span>
            </div>
          </div>

          {/* Sets Table */}
          <div className="rounded-2xl overflow-hidden border border-border/50 bg-card">
            <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-0 text-xs text-muted-foreground font-medium px-4 py-2.5 bg-secondary/50">
              <span>SET</span>
              <span className="text-center">KG</span>
              <span className="text-center">REPS</span>
              <span className="text-center w-10">✓</span>
            </div>
            {currentExercise.sets.map((set, si) => (
              <div
                key={si}
                className={cn(
                  "grid grid-cols-[auto_1fr_1fr_auto] gap-0 items-center px-4 py-3 border-t border-border/30",
                  set.completed && "bg-primary/5"
                )}
              >
                <span className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold",
                  set.completed ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                )}>
                  {si + 1}
                </span>
                <div className="flex justify-center">
                  <input
                    type="number"
                    value={set.weight}
                    onChange={(e) => updateSetValue(currentExIdx, si, "weight", Number(e.target.value))}
                    className="w-16 h-9 rounded-lg bg-secondary border border-border/50 text-center text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex justify-center">
                  <input
                    type="number"
                    value={set.reps}
                    onChange={(e) => updateSetValue(currentExIdx, si, "reps", Number(e.target.value))}
                    className="w-16 h-9 rounded-lg bg-secondary border border-border/50 text-center text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => completeSet(currentExIdx, si)}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    set.completed
                      ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(142_72%_50%/0.3)]"
                      : "bg-secondary text-muted-foreground hover:bg-primary/20 hover:text-primary"
                  )}
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {currentExIdx > 0 && (
              <button
                onClick={() => setCurrentExIdx(i => i - 1)}
                className="flex-1 h-12 rounded-2xl bg-secondary text-secondary-foreground font-semibold transition-all hover:bg-secondary/80"
              >
                Anterior
              </button>
            )}
            {currentExIdx < exercises.length - 1 ? (
              <button
                onClick={() => setCurrentExIdx(i => i + 1)}
                className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_hsl(142_72%_50%/0.2)] transition-all active:scale-[0.98]"
              >
                Siguiente <SkipForward className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => navigate("/dashboard")}
                className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_hsl(142_72%_50%/0.2)] transition-all active:scale-[0.98]"
              >
                Completar Entreno 🏆
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Workout;
