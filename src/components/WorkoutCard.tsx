import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface WorkoutCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  xp: number;
  duration: string;
  exercises: number;
  variant?: "default" | "active" | "completed";
  onClick?: () => void;
  className?: string;
}

export function WorkoutCard({
  title,
  subtitle,
  icon: Icon,
  xp,
  duration,
  exercises,
  variant = "default",
  onClick,
  className,
}: WorkoutCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-2xl transition-all duration-200 group",
        "border",
        variant === "active"
          ? "bg-primary/10 border-primary/30 shadow-[0_0_24px_hsl(142_72%_50%/0.15)]"
          : variant === "completed"
          ? "bg-secondary/50 border-border/30 opacity-70"
          : "bg-card border-border/50 hover:border-primary/30 hover:shadow-[0_0_20px_hsl(142_72%_50%/0.1)]",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
          variant === "active"
            ? "bg-primary/20 text-primary"
            : variant === "completed"
            ? "bg-secondary text-muted-foreground"
            : "bg-secondary text-foreground group-hover:bg-primary/15 group-hover:text-primary"
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-xp font-semibold">+{xp} XP</span>
            <span className="text-xs text-muted-foreground">{duration}</span>
            <span className="text-xs text-muted-foreground">{exercises} {localStorage.getItem("vireon-locale") === "en" ? "exercises" : "ejercicios"}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
