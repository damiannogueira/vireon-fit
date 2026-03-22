import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Crown, Sparkles, Zap, Gift, Users } from "lucide-react";
import { useI18n } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";

interface Plan {
  id: string;
  name: string;
  description: string;
  target: "individual";
  interval: string;
  price_usd: number;
  price_eur: number;
  features: string[];
  is_highlighted: boolean;
  trial_days: number;
  sort_order: number;
}

const Pricing = () => {
  const navigate = useNavigate();
  const { t, formatPrice, currency, setCurrency } = useI18n();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tab] = useState<"individual">("individual");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (data) {
        setPlans(data.map(p => ({
          ...p,
          features: (p.features as string[]) || [],
          target: p.target as "individual",
        })));
      }
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const filtered = plans.filter(p => p.target === tab);

  const intervalLabel = (interval: string) => {
    const map: Record<string, string> = {
      free: t.pricing.freeLabel,
      monthly: t.pricing.monthlyLabel,
      quarterly: t.pricing.quarterlyLabel,
      semi_annual: t.pricing.semiAnnualLabel,
      annual: t.pricing.annualLabel,
      trial: t.pricing.trialLabel,
    };
    return map[interval] || interval;
  };

  const intervalIcon = (interval: string) => {
    if (interval === "free" || interval === "trial") return <Gift className="w-5 h-5" />;
    if (interval === "annual") return <Crown className="w-5 h-5" />;
    return <Zap className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-display font-bold text-foreground">{t.pricing.title}</h1>
          <div className="ml-auto flex items-center gap-1 bg-secondary rounded-lg p-0.5">
            {(["USD", "EUR"] as const).map(c => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  currency === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c === "USD" ? "$ USD" : "€ EUR"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pt-6">
        {/* Subtitle */}
        <p className="text-muted-foreground text-sm text-center mb-6">{t.pricing.subtitle}</p>

        {/* Plans */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`relative rounded-2xl border p-5 transition-all ${
                  plan.is_highlighted
                    ? "border-primary bg-primary/5 shadow-[0_0_30px_hsl(var(--primary)/0.15)]"
                    : "border-border bg-card"
                }`}
              >
                {plan.is_highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                    {t.common.popular}
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${plan.is_highlighted ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                        {intervalIcon(plan.interval)}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-foreground">{plan.name}</h3>
                        <span className="text-xs text-muted-foreground">{intervalLabel(plan.interval)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-display font-black text-foreground">
                      {formatPrice(plan.price_usd, plan.price_eur)}
                    </span>
                    {plan.interval !== "free" && plan.interval !== "trial" && (
                      <p className="text-xs text-muted-foreground">
                        {plan.interval === "monthly" ? t.common.perMonth : `/ ${intervalLabel(plan.interval).toLowerCase()}`}
                      </p>
                    )}
                    {plan.trial_days > 0 && (
                      <p className="text-xs text-primary font-semibold">{plan.trial_days} {t.pricing.trialDays}</p>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-1.5 mb-4">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.is_highlighted ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-secondary-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate("/auth")}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
                    plan.is_highlighted
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow-primary)]"
                      : plan.interval === "free" || plan.interval === "trial"
                      ? "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {plan.interval === "free" ? t.common.getStarted : plan.interval === "trial" ? t.common.startTrial : t.common.subscribe}
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Promos section */}
        <div className="mt-8 space-y-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <h4 className="font-display font-bold text-foreground mb-2">{t.pricing.launchPromo}</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• {t.pricing.promoFirstMonth}</li>
              <li>• {t.pricing.promo3for2}</li>
            </ul>
          </motion.div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="font-display font-bold text-foreground mb-2">{t.pricing.familyPlan}</h4>
            <p className="text-sm text-muted-foreground">{t.pricing.familyDesc}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="font-display font-bold text-foreground mb-2">{t.pricing.addOns}</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• {t.pricing.addOnCoach}</li>
              <li>• {t.pricing.addOnNutrition}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
