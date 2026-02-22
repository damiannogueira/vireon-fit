import { motion } from "framer-motion";
import { Dumbbell, Play, Flame, ChevronRight } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { XPBar } from "@/components/XPBar";
import { LevelBadge } from "@/components/LevelBadge";
import { StatCard } from "@/components/StatCard";
import { WorkoutCard } from "@/components/WorkoutCard";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Bienvenido de vuelta</p>
            <h1 className="text-2xl font-display font-bold text-foreground">Guerrero 💪</h1>
          </div>
          <LevelBadge level={7} />
        </div>

        {/* XP Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-card border border-border/50 mb-6"
        >
          <XPBar current={2450} max={3000} label="Experiencia" variant="xp" size="md" />
          <p className="text-xs text-muted-foreground mt-2">550 XP para Nivel 8</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <StatCard label="Racha" value="12" icon="streak" />
          <StatCard label="Entrenos" value="48" icon="workouts" />
          <StatCard label="Kg" value="3.2k" icon="weight" />
          <StatCard label="Horas" value="36" icon="time" />
        </div>
      </div>

      {/* Today's Workout */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-bold text-foreground">Hoy</h2>
          <span className="text-xs text-primary font-semibold">Día 3 de 5</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => navigate("/workout")}
            className="w-full p-5 rounded-2xl bg-primary/10 border border-primary/30 shadow-[0_0_30px_hsl(142_72%_50%/0.12)] text-left group hover:shadow-[0_0_40px_hsl(142_72%_50%/0.2)] transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_20px_hsl(142_72%_50%/0.3)]">
                <Play className="w-7 h-7 text-primary-foreground ml-0.5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">Push Day</h3>
                <p className="text-sm text-muted-foreground">Pecho, Hombros, Tríceps</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-semibold text-xp">+180 XP</span>
                  <span className="text-xs text-muted-foreground">~60 min</span>
                  <span className="text-xs text-muted-foreground">6 ejercicios</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
        </motion.div>
      </div>

      {/* Weekly Schedule */}
      <div className="px-6 mt-8">
        <h2 className="text-lg font-display font-bold text-foreground mb-3">Esta semana</h2>
        <div className="space-y-3">
          <WorkoutCard
            title="Pull Day"
            subtitle="Espalda, Bíceps"
            icon={Dumbbell}
            xp={170}
            duration="55 min"
            exercises={6}
            variant="completed"
          />
          <WorkoutCard
            title="Legs Day"
            subtitle="Cuádriceps, Isquios, Glúteos"
            icon={Flame}
            xp={200}
            duration="65 min"
            exercises={7}
            variant="completed"
          />
          <WorkoutCard
            title="Push Day"
            subtitle="Pecho, Hombros, Tríceps"
            icon={Dumbbell}
            xp={180}
            duration="60 min"
            exercises={6}
            variant="active"
            onClick={() => navigate("/workout")}
          />
          <WorkoutCard
            title="Pull Day"
            subtitle="Espalda, Bíceps"
            icon={Dumbbell}
            xp={170}
            duration="55 min"
            exercises={6}
          />
          <WorkoutCard
            title="Legs Day"
            subtitle="Cuádriceps, Isquios, Glúteos"
            icon={Flame}
            xp={200}
            duration="65 min"
            exercises={7}
          />
        </div>
      </div>

      {/* Weekly Challenge */}
      <div className="px-6 mt-8">
        <h2 className="text-lg font-display font-bold text-foreground mb-3">Reto Semanal</h2>
        <div className="p-4 rounded-2xl bg-gradient-to-r from-achievement/10 to-transparent border border-achievement/20">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🔥</span>
            <div>
              <h3 className="font-semibold text-foreground">Semana de Fuego</h3>
              <p className="text-xs text-muted-foreground">Completa 5 entrenamientos esta semana</p>
            </div>
          </div>
          <XPBar current={3} max={5} variant="achievement" size="sm" label="Progreso" />
          <p className="text-xs text-achievement font-semibold mt-2">+500 XP de bonificación</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
