import { motion } from "framer-motion";
import { Dumbbell, Play, Flame, ChevronRight } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { XPBar } from "@/components/XPBar";
import { LevelBadge } from "@/components/LevelBadge";
import { StatCard } from "@/components/StatCard";
import { WorkoutCard } from "@/components/WorkoutCard";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const XP_PER_LEVEL = 500;

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["dashboard-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, level, xp, streak_days")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: workoutStats } = useQuery({
    queryKey: ["dashboard-workout-stats", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_logs")
        .select("duration_minutes, xp_earned, completed_at")
        .eq("user_id", user!.id);
      if (error) throw error;

      const totalWorkouts = data?.filter(w => w.completed_at).length || 0;
      const totalMinutes = data?.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) || 0;
      const totalHours = Math.round(totalMinutes / 60);

      return { totalWorkouts, totalHours };
    },
    enabled: !!user,
  });

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "—";
  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const streak = profile?.streak_days || 0;
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL;

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">{t.dashboard.welcomeBack}</p>
            <h1 className="text-2xl font-display font-bold text-foreground">{displayName} 💪</h1>
          </div>
          <LevelBadge level={level} />
        </div>

        {/* XP Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-card border border-border/50 mb-6"
        >
          <XPBar current={xpInLevel} max={xpToNext} label={t.dashboard.experience} variant="xp" size="md" />
          <p className="text-xs text-muted-foreground mt-2">
            {xpToNext - xpInLevel} XP → {t.profile.level} {level + 1}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <StatCard label={t.dashboard.streak} value={String(streak)} icon="streak" />
          <StatCard label={t.dashboard.workouts} value={String(workoutStats?.totalWorkouts || 0)} icon="workouts" />
          <StatCard label="XP" value={String(xp)} icon="weight" />
          <StatCard label={t.dashboard.hours} value={String(workoutStats?.totalHours || 0)} icon="time" />
        </div>
      </div>

      {/* Today's Workout */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-bold text-foreground">{t.dashboard.today}</h2>
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
                <p className="text-sm text-muted-foreground">{t.dashboard.chest}, {t.dashboard.shoulders}, {t.dashboard.triceps}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-semibold text-xp">+180 XP</span>
                  <span className="text-xs text-muted-foreground">~60 {t.common.minutes}</span>
                  <span className="text-xs text-muted-foreground">6 {t.common.exercises}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
        </motion.div>
      </div>

      {/* Weekly Schedule */}
      <div className="px-6 mt-8">
        <h2 className="text-lg font-display font-bold text-foreground mb-3">{t.dashboard.thisWeek}</h2>
        <div className="space-y-3">
          <WorkoutCard title="Pull Day" subtitle={`${t.dashboard.back}, ${t.dashboard.biceps}`} icon={Dumbbell} xp={170} duration={`55 ${t.common.minutes}`} exercises={6} variant="completed" />
          <WorkoutCard title="Legs Day" subtitle={`${t.dashboard.quads}, ${t.dashboard.hamstrings}, ${t.dashboard.glutes}`} icon={Flame} xp={200} duration={`65 ${t.common.minutes}`} exercises={7} variant="completed" />
          <WorkoutCard title="Push Day" subtitle={`${t.dashboard.chest}, ${t.dashboard.shoulders}, ${t.dashboard.triceps}`} icon={Dumbbell} xp={180} duration={`60 ${t.common.minutes}`} exercises={6} variant="active" onClick={() => navigate("/workout")} />
          <WorkoutCard title="Pull Day" subtitle={`${t.dashboard.back}, ${t.dashboard.biceps}`} icon={Dumbbell} xp={170} duration={`55 ${t.common.minutes}`} exercises={6} />
          <WorkoutCard title="Legs Day" subtitle={`${t.dashboard.quads}, ${t.dashboard.hamstrings}, ${t.dashboard.glutes}`} icon={Flame} xp={200} duration={`65 ${t.common.minutes}`} exercises={7} />
        </div>
      </div>

      {/* Weekly Challenge */}
      <div className="px-6 mt-8">
        <h2 className="text-lg font-display font-bold text-foreground mb-3">{t.dashboard.weeklyChallenge}</h2>
        <div className="p-4 rounded-2xl bg-gradient-to-r from-achievement/10 to-transparent border border-achievement/20">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🔥</span>
            <div>
              <h3 className="font-semibold text-foreground">{t.dashboard.fireWeek}</h3>
              <p className="text-xs text-muted-foreground">{t.dashboard.fireWeekDesc}</p>
            </div>
          </div>
          <XPBar current={workoutStats?.totalWorkouts ? Math.min(workoutStats.totalWorkouts, 5) : 0} max={5} variant="achievement" size="sm" label={t.dashboard.progress} />
          <p className="text-xs text-achievement font-semibold mt-2">{t.dashboard.xpBonus}</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
