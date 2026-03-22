import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Flame, Timer, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WarmupExercise {
  name: string;
  duration: string;
  description: string;
}

interface WarmupPhaseProps {
  muscleGroups: string[];
  onComplete: () => void;
}

const WARMUP_BY_MUSCLE: Record<string, WarmupExercise[]> = {
  chest: [
    { name: "Rotaciones de hombros", duration: "30 seg", description: "Círculos amplios hacia adelante y atrás para activar la articulación del hombro." },
    { name: "Aperturas de brazos dinámicas", duration: "30 seg", description: "Abrí y cerrá los brazos a la altura del pecho alternando cruce." },
    { name: "Push-ups en pared", duration: "10 reps", description: "Flexiones suaves contra la pared para activar pectorales sin carga." },
    { name: "Estiramiento de pecho en marco", duration: "30 seg", description: "Apoyá el antebrazo en un marco de puerta y girá el torso suavemente." },
  ],
  back: [
    { name: "Cat-Cow (Gato-Vaca)", duration: "30 seg", description: "En cuatro apoyos, alterná entre arquear y redondear la espalda." },
    { name: "Rotaciones torácicas", duration: "30 seg/lado", description: "En cuatro apoyos, rotá el torso abriendo el brazo hacia el techo." },
    { name: "Remo sin peso", duration: "10 reps", description: "Simulá un remo con los brazos para activar dorsales y romboides." },
    { name: "Colgarse de barra (dead hang)", duration: "20 seg", description: "Colgáte de una barra relajando los hombros para descomprimir la columna." },
  ],
  shoulders: [
    { name: "Círculos de brazos", duration: "30 seg", description: "Brazos extendidos, hacé círculos progresivamente más grandes." },
    { name: "Band pull-aparts (sin banda)", duration: "15 reps", description: "Con brazos al frente, separá las manos simulando tirar de una banda." },
    { name: "Elevaciones laterales sin peso", duration: "12 reps", description: "Subí los brazos lateralmente sin peso para activar deltoides." },
    { name: "Dislocaciones de hombro", duration: "10 reps", description: "Con un palo o toalla, pasá los brazos por encima de la cabeza y atrás." },
  ],
  biceps: [
    { name: "Rotaciones de muñeca", duration: "20 seg", description: "Girá las muñecas en ambas direcciones para preparar la articulación." },
    { name: "Flexión-extensión de codo", duration: "15 reps", description: "Doblá y extendé los codos completamente sin peso." },
    { name: "Curl sin peso", duration: "12 reps", description: "Simulá un curl de bíceps sin carga, focalizando en la contracción." },
    { name: "Estiramiento de antebrazo", duration: "20 seg/lado", description: "Extendé el brazo y tirá los dedos hacia atrás suavemente." },
  ],
  triceps: [
    { name: "Rotaciones de muñeca", duration: "20 seg", description: "Girá las muñecas para preparar las articulaciones del brazo." },
    { name: "Extensión de tríceps sin peso", duration: "12 reps", description: "Simulá una extensión de tríceps sobre la cabeza sin carga." },
    { name: "Push-ups de rodillas", duration: "8 reps", description: "Flexiones suaves desde las rodillas para activar tríceps." },
    { name: "Estiramiento de tríceps", duration: "20 seg/lado", description: "Llevá el brazo por detrás de la cabeza y presioná suavemente el codo." },
  ],
  legs: [
    { name: "Sentadillas sin peso", duration: "15 reps", description: "Bajá controladamente hasta donde puedas, mantené la espalda recta." },
    { name: "Balanceo de piernas", duration: "10/pierna", description: "Balanceá cada pierna hacia adelante y atrás como un péndulo." },
    { name: "Estocadas caminando", duration: "10 reps", description: "Dá pasos largos alternando piernas, bajando la rodilla trasera." },
    { name: "Activación de glúteos (puente)", duration: "12 reps", description: "Acostáte boca arriba, subí la cadera apretando los glúteos." },
    { name: "Movilidad de cadera (90/90)", duration: "30 seg", description: "Sentáte con las piernas en posición 90/90 y rotá suavemente." },
  ],
  core: [
    { name: "Plancha de 20 segundos", duration: "20 seg", description: "Mantené el cuerpo recto en posición de plancha activando el abdomen." },
    { name: "Dead bug", duration: "10 reps", description: "Boca arriba, extendé brazo y pierna opuestos alternadamente." },
    { name: "Bird dog", duration: "10 reps", description: "En cuatro apoyos, extendé brazo y pierna opuestos manteniendo equilibrio." },
    { name: "Rotaciones de tronco", duration: "30 seg", description: "De pie, rotá el torso de lado a lado con los brazos relajados." },
  ],
  cardio: [
    { name: "Marcha en el lugar", duration: "60 seg", description: "Caminá en el lugar elevando las rodillas progresivamente." },
    { name: "Jumping jacks suaves", duration: "30 seg", description: "Saltitos abriendo y cerrando piernas y brazos a ritmo moderado." },
    { name: "Skipping bajo", duration: "30 seg", description: "Elevá las rodillas alternadamente a baja intensidad." },
    { name: "Movilidad de tobillos", duration: "20 seg/lado", description: "Rotá cada tobillo en círculos para preparar las articulaciones." },
  ],
  full_body: [
    { name: "Marcha en el lugar", duration: "60 seg", description: "Caminá en el lugar para elevar la temperatura corporal." },
    { name: "Sentadillas sin peso", duration: "10 reps", description: "Bajá controladamente, mantené la espalda recta." },
    { name: "Rotaciones de brazos", duration: "30 seg", description: "Círculos grandes con los brazos para activar los hombros." },
    { name: "Estocadas con rotación", duration: "8 reps", description: "Hacé una estocada y rotá el torso hacia la pierna delantera." },
    { name: "Cat-Cow (Gato-Vaca)", duration: "30 seg", description: "Alterná entre arquear y redondear la espalda en cuatro apoyos." },
  ],
};

