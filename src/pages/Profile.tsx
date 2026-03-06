import { motion } from "framer-motion";
import { Crown, Dumbbell, Globe, LogOut, CreditCard, Building2 } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { BottomNav } from "@/components/BottomNav";
import { LevelBadge } from "@/components/LevelBadge";
import { XPBar } from "@/components/XPBar";
import { useI18n } from "@/i18n";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";

const XP_PER_LEVEL = 500;

const Profile = () => {
  const { t, locale, setLocale } = useI18n();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { isGymAdmin, gymId, isIndividual } = useUserRole();

  const { data: profile } = useQuery({
    queryKey: ["profile-page", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: workoutStats } = useQuery({
    queryKey: ["profile-workout-stats", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_logs")
        .select("duration_minutes, xp_earned, completed_at")
        .eq("user_id", user!.id);
      const totalWorkouts = data?.filter(w => w.completed_at).length || 0;
      const totalXpEarned = data?.reduce((sum, w) => sum + (w.xp_earned || 0), 0) || 0;
      return { totalWorkouts, totalXpEarned };
    },
    enabled: !!user,
  });

  // Payment status for gym member students
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  const { data: myPayment } = useQuery({
    queryKey: ["my-payment", user?.id, currentMonth],
    queryFn: async () => {
      const { data } = await supabase
        .from("gym_payments")
        .select("*")
        .eq("user_id", user!.id)
        .eq("period_month", currentMonth)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !isGymAdmin && !isIndividual,
  });

  const { data: myGym } = useQuery({
    queryKey: ["my-gym-name", profile?.gym_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("gyms")
        .select("name")
        .eq("id", profile!.gym_id!)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.gym_id && !isGymAdmin,
  });

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "—";
  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const xpInLevel = xp % XP_PER_LEVEL;
  const fitnessLevel = profile?.fitness_level || "beginner";

  const fitnessLabel = (fl: string) => {
    const map: Record<string, string> = {
      beginner: locale === "es" ? "Principiante" : "Beginner",
      intermediate: locale === "es" ? "Intermedio" : "Intermediate",
      advanced: locale === "es" ? "Avanzado" : "Advanced",
      elite: "Elite",
    };
    return map[fl] || fl;
  };

  const monthLabel = new Date().toLocaleString(locale === "es" ? "es-AR" : "en-US", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">{t.profile.title}</h1>
          <NotificationBell />
        </div>

        {/* User Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 mb-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
            <span className="text-2xl">{isGymAdmin ? "🏋️" : "💪"}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">{displayName}</h2>
            <p className="text-sm text-muted-foreground">{user?.email || "—"}</p>
          </div>
          {!isGymAdmin && <LevelBadge level={level} className="w-12 h-12" />}
        </motion.div>

        {/* Gym membership info for students */}
        {!isGymAdmin && myGym && (
          <div className="p-4 rounded-2xl bg-card border border-border/50 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">{myGym.name}</h3>
            </div>
            {/* Payment status */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground capitalize">{monthLabel}</span>
              </div>
              <span className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                myPayment?.is_paid
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive"
              )}>
                {myPayment?.is_paid
                  ? (locale === "es" ? "✓ Al día" : "✓ Paid")
                  : (locale === "es" ? "✗ Pendiente" : "✗ Pending")}
              </span>
            </div>
          </div>
        )}

        {/* XP - only for non gym admins */}
        {!isGymAdmin && (
          <div className="p-4 rounded-2xl bg-card border border-border/50 mb-6">
            <XPBar current={xpInLevel} max={XP_PER_LEVEL} label={t.profile.levelTo.replace("{from}", String(level)).replace("{to}", String(level + 1))} variant="xp" />
            <p className="text-xs text-muted-foreground mt-2">{t.profile.totalXP}: {xp.toLocaleString()}</p>
          </div>
        )}

        {/* Plan */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-achievement/10 to-transparent border border-achievement/20 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-achievement" />
              <div>
                <h3 className="font-semibold text-foreground">{t.profile.planFree}</h3>
                <p className="text-xs text-muted-foreground">{t.profile.basicFeatures}</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/pricing")}
              className="px-4 py-2 rounded-xl bg-achievement text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {t.profile.upgradePro}
            </button>
          </div>
        </div>

        {/* Language toggle */}
        <div className="p-4 rounded-2xl bg-card border border-border/50 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-foreground">{t.profile.language}</span>
          </div>
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
            {(["es", "en"] as const).map(l => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  locale === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Config */}
        <h2 className="text-lg font-display font-bold text-foreground mb-3">{t.profile.settings}</h2>
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
          {[
            { label: t.profile.level, value: fitnessLabel(fitnessLevel), show: !isGymAdmin },
            { label: locale === "es" ? "Racha" : "Streak", value: `${profile?.streak_days || 0} ${t.common.days}`, show: !isGymAdmin },
            { label: "Workouts", value: String(workoutStats?.totalWorkouts || 0), show: !isGymAdmin },
            { label: locale === "es" ? "Rol" : "Role", value: isGymAdmin ? "Gym Admin" : isIndividual ? (locale === "es" ? "Particular" : "Individual") : (locale === "es" ? "Alumno" : "Member"), show: true },
          ].filter(i => i.show).map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3.5 border-b border-border/30 last:border-0">
              <span className="text-sm text-foreground">{item.label}</span>
              <span className="text-sm text-muted-foreground">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Training Info - only for non gym admins */}
        {!isGymAdmin && (
          <div className="mt-6 p-4 rounded-2xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Dumbbell className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">{t.profile.myRoutine}</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t.profile.totalXP}</span>
                <span className="text-sm font-medium text-xp">{xp.toLocaleString()} XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{locale === "es" ? "Racha actual" : "Current streak"}</span>
                <span className="text-sm font-medium text-achievement">{profile?.streak_days || 0} {t.common.days}</span>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={async () => { await signOut(); navigate("/auth", { replace: true }); }}
          className="mt-6 w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive font-semibold hover:bg-destructive/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {t.profile.logout}
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
