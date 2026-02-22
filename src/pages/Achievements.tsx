import { motion } from "framer-motion";
import { Trophy, Flame, Target, Zap, Dumbbell, Star, Clock, TrendingUp } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { AchievementBadge } from "@/components/AchievementBadge";
import { XPBar } from "@/components/XPBar";

const achievements = [
  { icon: Flame, title: "Primera Racha", unlocked: true },
  { icon: Target, title: "10 Entrenos", unlocked: true },
  { icon: Dumbbell, title: "100 kg Banca", unlocked: true },
  { icon: Star, title: "Nivel 5", unlocked: true },
  { icon: Clock, title: "Madrugador", unlocked: true },
  { icon: TrendingUp, title: "PR Semanal", unlocked: false },
  { icon: Trophy, title: "Racha 30", unlocked: false },
  { icon: Zap, title: "Nivel 10", unlocked: false },
];

const Achievements = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-8">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">Logros</h1>
        <p className="text-sm text-muted-foreground mb-6">Tu colección de insignias</p>

        {/* Weekly Challenge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-achievement/10 to-transparent border border-achievement/20 mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🔥</span>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Reto: Semana de Fuego</h3>
              <p className="text-xs text-muted-foreground">5 entrenos esta semana → +500 XP</p>
            </div>
          </div>
          <XPBar current={3} max={5} variant="achievement" size="md" />
        </motion.div>

        {/* Badges Grid */}
        <h2 className="text-lg font-display font-bold text-foreground mb-3">Insignias</h2>
        <div className="grid grid-cols-4 gap-1">
          {achievements.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <AchievementBadge icon={a.icon} title={a.title} unlocked={a.unlocked} />
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-8 p-4 rounded-2xl bg-card border border-border/50">
          <h3 className="font-semibold text-foreground mb-3">Resumen</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Insignias desbloqueadas</span>
              <span className="text-sm font-bold text-foreground">5 / 8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">XP total acumulado</span>
              <span className="text-sm font-bold text-xp">12,450 XP</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Racha más larga</span>
              <span className="text-sm font-bold text-achievement">18 días</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Achievements;
