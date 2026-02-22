import { cn } from "@/lib/utils";
import { TrendingUp, Flame, Target, Clock } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: "streak" | "workouts" | "weight" | "time";
  className?: string;
}

const iconMap = {
  streak: Flame,
  workouts: Target,
  weight: TrendingUp,
  time: Clock,
};

const colorMap = {
  streak: "text-achievement",
  workouts: "text-primary",
  weight: "text-energy",
  time: "text-level",
};

export function StatCard({ label, value, icon, className }: StatCardProps) {
  const Icon = iconMap[icon];

  return (
    <div className={cn(
      "flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 border border-border/30",
      className
    )}>
      <Icon className={cn("w-5 h-5", colorMap[icon])} />
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}
