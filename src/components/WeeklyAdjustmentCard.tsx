import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeeklyAdjustment } from "@/hooks/useWeeklyAdjustment";

interface WeeklyAdjustmentCardProps {
  adjustment: WeeklyAdjustment;
  locale: string;
}

export function WeeklyAdjustmentCard({ adjustment, locale }: WeeklyAdjustmentCardProps) {
  const isIncrease = adjustment.adjustment_type === "increase";
  const isDecrease = adjustment.adjustment_type === "decrease";
  const isMaintain = adjustment.adjustment_type === "maintain";

  const Icon = isIncrease ? TrendingUp : isDecrease ? TrendingDown : Minus;
  
  const completionPct = Math.round(adjustment.completion_rate * 100);
  const consistencyPct = Math.round(adjustment.consistency_score * 100);

  const adjustLabel = isIncrease
    ? (locale === "es" ? "Subiendo intensidad" : "Increasing intensity")
    : isDecrease
    ? (locale === "es" ? "Ajustando carga" : "Adjusting load")
    : (locale === "es" ? "Manteniendo nivel" : "Maintaining level");

  const weekLabel = (() => {
    const d = new Date(adjustment.week_start + "T00:00:00");
    return d.toLocaleDateString(locale === "es" ? "es-AR" : "en-US", { day: "numeric", month: "short" });
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-2xl border",
        isIncrease && "bg-primary/5 border-primary/20",
        isDecrease && "bg-destructive/5 border-destructive/20",
        isMaintain && "bg-card border-border/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
          isIncrease && "bg-primary/15 text-primary",
          isDecrease && "bg-destructive/15 text-destructive",
          isMaintain && "bg-secondary text-muted-foreground"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {locale === "es" ? "Ajuste semanal" : "Weekly adjustment"}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">{weekLabel}</span>
          </div>
          
          <p className="text-sm font-semibold text-foreground mb-1">{adjustLabel}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{adjustment.message}</p>

          {/* Metrics */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex flex-col items-center">
              <span className={cn(
                "text-lg font-bold",
                completionPct >= 80 ? "text-primary" : completionPct >= 50 ? "text-foreground" : "text-destructive"
              )}>
                {completionPct}%
              </span>
              <span className="text-[10px] text-muted-foreground">
                {locale === "es" ? "Completado" : "Completed"}
              </span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col items-center">
              <span className={cn(
                "text-lg font-bold",
                consistencyPct >= 80 ? "text-primary" : "text-foreground"
              )}>
                {consistencyPct}%
              </span>
              <span className="text-[10px] text-muted-foreground">
                {locale === "es" ? "Consistencia" : "Consistency"}
              </span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col items-center">
              <span className={cn(
                "text-lg font-bold",
                isIncrease ? "text-primary" : isDecrease ? "text-destructive" : "text-foreground"
              )}>
                {adjustment.weight_multiplier > 1 ? "+" : ""}{Math.round((adjustment.weight_multiplier - 1) * 100)}%
              </span>
              <span className="text-[10px] text-muted-foreground">
                {locale === "es" ? "Peso" : "Weight"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
