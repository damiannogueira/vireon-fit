import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Target, Zap, Calendar, Clock, Dumbbell, User, Ruler, Cake } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Goal = "hipertrofia" | "fuerza" | "resistencia" | "perdida_grasa";
type Level = "principiante" | "intermedio" | "avanzado";
type Gender = "male" | "female" | "other";

const LEVEL_MAP: Record<Level, "beginner" | "intermediate" | "advanced"> = {
  principiante: "beginner",
  intermedio: "intermediate",
  avanzado: "advanced",
};

const GOAL_MAP: Record<Goal, string> = {
  hipertrofia: "hipertrofia",
  fuerza: "fuerza",
  resistencia: "perdida_grasa",
  perdida_grasa: "perdida_grasa",
};

interface OnboardingData {
  gender: Gender | null;
  birthYear: number;
  birthMonth: number;
  height: number;
  weight: number;
  goal: Goal | null;
  level: Level | null;
  days: number;
  duration: number;
  equipment: string[];
}

const currentYear = new Date().getFullYear();

const Onboarding = () => {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    gender: null,
    birthYear: 1995,
    birthMonth: 1,
    height: 170,
    weight: 70,
    goal: null,
    level: null,
    days: 4,
    duration: 60,
    equipment: [],
  });

  const genders: { id: Gender; label: string; emoji: string }[] = [
    { id: "male", label: t.onboarding.male, emoji: "🙋‍♂️" },
    { id: "female", label: t.onboarding.female, emoji: "🙋‍♀️" },
    { id: "other", label: t.onboarding.other, emoji: "🧑" },
  ];

  const goals: { id: Goal; label: string; emoji: string; desc: string }[] = [
    { id: "hipertrofia", label: t.onboarding.hypertrophy, emoji: "💪", desc: t.onboarding.hypertrophyDesc },
    { id: "fuerza", label: t.onboarding.strength, emoji: "🏋️", desc: t.onboarding.strengthDesc },
    { id: "resistencia", label: t.onboarding.endurance, emoji: "🔥", desc: t.onboarding.enduranceDesc },
    { id: "perdida_grasa", label: t.onboarding.fatLoss, emoji: "⚡", desc: t.onboarding.fatLossDesc },
  ];

  const levels: { id: Level; label: string; desc: string; months: string }[] = [
    { id: "principiante", label: t.onboarding.beginner, desc: t.onboarding.beginnerDesc, months: "0-6" },
    { id: "intermedio", label: t.onboarding.intermediateLabel, desc: t.onboarding.intermediateDesc, months: "6-24" },
    { id: "avanzado", label: t.onboarding.advanced, desc: t.onboarding.advancedDesc, months: "24+" },
  ];

  const equipmentOptions = [
    t.onboarding.barbell, t.onboarding.dumbbells, t.onboarding.machines, t.onboarding.cables,
    t.onboarding.bodyweight, t.onboarding.bands, t.onboarding.kettlebell, t.onboarding.trx,
  ];

  const totalSteps = 8;

  const saveOnboarding = async () => {
    if (!user || !data.goal || !data.level || !data.gender) return;
    setSaving(true);
    try {
      const birthDate = `${data.birthYear}-${String(data.birthMonth).padStart(2, "0")}-15`;

      await supabase
        .from("onboarding_progress")
        .update({
          fitness_goal: GOAL_MAP[data.goal],
          preferred_days: Array.from({ length: data.days }, (_, i) => String(i + 1)),
          current_step: totalSteps,
          completed_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      await supabase
        .from("profiles")
        .update({
          fitness_level: LEVEL_MAP[data.level],
          onboarding_completed: true,
          gender: data.gender,
          height_cm: data.height,
          weight_kg: data.weight,
          birth_date: birthDate,
        } as any)
        .eq("user_id", user.id);

      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Error saving onboarding data");
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (step < totalSteps - 1) setStep(step + 1);
    else saveOnboarding();
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
      case 0: return !!data.gender;
      case 1: return data.birthYear >= 1930 && data.birthYear <= currentYear - 12;
      case 2: return data.height >= 100 && data.height <= 250 && data.weight >= 30 && data.weight <= 300;
      case 3: return !!data.goal;
      case 4: return !!data.level;
      case 5: return data.days >= 2;
      case 6: return data.duration >= 20;
      case 7: return data.equipment.length > 0;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => step === 0 ? navigate(-1) : prev()} 
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
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
          {/* Step 0: Gender */}
          {step === 0 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                <User className="inline w-6 h-6 text-primary mr-2" />
                {t.onboarding.genderTitle}
              </h2>
              <p className="text-muted-foreground text-sm mb-6">{t.onboarding.genderHelp}</p>
              <div className="space-y-3">
                {genders.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setData(d => ({ ...d, gender: g.id }))}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200",
                      data.gender === g.id
                        ? "bg-primary/10 border-primary/40 shadow-[0_0_16px_hsl(142_72%_50%/0.15)]"
                        : "bg-card border-border/50 hover:border-primary/20"
                    )}
                  >
                    <span className="text-2xl">{g.emoji}</span>
                    <span className="font-semibold text-foreground">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Birth Date */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                <Cake className="inline w-6 h-6 text-primary mr-2" />
                {locale === "es" ? "¿Cuándo naciste?" : "When were you born?"}
              </h2>
              <p className="text-muted-foreground text-sm mb-8">
                {locale === "es" ? "Tu edad nos ayuda a personalizar la intensidad y el tipo de ejercicios" : "Your age helps us personalize intensity and exercise types"}
              </p>
              <div className="space-y-8">
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    {locale === "es" ? "Año de nacimiento" : "Birth year"}
                  </label>
                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={() => setData(d => ({ ...d, birthYear: Math.max(1930, d.birthYear - 1) }))}
                      className="w-12 h-12 rounded-xl bg-secondary text-foreground flex items-center justify-center text-2xl font-bold hover:bg-secondary/80"
                    >-</button>
                    <div className="text-center">
                      <span className="text-5xl font-display font-black text-primary text-glow-primary">{data.birthYear}</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentYear - data.birthYear} {locale === "es" ? "años" : "years"}
                      </p>
                    </div>
                    <button
                      onClick={() => setData(d => ({ ...d, birthYear: Math.min(currentYear - 12, d.birthYear + 1) }))}
                      className="w-12 h-12 rounded-xl bg-secondary text-foreground flex items-center justify-center text-2xl font-bold hover:bg-secondary/80"
                    >+</button>
                  </div>
                </div>
                <div className="flex justify-center gap-2 flex-wrap">
                  {[1990, 1995, 2000, 2005].map(y => (
                    <button
                      key={y}
                      onClick={() => setData(d => ({ ...d, birthYear: y }))}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                        data.birthYear === y ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >{y}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Height & Weight */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                <Ruler className="inline w-6 h-6 text-primary mr-2" />
                {t.onboarding.heightWeight}
              </h2>
              <p className="text-muted-foreground text-sm mb-8">{t.onboarding.heightWeightHelp}</p>
              <div className="space-y-8">
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">{t.onboarding.height}</label>
                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={() => setData(d => ({ ...d, height: Math.max(100, d.height - 1) }))}
                      className="w-12 h-12 rounded-xl bg-secondary text-foreground flex items-center justify-center text-2xl font-bold hover:bg-secondary/80"
                    >-</button>
                    <div className="text-center">
                      <span className="text-5xl font-display font-black text-primary text-glow-primary">{data.height}</span>
                      <p className="text-sm text-muted-foreground mt-1">cm</p>
                    </div>
                    <button
                      onClick={() => setData(d => ({ ...d, height: Math.min(250, d.height + 1) }))}
                      className="w-12 h-12 rounded-xl bg-secondary text-foreground flex items-center justify-center text-2xl font-bold hover:bg-secondary/80"
                    >+</button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">{t.onboarding.weight}</label>
                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={() => setData(d => ({ ...d, weight: Math.max(30, d.weight - 1) }))}
                      className="w-12 h-12 rounded-xl bg-secondary text-foreground flex items-center justify-center text-2xl font-bold hover:bg-secondary/80"
                    >-</button>
                    <div className="text-center">
                      <span className="text-5xl font-display font-black text-primary text-glow-primary">{data.weight}</span>
                      <p className="text-sm text-muted-foreground mt-1">kg</p>
                    </div>
                    <button
                      onClick={() => setData(d => ({ ...d, weight: Math.min(300, d.weight + 1) }))}
                      className="w-12 h-12 rounded-xl bg-secondary text-foreground flex items-center justify-center text-2xl font-bold hover:bg-secondary/80"
                    >+</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Goal */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                <Target className="inline w-6 h-6 text-primary mr-2" />
                {t.onboarding.whatGoal}
              </h2>
              <p className="text-muted-foreground text-sm mb-6">{t.onboarding.goalHelp}</p>
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

          {/* Step 3: Level */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                <Zap className="inline w-6 h-6 text-primary mr-2" />
                {t.onboarding.expLevel}
              </h2>
              <p className="text-muted-foreground text-sm mb-6">{t.onboarding.expHelp}</p>
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
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-lg">{l.months} {t.onboarding.months}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Days */}
          {step === 5 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                <Calendar className="inline w-6 h-6 text-primary mr-2" />
                {t.onboarding.howManyDays}
              </h2>
              <p className="text-muted-foreground text-sm mb-8">{t.onboarding.daysAvailable}</p>
              <div className="flex items-center justify-center gap-6 mb-8">
                <button
                  onClick={() => setData(d => ({ ...d, days: Math.max(2, d.days - 1) }))}
                  className="w-12 h-12 rounded-xl bg-secondary text-foreground flex items-center justify-center text-2xl font-bold hover:bg-secondary/80"
                >-</button>
                <div className="text-center">
                  <span className="text-6xl font-display font-black text-primary text-glow-primary">{data.days}</span>
                  <p className="text-sm text-muted-foreground mt-1">{t.onboarding.daysPerWeek}</p>
                </div>
                <button
                  onClick={() => setData(d => ({ ...d, days: Math.min(7, d.days + 1) }))}
                  className="w-12 h-12 rounded-xl bg-secondary text-foreground flex items-center justify-center text-2xl font-bold hover:bg-secondary/80"
                >+</button>
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
                  >{d}</button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Duration */}
          {step === 6 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                <Clock className="inline w-6 h-6 text-primary mr-2" />
                {t.onboarding.sessionDuration}
              </h2>
              <p className="text-muted-foreground text-sm mb-8">{t.onboarding.minutesPerSession}</p>
              <div className="text-center mb-8">
                <span className="text-6xl font-display font-black text-primary text-glow-primary">{data.duration}</span>
                <p className="text-sm text-muted-foreground mt-1">{t.onboarding.minutesLabel}</p>
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
                  >{d} {t.common.minutes}</button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Equipment */}
          {step === 7 && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                <Dumbbell className="inline w-6 h-6 text-primary mr-2" />
                {t.onboarding.whatEquipment}
              </h2>
              <p className="text-muted-foreground text-sm mb-6">{t.onboarding.selectAll}</p>
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
                  >{eq}</button>
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
          disabled={!canProceed() || saving}
          className={cn(
            "w-full flex items-center justify-center gap-2 h-14 rounded-2xl font-bold text-lg transition-all duration-300 active:scale-[0.98]",
            canProceed() && !saving
              ? "bg-primary text-primary-foreground shadow-[0_0_24px_hsl(142_72%_50%/0.3)]"
              : "bg-secondary text-muted-foreground cursor-not-allowed"
          )}
        >
          {saving ? "..." : step === totalSteps - 1 ? t.onboarding.generateRoutine : t.onboarding.continue}
          {!saving && <ChevronRight className="w-5 h-5" />}
        </button>
      </motion.div>
    </div>
  );
};

export default Onboarding;
