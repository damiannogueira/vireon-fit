import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Target, Zap, Calendar, Clock, Dumbbell, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Goal = "hipertrofia" | "fuerza" | "resistencia" | "perdida_grasa";
type Level = "principiante" | "intermedio" | "avanzado";

interface OnboardingData {
  goal: Goal | null;
  level: Level | null;
  days: number;
  duration: number;
  equipment: string[];
}

const goals: { id: Goal; label: string; emoji: string; desc: string }[] = [
  { id: "hipertrofia", label: "Hipertrofia", emoji: "💪", desc: "Ganar masa muscular" },
  { id: "fuerza", label: "Fuerza", emoji: "🏋️", desc: "Mover más peso" },
  { id: "resistencia", label: "Resistencia", emoji: "🔥", desc: "Aguantar más" },
  { id: "perdida_grasa", label: "Pérdida de grasa", emoji: "⚡", desc: "Definir y quemar" },
];

const levels: { id: Level; label: string; desc: string; months: string }[] = [
  { id: "principiante", label: "Principiante", desc: "Menos de 6 meses", months: "0-6" },
  { id: "intermedio", label: "Intermedio", desc: "6 meses a 2 años", months: "6-24" },
  { id: "avanzado", label: "Avanzado", desc: "Más de 2 años", months: "24+" },
];

const equipmentOptions = [
  "Barra", "Mancuernas", "Máquinas", "Poleas", "Peso corporal", "Bandas", "Kettlebell", "TRX",
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    goal: null,
    level: null,
    days: 4,
    duration: 60,
    equipment: [],
  });

  const totalSteps = 5;

  const next = () => {
    if (step < totalSteps - 1) setStep(step + 1);
    else navigate("/dashboard");
  };
  const prev = () => { if (step > 0) setStep(step - 1); };

  const toggleEquipment = (eq: string) => {
    setData(d => ({
      ...d,
      equipment: d.equipment.includes(eq)
        ? d.equipment.filter(e => e !== eq)
        : [...d.equipment, eq],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!data.goal;
      case 1: return !!data.level;
      case 2: return data.days >= 2;
      case 3: return data.duration >= 20;
      case 4: return data.equipment.length > 0;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={prev} className={cn("text-muted-foreground hover:text-foreground transition-colors", step === 0 && "invisible")}>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i <= step ? "bg-primary" : "bg-secondary"
            )} />
          ))}
        </div>
        <span className="text-xs text-muted-foreground font-medium">{step + 1}/{totalSteps}</span>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1"
        >
          {step === 0 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                <Target className="inline w-6 h-6 text-primary mr-2" />
                ¿Cuál es tu objetivo?
              </h2>
              <p className="text-muted-foreground text-sm mb-6">Esto nos ayuda a crear tu rutina ideal</p>
              <div className="space-y-3">
                {goals.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setData(d => ({ ...d, goal: g.id }))}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200",
                      data.goal === g.id
                        ? "bg-primary/10 border-primary/40 shadow-[0_0_16px_hsl(142_72%_50%/0.15)]"
                        : "bg-card border-border/50 hover:border-primary/20"
                    )}
                  >
                    <span className="text-2xl">{g.emoji}</span>
                    <div className="text-left">
                      <span className="font-semibold text-foreground">{g.label}</span>
                      <p className="text-xs text-muted-foreground">{g.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                <Zap className="inline w-6 h-6 text-primary mr-2" />
                ¿Tu nivel de experiencia?
              </h2>
              <p className="text-muted-foreground text-sm mb-6">Adaptaremos la intensidad a tu nivel</p>
              <div className="space-y-3">
                {levels.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setData(d => ({ ...d, level: l.id }))}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200",
                      data.level === l.id
                        ? "bg-primary/10 border-primary/40 shadow-[0_0_16px_hsl(142_72%_50%/0.15)]"
                        : "bg-card border-border/50 hover:border-primary/20"
                    )}
                  >
                    <div className="text-left flex-1">
                      <span className="font-semibold text-foreground">{l.label}</span>
                      <p className="text-xs text-muted-foreground">{l.desc}</p>
                    </div>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-lg">{l.months} meses</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                <Calendar className="inline w-6 h-6 text-primary mr-2" />
                ¿Cuántos días entrenas?
              </h2>
              <p className="text-muted-foreground text-sm mb-8">Días por semana disponibles</p>
              <div className="flex items-center justify-center gap-6 mb-8">
                <button
                  onClick={() => setData(d => ({ ...d, days: Math.max(2, d.days - 1) }))}
                  className="w-12 h-12 rounded-xl bg-secondary text-foreground flex items-center justify-center text-2xl font-bold hover:bg-secondary/80"
                >
                  -
                </button>
                <div className="text-center">
                  <span className="text-6xl font-display font-black text-primary text-glow-primary">{data.days}</span>
                  <p className="text-sm text-muted-foreground mt-1">días/semana</p>
                </div>
                <button
                  onClick={() => setData(d => ({ ...d, days: Math.min(7, d.days + 1) }))}
                  className="w-12 h-12 rounded-xl bg-secondary text-foreground flex items-center justify-center text-2xl font-bold hover:bg-secondary/80"
                >
                  +
                </button>
              </div>
              <div className="flex justify-center gap-2">
                {[2, 3, 4, 5, 6].map(d => (
                  <button
                    key={d}
                    onClick={() => setData(prev => ({ ...prev, days: d }))}
                    className={cn(
                      "w-10 h-10 rounded-xl text-sm font-semibold transition-all",
                      data.days === d ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                <Clock className="inline w-6 h-6 text-primary mr-2" />
                ¿Duración por sesión?
              </h2>
              <p className="text-muted-foreground text-sm mb-8">Minutos por entrenamiento</p>
              <div className="text-center mb-8">
                <span className="text-6xl font-display font-black text-primary text-glow-primary">{data.duration}</span>
                <p className="text-sm text-muted-foreground mt-1">minutos</p>
              </div>
              <div className="flex justify-center gap-3 flex-wrap">
                {[30, 45, 60, 75, 90].map(d => (
                  <button
                    key={d}
                    onClick={() => setData(prev => ({ ...prev, duration: d }))}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                      data.duration === d ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                <Dumbbell className="inline w-6 h-6 text-primary mr-2" />
                ¿Qué equipamiento tienes?
              </h2>
              <p className="text-muted-foreground text-sm mb-6">Selecciona todo lo disponible</p>
              <div className="grid grid-cols-2 gap-3">
                {equipmentOptions.map(eq => (
                  <button
                    key={eq}
                    onClick={() => toggleEquipment(eq)}
                    className={cn(
                      "p-3.5 rounded-2xl text-sm font-medium transition-all duration-200 border",
                      data.equipment.includes(eq)
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-card border-border/50 text-muted-foreground hover:border-primary/20 hover:text-foreground"
                    )}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Next button */}
      <motion.div className="mt-6">
        <button
          onClick={next}
          disabled={!canProceed()}
          className={cn(
            "w-full flex items-center justify-center gap-2 h-14 rounded-2xl font-bold text-lg transition-all duration-300 active:scale-[0.98]",
            canProceed()
              ? "bg-primary text-primary-foreground shadow-[0_0_24px_hsl(142_72%_50%/0.3)]"
              : "bg-secondary text-muted-foreground cursor-not-allowed"
          )}
        >
          {step === totalSteps - 1 ? "Generar mi Rutina" : "Continuar"}
          <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
};

export default Onboarding;
