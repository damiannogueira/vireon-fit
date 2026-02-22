import { motion } from "framer-motion";
import { Settings, ChevronRight, Crown, Dumbbell } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { LevelBadge } from "@/components/LevelBadge";
import { XPBar } from "@/components/XPBar";

const Profile = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">Perfil</h1>
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
          <XPBar current={2450} max={3000} label="Nivel 7 → 8" variant="xp" />
          <p className="text-xs text-muted-foreground mt-2">XP total: 12,450</p>
        </div>

        {/* Plan */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-achievement/10 to-transparent border border-achievement/20 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-achievement" />
              <div>
                <h3 className="font-semibold text-foreground">Plan Free</h3>
                <p className="text-xs text-muted-foreground">Funciones básicas</p>
              </div>
            </div>
            <button className="px-4 py-2 rounded-xl bg-achievement text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              Upgrade Pro
            </button>
          </div>
        </div>

        {/* Config */}
        <h2 className="text-lg font-display font-bold text-foreground mb-3">Configuración</h2>
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
          {[
            { label: "Objetivo", value: "Hipertrofia" },
            { label: "Nivel", value: "Intermedio" },
            { label: "Días / semana", value: "5 días" },
            { label: "Duración sesión", value: "60 min" },
            { label: "Equipamiento", value: "Completo" },
          ].map((item, i) => (
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
            <h3 className="font-semibold text-foreground">Mi Rutina Actual</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Split</span>
              <span className="text-sm font-medium text-foreground">Push/Pull/Legs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Semana actual</span>
              <span className="text-sm font-medium text-foreground">Semana 4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Progresión</span>
              <span className="text-sm font-medium text-xp">+2.5 kg/semana</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
