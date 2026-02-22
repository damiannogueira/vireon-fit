import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

interface LevelBadgeProps {
  level: number;
  className?: string;
}

export function LevelBadge({ level, className }: LevelBadgeProps) {
  return (
    <div className={cn(
      "relative inline-flex items-center justify-center w-14 h-14 rounded-2xl",
      "bg-gradient-to-br from-level to-level-glow",
      "shadow-[0_0_20px_hsl(270_70%_60%/0.4)]",
      className
    )}>
      <Zap className="absolute top-1 right-1 w-3 h-3 text-primary-foreground/60" />
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-medium text-primary-foreground/80 uppercase leading-none">LVL</span>
        <span className="text-xl font-black text-primary-foreground leading-none">{level}</span>
      </div>
    </div>
  );
}
