import { motion } from "framer-motion";
import { Trophy, Flame, Target, Zap, Dumbbell, Star, Clock, TrendingUp } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { AchievementBadge } from "@/components/AchievementBadge";
import { XPBar } from "@/components/XPBar";
import { useI18n } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Achievements = () => {
  const { t } = useI18n();
  const { user } = useAuth();

  const { data: userAchievements } = useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_achievements")
        .select("*, achievements(*)")
        .eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: allAchievements } = useQuery({
    queryKey: ["all-achievements"],
    queryFn: async () => {
      const { data } = await supabase.from("achievements").select("*");
      return data || [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["achievements-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("xp, streak_days")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: workoutCount } = useQuery({
    queryKey: ["achievements-workout-count", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_logs")
        .select("id")
        .eq("user_id", user!.id)
        .not("completed_at", "is", null);
      return data?.length || 0;
    },
    enabled: !!user,
  });

  const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

  const iconMap: Record<string, any> = {
    "🔥": Flame,
    "🎯": Target,
    "💪": Dumbbell,
    "⭐": Star,
    "⏰": Clock,
    "📈": TrendingUp,
    "🏆": Trophy,
    "⚡": Zap,
  };

  const achievementsList = allAchievements?.map(a => ({
    id: a.id,
    icon: iconMap[a.icon || "🏆"] || Trophy,
    title: a.name,
    unlocked: unlockedIds.has(a.id),
  })) || [];

  // If no achievements in DB, show defaults
  const displayAchievements = achievementsList.length > 0 ? achievementsList : [
    { id: "1", icon: Flame, title: t.achievements.firstStreak, unlocked: (profile?.streak_days || 0) >= 3 },
    { id: "2", icon: Target, title: t.achievements.tenWorkouts, unlocked: (workoutCount || 0) >= 10 },
    { id: "3", icon: Dumbbell, title: t.achievements.benchHundred, unlocked: false },
    { id: "4", icon: Star, title: t.achievements.levelFive, unlocked: false },
    { id: "5", icon: Clock, title: t.achievements.earlyBird, unlocked: false },
    { id: "6", icon: TrendingUp, title: t.achievements.weeklyPR, unlocked: false },
    { id: "7", icon: Trophy, title: t.achievements.streak30, unlocked: (profile?.streak_days || 0) >= 30 },
    { id: "8", icon: Zap, title: t.achievements.levelTen, unlocked: false },
  ];

  const unlockedCount = displayAchievements.filter(a => a.unlocked).length;

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
          <XPBar current={Math.min(workoutCount || 0, 5)} max={5} variant="achievement" size="md" />
        </motion.div>

        {/* Badges Grid */}
        <h2 className="text-lg font-display font-bold text-foreground mb-3">{t.achievements.badges}</h2>
        <div className="grid grid-cols-4 gap-1">
          {displayAchievements.map((a, i) => (
            <motion.div
              key={a.id}
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
              <span className="text-sm font-bold text-foreground">{unlockedCount} / {displayAchievements.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t.achievements.totalXP}</span>
              <span className="text-sm font-bold text-xp">{(profile?.xp || 0).toLocaleString()} XP</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t.achievements.longestStreak}</span>
              <span className="text-sm font-bold text-achievement">{profile?.streak_days || 0} {t.common.days}</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Achievements;
