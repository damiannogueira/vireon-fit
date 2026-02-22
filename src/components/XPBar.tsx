import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const xpBarVariants = cva("h-full rounded-full transition-all duration-1000 ease-out", {
  variants: {
    variant: {
      xp: "bg-gradient-to-r from-xp to-xp-glow",
      achievement: "bg-gradient-to-r from-achievement to-achievement-glow",
      level: "bg-gradient-to-r from-level to-level-glow",
      energy: "bg-gradient-to-r from-energy to-energy-glow",
    },
    size: {
      sm: "h-1.5",
      md: "h-2.5",
      lg: "h-4",
    },
  },
  defaultVariants: {
    variant: "xp",
    size: "md",
  },
});

interface XPBarProps extends VariantProps<typeof xpBarVariants> {
  current: number;
  max: number;
  label?: string;
  showValues?: boolean;
  className?: string;
}

export function XPBar({ current, max, variant, size, label, showValues = true, className }: XPBarProps) {
  const percentage = Math.min((current / max) * 100, 100);

  return (
    <div className={cn("w-full", className)}>
      {(label || showValues) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>}
          {showValues && <span className="text-xs font-medium text-foreground">{current}/{max}</span>}
        </div>
      )}
      <div className={cn("w-full rounded-full bg-secondary overflow-hidden", size === "sm" ? "h-1.5" : size === "lg" ? "h-4" : "h-2.5")}>
        <div
          className={cn(xpBarVariants({ variant }), "rounded-full")}
          style={{ width: `${percentage}%`, height: "100%" }}
        />
      </div>
    </div>
  );
}
