import { Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/i18n";

interface ProUpsellProps {
  message?: string;
  compact?: boolean;
}

export function ProUpsell({ message, compact = false }: ProUpsellProps) {
  const navigate = useNavigate();
  const { locale } = useI18n();

  const defaultMsg = locale === "es"
    ? "Desbloqueá entrenamientos ilimitados y más con Pro"
    : "Unlock unlimited workouts and more with Pro";

  if (compact) {
    return (
      <button
        onClick={() => navigate("/pricing")}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-achievement/10 border border-achievement/20 text-xs text-achievement font-semibold hover:bg-achievement/20 transition-colors"
      >
        <Crown className="w-3.5 h-3.5" />
        {locale === "es" ? "Pasate a Pro" : "Go Pro"}
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate("/pricing")}
      className="w-full p-4 rounded-2xl bg-gradient-to-r from-achievement/10 to-achievement/5 border border-achievement/20 text-left hover:from-achievement/15 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-achievement/20 flex items-center justify-center">
          <Crown className="w-5 h-5 text-achievement" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-foreground">
            {locale === "es" ? "🚀 Pasate a Pro" : "🚀 Go Pro"}
          </h4>
          <p className="text-xs text-muted-foreground">{message || defaultMsg}</p>
        </div>
      </div>
    </button>
  );
}
