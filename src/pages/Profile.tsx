import { motion } from "framer-motion";
import { Settings, ChevronRight, Crown, Dumbbell, Globe, LogOut } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { LevelBadge } from "@/components/LevelBadge";
import { XPBar } from "@/components/XPBar";
import { useI18n } from "@/i18n";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const { t, locale, setLocale } = useI18n();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const configItems = [
    { label: t.profile.goal, value: t.profile.hypertrophy },
    { label: t.profile.level, value: t.profile.intermediate },
    { label: t.profile.daysPerWeek, value: t.profile.fiveDays },
    { label: t.profile.sessionDuration, value: t.profile.sixtyMin },
    { label: t.profile.equipment, value: t.profile.complete },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">{t.profile.title}</h1>
          <button className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 mb-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
            <span className="text-2xl">🦁</span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">Guerrero</h2>
            <p className="text-sm text-muted-foreground">guerrero@email.com</p>
          </div>
          <LevelBadge level={7} className="w-12 h-12" />
        </motion.div>

        {/* XP */}
        <div className="p-4 rounded-2xl bg-card border border-border/50 mb-6">
          <XPBar current={2450} max={3000} label={t.profile.levelTo.replace("{from}", "7").replace("{to}", "8")} variant="xp" />
          <p className="text-xs text-muted-foreground mt-2">{t.profile.totalXP}: 12,450</p>
        </div>

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
          {configItems.map((item, i) => (
            <button key={i} className="w-full flex items-center justify-between px-4 py-3.5 border-b border-border/30 last:border-0 hover:bg-secondary/30 transition-colors">
              <span className="text-sm text-foreground">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{item.value}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>

        {/* My Training Info */}
        <div className="mt-6 p-4 rounded-2xl bg-card border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">{t.profile.myRoutine}</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t.profile.split}</span>
              <span className="text-sm font-medium text-foreground">Push/Pull/Legs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t.profile.currentWeek}</span>
              <span className="text-sm font-medium text-foreground">{t.profile.week} 4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t.profile.progression}</span>
              <span className="text-sm font-medium text-xp">+2.5 kg/{locale === "es" ? "semana" : "week"}</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={async () => { await signOut(); navigate("/auth", { replace: true }); }}
          className="mt-6 w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive font-semibold hover:bg-destructive/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {locale === "es" ? "Cerrar sesión" : "Log out"}
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
