import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface AchievementBadgeProps {
  icon: LucideIcon;
  title: string;
  unlocked: boolean;
  className?: string;
}

export function AchievementBadge({ icon: Icon, title, unlocked, className }: AchievementBadgeProps) {
  return (
    <div className={cn(
      "flex flex-col items-center gap-2 p-3",
      className
    )}>
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
        unlocked
          ? "bg-gradient-to-br from-achievement to-achievement-glow shadow-[0_0_16px_hsl(32_95%_55%/0.4)]"
          : "bg-secondary/50 border border-border/50"
      )}>
        {unlocked ? (
          <Icon className="w-7 h-7 text-primary-foreground" />
        ) : (
          <Lock className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      <span className={cn(
        "text-[10px] font-medium text-center leading-tight max-w-[60px]",
        unlocked ? "text-foreground" : "text-muted-foreground"
      )}>
        {title}
      </span>
    </div>
  );
}