const GENERAL_WARMUP: WarmupExercise[] = [
  { name: "Marcha en el lugar", duration: "60 seg", description: "Caminá en el lugar para elevar la temperatura corporal." },
  { name: "Rotaciones articulares", duration: "30 seg", description: "Rotá tobillos, rodillas, cadera, hombros y cuello." },
  { name: "Sentadillas sin peso", duration: "10 reps", description: "Bajá controladamente activando piernas y core." },
  { name: "Rotaciones de brazos", duration: "30 seg", description: "Círculos amplios con los brazos en ambas direcciones." },
];

function getWarmupExercises(muscleGroups: string[]): WarmupExercise[] {
  const uniqueGroups = [...new Set(muscleGroups.map(g => g.toLowerCase()))];
  const seen = new Set<string>();
  const exercises: WarmupExercise[] = [];

  for (const group of uniqueGroups) {
    const groupExercises = WARMUP_BY_MUSCLE[group] || [];
    for (const ex of groupExercises) {
      if (!seen.has(ex.name)) {
        seen.add(ex.name);
        exercises.push(ex);
      }
    }
  }

  if (exercises.length === 0) {
    return GENERAL_WARMUP;
  }

  // Cap at 6 exercises max
  return exercises.slice(0, 6);
}

export function WarmupPhase({ muscleGroups, onComplete }: WarmupPhaseProps) {
  const warmupExercises = getWarmupExercises(muscleGroups);
  const [completed, setCompleted] = useState<boolean[]>(new Array(warmupExercises.length).fill(false));
  const allDone = completed.every(Boolean);
  const doneCount = completed.filter(Boolean).length;

  const toggle = (idx: number) => {
    setCompleted(prev => prev.map((v, i) => (i === idx ? !v : v)));
  };

  return (
    <div className="min-h-screen bg-background px-4 pt-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Entrada en calor</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Timer className="w-3 h-3" /> 5-8 min · {warmupExercises.length} ejercicios
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-5">
          Completá estos ejercicios de movilidad y activación antes de empezar tu rutina. Prepará tu cuerpo para evitar lesiones.
        </p>

        {/* Progress */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{doneCount}/{warmupExercises.length} completados</span>
            <span>{Math.round((doneCount / warmupExercises.length) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(doneCount / warmupExercises.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Exercise List */}
        <div className="space-y-3">
          {warmupExercises.map((ex, idx) => (
            <motion.button
              key={ex.name}
              onClick={() => toggle(idx)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "w-full text-left p-4 rounded-2xl border transition-all",
                completed[idx]
                  ? "bg-primary/10 border-primary/30"
                  : "bg-card border-border/50 hover:border-border"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all mt-0.5",
                  completed[idx]
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                )}>
                  {completed[idx] ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={cn(
                      "text-sm font-semibold",
                      completed[idx] ? "text-primary line-through" : "text-foreground"
                    )}>
                      {ex.name}
                    </h3>
                    <span className="text-xs text-muted-foreground bg-secondary/70 px-2 py-0.5 rounded-lg ml-2 flex-shrink-0">
                      {ex.duration}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {ex.description}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Continue Button */}
        <motion.div className="mt-6" layout>
          <button
            onClick={onComplete}
            className={cn(
              "w-full h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
              allDone
                ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {allDone ? "¡A entrenar!" : "Saltar entrada en calor"}
            <ChevronRight className="w-5 h-5" />
          </button>
          {!allDone && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Podés continuar, pero te recomendamos completar el calentamiento
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
