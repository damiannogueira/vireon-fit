import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Users, Palette, UserPlus, ClipboardList, ChevronRight, Plus } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";

const GymDashboard = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "routines">("overview");

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-8">
        {/* Gym Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-energy to-energy-glow flex items-center justify-center shadow-[0_0_16px_hsl(195_90%_50%/0.3)]">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Iron Temple Gym</h1>
            <p className="text-sm text-muted-foreground">Panel de administración</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-secondary mb-6">
          {[
            { id: "overview" as const, label: "General" },
            { id: "members" as const, label: "Alumnos" },
            { id: "routines" as const, label: "Rutinas" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-card border border-border/50 text-center">
                <span className="text-2xl font-bold text-foreground">24</span>
                <p className="text-[10px] text-muted-foreground uppercase">Alumnos</p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/50 text-center">
                <span className="text-2xl font-bold text-foreground">3</span>
                <p className="text-[10px] text-muted-foreground uppercase">Coaches</p>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border/50 text-center">
                <span className="text-2xl font-bold text-foreground">12</span>
                <p className="text-[10px] text-muted-foreground uppercase">Rutinas</p>
              </div>
            </div>

            {/* Branding */}
            <div className="p-4 rounded-2xl bg-card border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-energy" />
                  <h3 className="font-semibold text-foreground text-sm">Branding</h3>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <span className="text-xs text-muted-foreground">Primario</span>
                  <div className="mt-1 h-8 rounded-lg bg-energy" />
                </div>
                <div className="flex-1">
                  <span className="text-xs text-muted-foreground">Secundario</span>
                  <div className="mt-1 h-8 rounded-lg bg-card border border-border" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground text-sm">Acciones rápidas</h3>
              {[
                { icon: UserPlus, label: "Invitar alumno", desc: "Enviar enlace de invitación" },
                { icon: ClipboardList, label: "Crear rutina", desc: "Nueva plantilla de entrenamiento" },
                { icon: Users, label: "Gestionar coaches", desc: "Roles y permisos" },
              ].map((action, i) => (
                <button key={i} className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-energy/30 transition-all text-left">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <action.icon className="w-5 h-5 text-energy" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">{action.label}</span>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "members" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <button className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border border-dashed border-border text-muted-foreground hover:border-energy/40 hover:text-energy transition-all">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Invitar alumno</span>
            </button>
            {["María García", "Carlos López", "Ana Martínez", "Pedro Ruiz", "Laura Sánchez"].map((name, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-sm font-bold text-foreground">
                  {name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{name}</span>
                  <p className="text-xs text-muted-foreground">Nivel {3 + i} · {20 + i * 5} entrenos</p>
                </div>
                <span className="text-xs text-xp font-semibold">Activo</span>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === "routines" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <button className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border border-dashed border-border text-muted-foreground hover:border-energy/40 hover:text-energy transition-all">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Crear plantilla</span>
            </button>
            {[
              { name: "Full Body Principiante", assigned: 8, days: 3 },
              { name: "Push/Pull/Legs", assigned: 12, days: 6 },
              { name: "Upper/Lower", assigned: 4, days: 4 },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-energy/10 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-energy" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{r.name}</span>
                  <p className="text-xs text-muted-foreground">{r.assigned} alumnos · {r.days} días/sem</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default GymDashboard;
