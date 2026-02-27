import { motion } from "framer-motion";
import { Trophy, Flame, Target, Zap, Dumbbell, Star, Clock, TrendingUp } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { AchievementBadge } from "@/components/AchievementBadge";
import { XPBar } from "@/components/XPBar";
import { useI18n } from "@/i18n";

const Achievements = () => {
  const { t } = useI18n();

  const achievements = [
    { icon: Flame, title: t.achievements.firstStreak, unlocked: true },
    { icon: Target, title: t.achievements.tenWorkouts, unlocked: true },
    { icon: Dumbbell, title: t.achievements.benchHundred, unlocked: true },
    { icon: Star, title: t.achievements.levelFive, unlocked: true },
    { icon: Clock, title: t.achievements.earlyBird, unlocked: true },
    { icon: TrendingUp, title: t.achievements.weeklyPR, unlocked: false },
    { icon: Trophy, title: t.achievements.streak30, unlocked: false },
    { icon: Zap, title: t.achievements.levelTen, unlocked: false },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-8">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">{t.achievements.title}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t.achievements.subtitle}</p>

        {/* Weekly Challenge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-achievement/10 to-transparent border border-achievement/20 mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🔥</span>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{t.achievements.challenge}</h3>
              <p className="text-xs text-muted-foreground">{t.achievements.challengeDesc}</p>
            </div>
          </div>
          <XPBar current={3} max={5} variant="achievement" size="md" />
        </motion.div>

        {/* Badges Grid */}
        <h2 className="text-lg font-display font-bold text-foreground mb-3">{t.achievements.badges}</h2>
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
          <h3 className="font-semibold text-foreground mb-3">{t.achievements.summary}</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t.achievements.badgesUnlocked}</span>
              <span className="text-sm font-bold text-foreground">5 / 8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t.achievements.totalXP}</span>
              <span className="text-sm font-bold text-xp">12,450 XP</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t.achievements.longestStreak}</span>
              <span className="text-sm font-bold text-achievement">18 {t.common.days}</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Achievements;
