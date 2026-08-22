import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RestTimerProps {
  seconds: number;
  locale: "es" | "en";
  onComplete: () => void;
  onSkip: () => void;
}

export const RestTimer = ({ seconds, locale, onComplete, onSkip }: RestTimerProps) => {
  const [remaining, setRemaining] = useState(seconds);
  const bellPlayed = useRef(false);

  const playBell = useCallback(() => {
    if (bellPlayed.current) return;
    bellPlayed.current = true;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // Audio not supported
    }
  }, []);

  useEffect(() => {
    if (remaining <= 0) {
      playBell();
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }
    const interval = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(interval);
  }, [remaining, onComplete, playBell]);

  const progress = 1 - remaining / seconds;
  const circumference = 2 * Math.PI * 54;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <Timer className="w-4 h-4" />
          <span>{locale === "es" ? "DESCANSO" : "REST"}</span>
        </div>

        {/* Circular progress */}
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth="6"
            />
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              "text-4xl font-display font-bold tabular-nums",
              remaining <= 5 ? "text-destructive" : "text-foreground"
            )}>
              {remaining}
            </span>
          </div>
        </div>

        <p className="text-muted-foreground text-sm">
          {remaining <= 0
            ? locale === "es" ? "¡Vamos! 💪" : "Let's go! 💪"
            : locale === "es" ? "Respirá y preparate" : "Breathe and get ready"}
        </p>

        <button
          onClick={onSkip}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-all"
        >
          <X className="w-4 h-4" />
          {locale === "es" ? "Saltar descanso" : "Skip rest"}
        </button>
      </div>
    </motion.div>
  );
};
