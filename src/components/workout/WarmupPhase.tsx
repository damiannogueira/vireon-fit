import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Flame, Timer, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WarmupExercise {
  name: string;
  duration: string;
  description: string;
}

interface LocalizedWarmupExercise {
  es: WarmupExercise;
  en: WarmupExercise;
}

interface WarmupPhaseProps {
  muscleGroups: string[];
  onComplete: () => void;
  locale: "es" | "en";
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

export function WarmupPhase({ muscleGroups, onComplete, locale }: WarmupPhaseProps) {
  const warmupExercises = getWarmupExercises(muscleGroups).map(ex => localizeWarmup(ex, locale));
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
            <h1 className="text-xl font-display font-bold text-foreground">{locale === "es" ? "Entrada en calor" : "Warm-up"}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Timer className="w-3 h-3" /> 5-8 min · {warmupExercises.length} {locale === "es" ? "ejercicios" : "exercises"}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-5">
          {locale === "es" ? "Completá estos ejercicios de movilidad y activación antes de empezar tu rutina. Prepará tu cuerpo para evitar lesiones." : "Complete these mobility and activation exercises before starting your workout. Prepare your body to help prevent injuries."}
        </p>

        {/* Progress */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{doneCount}/{warmupExercises.length} {locale === "es" ? "completados" : "completed"}</span>
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
            {allDone ? (locale === "es" ? "¡A entrenar!" : "Start workout") : (locale === "es" ? "Saltar entrada en calor" : "Skip warm-up")}
            <ChevronRight className="w-5 h-5" />
          </button>
          {!allDone && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              {locale === "es" ? "Podés continuar, pero te recomendamos completar el calentamiento" : "You can continue, but we recommend completing the warm-up"}
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

const WARMUP_EN: Record<string, WarmupExercise> = {
  "Rotaciones de hombros": { name: "Shoulder rotations", duration: "30 sec", description: "Make wide circles forward and backward to prepare the shoulder joint." },
  "Aperturas de brazos dinámicas": { name: "Dynamic arm swings", duration: "30 sec", description: "Open and close your arms at chest height, alternating which arm crosses on top." },
  "Push-ups en pared": { name: "Wall push-ups", duration: "10 reps", description: "Perform gentle push-ups against a wall to activate your chest without heavy load." },
  "Estiramiento de pecho en marco": { name: "Doorway chest stretch", duration: "30 sec", description: "Place your forearm on a door frame and gently rotate your torso away." },
  "Cat-Cow (Gato-Vaca)": { name: "Cat-Cow", duration: "30 sec", description: "On all fours, alternate between arching and rounding your back." },
  "Rotaciones torácicas": { name: "Thoracic rotations", duration: "30 sec/side", description: "On all fours, rotate your torso while opening one arm toward the ceiling." },
  "Remo sin peso": { name: "Unweighted row", duration: "10 reps", description: "Mimic a rowing motion to activate your lats and upper back." },
  "Colgarse de barra (dead hang)": { name: "Dead hang", duration: "20 sec", description: "Hang from a bar with relaxed shoulders to gently decompress your spine." },
  "Círculos de brazos": { name: "Arm circles", duration: "30 sec", description: "Keep your arms extended and make gradually larger circles." },
  "Band pull-aparts (sin banda)": { name: "Band pull-aparts without a band", duration: "15 reps", description: "Hold your arms forward and pull your hands apart as if stretching a band." },
  "Elevaciones laterales sin peso": { name: "Unweighted lateral raises", duration: "12 reps", description: "Raise your arms out to the sides without weight to activate your shoulders." },
  "Dislocaciones de hombro": { name: "Shoulder pass-throughs", duration: "10 reps", description: "With a stick or towel, move your arms overhead and behind you using a comfortable range." },
  "Rotaciones de muñeca": { name: "Wrist rotations", duration: "20 sec", description: "Rotate your wrists in both directions to prepare the joints." },
  "Flexión-extensión de codo": { name: "Elbow flexion and extension", duration: "15 reps", description: "Fully bend and straighten your elbows without weight." },
  "Curl sin peso": { name: "Unweighted curls", duration: "12 reps", description: "Mimic a biceps curl without load and focus on the contraction." },
  "Estiramiento de antebrazo": { name: "Forearm stretch", duration: "20 sec/side", description: "Extend one arm and gently pull your fingers back with the other hand." },
  "Extensión de tríceps sin peso": { name: "Unweighted triceps extension", duration: "12 reps", description: "Mimic an overhead triceps extension without load." },
  "Push-ups de rodillas": { name: "Knee push-ups", duration: "8 reps", description: "Perform gentle push-ups from your knees to activate your triceps." },
  "Estiramiento de tríceps": { name: "Triceps stretch", duration: "20 sec/side", description: "Bring one arm behind your head and gently press the elbow down." },
  "Sentadillas sin peso": { name: "Bodyweight squats", duration: "15 reps", description: "Lower with control through a comfortable range while keeping your back neutral." },
  "Balanceo de piernas": { name: "Leg swings", duration: "10/leg", description: "Swing each leg forward and backward like a pendulum." },
  "Estocadas caminando": { name: "Walking lunges", duration: "10 reps", description: "Take long alternating steps and lower your back knee with control." },
  "Activación de glúteos (puente)": { name: "Glute bridge activation", duration: "12 reps", description: "Lie on your back and lift your hips while squeezing your glutes." },
  "Movilidad de cadera (90/90)": { name: "90/90 hip mobility", duration: "30 sec", description: "Sit with both knees bent at 90 degrees and rotate gently between sides." },
  "Plancha de 20 segundos": { name: "20-second plank", duration: "20 sec", description: "Hold a straight plank position while bracing your core." },
  "Dead bug": { name: "Dead bug", duration: "10 reps", description: "Lie on your back and alternate extending the opposite arm and leg." },
  "Bird dog": { name: "Bird dog", duration: "10 reps", description: "On all fours, extend the opposite arm and leg while maintaining balance." },
  "Rotaciones de tronco": { name: "Torso rotations", duration: "30 sec", description: "Standing tall, rotate your torso from side to side with relaxed arms." },
  "Marcha en el lugar": { name: "March in place", duration: "60 sec", description: "March in place and gradually lift your knees higher." },
  "Jumping jacks suaves": { name: "Low-impact jumping jacks", duration: "30 sec", description: "Open and close your arms and legs at a comfortable, moderate pace." },
  "Skipping bajo": { name: "Low knee raises", duration: "30 sec", description: "Alternate lifting your knees at a low intensity." },
  "Movilidad de tobillos": { name: "Ankle mobility", duration: "20 sec/side", description: "Rotate each ankle in circles to prepare the joint." },
  "Rotaciones de brazos": { name: "Arm circles", duration: "30 sec", description: "Make large circles with your arms in both directions." },
  "Estocadas con rotación": { name: "Lunges with rotation", duration: "8 reps", description: "Perform a lunge and rotate your torso toward the front leg." },
  "Rotaciones articulares": { name: "Joint rotations", duration: "30 sec", description: "Gently rotate your ankles, knees, hips, shoulders, and neck." },
};

function localizeWarmup(exercise: WarmupExercise, locale: "es" | "en"): WarmupExercise {
  if (locale === "es") return exercise;
  return WARMUP_EN[exercise.name] || {
    name: exercise.name,
    duration: exercise.duration.replace("seg", "sec"),
    description: "Move with control through a comfortable range and maintain steady breathing.",
  };
}
