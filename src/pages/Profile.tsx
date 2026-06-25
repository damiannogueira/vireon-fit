import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Dumbbell, Globe, LogOut, CreditCard, Pencil, Check, X } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { BottomNav } from "@/components/BottomNav";
import { LevelBadge } from "@/components/LevelBadge";
import { XPBar } from "@/components/XPBar";
import { GoalChanger } from "@/components/GoalChanger";
import { ProUpsell } from "@/components/ProUpsell";
import { useI18n } from "@/i18n";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const XP_PER_LEVEL = 500;

const AVATARS = ["💪", "🏋️", "🔥", "⚡", "🦾", "🧘", "🏆", "🎯", "🚀", "🐉", "🦁", "🐺"];

const Profile = () => {
  const { t, locale, setLocale } = useI18n();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { isPro } = useSubscription();
  const queryClient = useQueryClient();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile-page", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*, gender, height_cm, weight_kg")
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
      const totalMinutes = data?.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) || 0;
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
      return { totalWorkouts, totalHours, totalMinutes };
    },
    enabled: !!user,
  });

  const { data: onboardingGoal } = useQuery({
    queryKey: ["profile-onboarding", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("onboarding_progress")
        .select("fitness_goal")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data?.fitness_goal || null;
    },
    enabled: !!user,
  });

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "—";
  const avatarEmoji = profile?.avatar_url || "💪";
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

  const handleSaveName = async () => {
    if (!user || !nameValue.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: nameValue.trim() })
        .eq("user_id", user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile-page"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-profile"] });
      toast.success(locale === "es" ? "Nombre actualizado" : "Name updated");
      setEditingName(false);
    } catch {
      toast.error(locale === "es" ? "Error al guardar" : "Failed to save");
    } finally {
      setSavingName(false);
    }
  };

  const handleSelectAvatar = async (emoji: string) => {
    if (!user) return;
    if (!isPro) {
      toast.error(locale === "es" ? "Función exclusiva Pro" : "Pro feature only");
      return;
    }
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: emoji })
        .eq("user_id", user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile-page"] });
      toast.success(locale === "es" ? "Avatar actualizado" : "Avatar updated");
      setShowAvatarPicker(false);
    } catch {
      toast.error(locale === "es" ? "Error al guardar" : "Failed to save");
    }
  };

  const handleSaveField = async (field: string, value: string) => {
    if (!user) return;
    try {
      const updateData: Record<string, unknown> = {};
      if (field === "gender") updateData.gender = value;
      if (field === "height_cm") updateData.height_cm = value ? Number(value) : null;
      if (field === "weight_kg") updateData.weight_kg = value ? Number(value) : null;
      if (field === "fitness_level") updateData.fitness_level = value;
      const { error } = await supabase
        .from("profiles")
        .update(updateData as never)
        .eq("user_id", user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["profile-page"] });
      toast.success(locale === "es" ? "Actualizado" : "Updated");
      setEditingField(null);
    } catch {
      toast.error(locale === "es" ? "Error al guardar" : "Failed to save");
    }
  };

  const hoursLabel = workoutStats?.totalHours
    ? workoutStats.totalHours < 1
      ? `${workoutStats.totalMinutes || 0} min`
      : `${workoutStats.totalHours} h`
    : "0";

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
          <button
            onClick={() => {
              if (isPro) setShowAvatarPicker(!showAvatarPicker);
              else toast(locale === "es" ? "🔒 Cambiá tu avatar con Pro" : "🔒 Change avatar with Pro", { action: { label: "Pro", onClick: () => navigate("/pricing") } });
            }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20 relative group"
          >
            <span className="text-2xl">{avatarEmoji}</span>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center">
              {isPro ? <Pencil className="w-2.5 h-2.5 text-muted-foreground" /> : <Crown className="w-2.5 h-2.5 text-achievement" />}
            </div>
          </button>
          <div className="flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  maxLength={30}
                  className="flex-1 h-8 px-2 rounded-lg bg-secondary border border-border/50 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
                />
                <button onClick={handleSaveName} disabled={savingName} className="text-primary"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingName(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{displayName}</h2>
                <button
                  onClick={() => { setNameValue(displayName); setEditingName(true); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{user?.email || "—"}</p>
          </div>
          <LevelBadge level={level} className="w-12 h-12" />
        </motion.div>

        {/* Avatar Picker (Pro only) */}
        {showAvatarPicker && isPro && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 p-4 rounded-2xl bg-card border border-border/50"
          >
            <p className="text-xs text-muted-foreground mb-2">
              {locale === "es" ? "Elegí tu avatar" : "Choose your avatar"}
            </p>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleSelectAvatar(emoji)}
                  className={cn(
                    "w-full aspect-square rounded-xl flex items-center justify-center text-xl transition-all",
                    avatarEmoji === emoji
                      ? "bg-primary/20 border-2 border-primary"
                      : "bg-secondary/50 border border-border/30 hover:border-primary/30"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Goal Changer */}
        <div className="mb-6">
          <GoalChanger currentGoal={onboardingGoal || null} />
        </div>

        {/* XP */}
        <div className="p-4 rounded-2xl bg-card border border-border/50 mb-6">
          <XPBar current={xpInLevel} max={XP_PER_LEVEL} label={t.profile.levelTo.replace("{from}", String(level)).replace("{to}", String(level + 1))} variant="xp" />
          <p className="text-xs text-muted-foreground mt-2">{t.profile.totalXP}: {xp.toLocaleString()}</p>
        </div>

        {/* Plan */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-achievement/10 to-transparent border border-achievement/20 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-achievement" />
              <div>
                <h3 className="font-semibold text-foreground">
                  {isPro ? "Pro" : t.profile.planFree}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isPro ? (locale === "es" ? "Todas las funciones activas" : "All features active") : t.profile.basicFeatures}
                </p>
              </div>
            </div>
            {!isPro && (
              <button
                onClick={() => navigate("/pricing")}
                className="px-4 py-2 rounded-xl bg-achievement text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                {t.profile.upgradePro}
              </button>
            )}
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
          {/* Fitness level - editable */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/30">
            <span className="text-sm text-foreground">{t.profile.level}</span>
            {editingField === "fitness_level" ? (
              <div className="flex items-center gap-1 flex-wrap justify-end">
                {(["beginner", "intermediate", "advanced"] as const).map(fl => (
                  <button
                    key={fl}
                    onClick={() => handleSaveField("fitness_level", fl)}
                    className={cn(
                      "px-2 py-1 text-xs rounded-lg border transition-all",
                      fitnessLevel === fl
                        ? "bg-primary/20 border-primary text-primary"
                        : "border-border/50 text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    {fitnessLabel(fl)}
                  </button>
                ))}
                <button onClick={() => setEditingField(null)} className="text-muted-foreground ml-1"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <button onClick={() => setEditingField("fitness_level")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <span>{fitnessLabel(fitnessLevel)}</span>
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Gender - editable */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/30">
            <span className="text-sm text-foreground">{locale === "es" ? "Sexo" : "Sex"}</span>
            {editingField === "gender" ? (
              <div className="flex items-center gap-1">
                {(["male", "female", "other"] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => handleSaveField("gender", g)}
                    className={cn(
                      "px-2 py-1 text-xs rounded-lg border transition-all",
                      profile?.gender === g
                        ? "bg-primary/20 border-primary text-primary"
                        : "border-border/50 text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    {g === "male" ? (locale === "es" ? "H" : "M") : g === "female" ? (locale === "es" ? "M" : "F") : (locale === "es" ? "Otro" : "Other")}
                  </button>
                ))}
                <button onClick={() => setEditingField(null)} className="text-muted-foreground ml-1"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <button onClick={() => setEditingField("gender")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <span>{profile?.gender === "male" ? (locale === "es" ? "Hombre" : "Male") : profile?.gender === "female" ? (locale === "es" ? "Mujer" : "Female") : profile?.gender === "other" ? (locale === "es" ? "Otro" : "Other") : "—"}</span>
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Height - editable */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/30">
            <span className="text-sm text-foreground">{locale === "es" ? "Altura" : "Height"}</span>
            {editingField === "height_cm" ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  type="number"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  className="w-16 h-7 px-2 rounded-lg bg-secondary border border-border/50 text-sm text-foreground text-right focus:border-primary focus:outline-none"
                  placeholder="170"
                />
                <span className="text-xs text-muted-foreground">cm</span>
                <button onClick={() => handleSaveField("height_cm", fieldValue)} className="text-primary"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditingField(null)} className="text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <button onClick={() => { setFieldValue(String(profile?.height_cm || "")); setEditingField("height_cm"); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <span>{profile?.height_cm ? `${profile.height_cm} cm` : "—"}</span>
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Weight - editable */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/30">
            <span className="text-sm text-foreground">{locale === "es" ? "Peso" : "Weight"}</span>
            {editingField === "weight_kg" ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  type="number"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  className="w-16 h-7 px-2 rounded-lg bg-secondary border border-border/50 text-sm text-foreground text-right focus:border-primary focus:outline-none"
                  placeholder="70"
                />
                <span className="text-xs text-muted-foreground">kg</span>
                <button onClick={() => handleSaveField("weight_kg", fieldValue)} className="text-primary"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditingField(null)} className="text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <button onClick={() => { setFieldValue(String(profile?.weight_kg || "")); setEditingField("weight_kg"); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <span>{profile?.weight_kg ? `${profile.weight_kg} kg` : "—"}</span>
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Read-only stats */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/30">
            <span className="text-sm text-foreground">{locale === "es" ? "Racha" : "Streak"}</span>
            <span className="text-sm text-muted-foreground">{profile?.streak_days || 0} {t.common.days}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/30">
            <span className="text-sm text-foreground">Workouts</span>
            <span className="text-sm text-muted-foreground">{workoutStats?.totalWorkouts || 0}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-foreground">{locale === "es" ? "Tiempo entrenado" : "Training time"}</span>
            <span className="text-sm text-muted-foreground">{hoursLabel}</span>
          </div>
        </div>

        {/* Training Info */}
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
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{locale === "es" ? "Horas entrenadas" : "Training hours"}</span>
              <span className="text-sm font-medium text-primary">{hoursLabel}</span>
            </div>
          </div>
        </div>

        {/* Pro Upsell for free users */}
        {!isPro && (
          <div className="mt-6">
            <ProUpsell message={locale === "es" ? "Avatar personalizado, días ilimitados y más" : "Custom avatar, unlimited days and more"} />
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
