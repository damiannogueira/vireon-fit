import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Download, Dumbbell, Globe, CreditCard } from "lucide-react";
import { useI18n } from "@/i18n";
import { SEO } from "@/components/SEO";
import heroImage from "@/assets/hero-fitness.jpg";

const Landing = () => {
  const navigate = useNavigate();
  const { t, locale, setLocale } = useI18n();

  const seoTitle = locale === "es"
    ? "Vireon Fit — Entrenamiento gamificado estilo RPG"
    : "Vireon Fit — Gamified RPG-style training";
  const seoDesc = locale === "es"
    ? "App de fitness gamificada: rutinas personalizadas por IA, XP, niveles, logros y rachas. Entrená como en un RPG."
    : "Gamified fitness app: AI-personalized routines, XP, levels, achievements and streaks. Train like in an RPG.";

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-background">
      <SEO title={seoTitle} description={seoDesc} path="/" />
      {/* Hero image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt={locale === "es" ? "Atleta entrenando con energía en un gimnasio oscuro estilo RPG" : "Athlete training with energy in a dark RPG-style gym"}
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
      </div>

      {/* Language toggle */}
      <div className="relative z-20 flex justify-end p-4">
        <button
          onClick={() => setLocale(locale === "es" ? "en" : "es")}
          aria-label={locale === "es" ? "Cambiar idioma a inglés" : "Switch language to Spanish"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 backdrop-blur border border-border/50 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <Globe className="w-3.5 h-3.5" aria-hidden="true" />
          {locale === "es" ? "EN" : "ES"}
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_hsl(142_72%_50%/0.4)]">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-black tracking-tight text-foreground">
              VIREON<span className="text-primary"> FIT</span>
            </span>
          </div>

          <h1 className="text-4xl font-display font-black leading-[1.1] text-foreground mb-3">
            {t.landing.tagline1}<br />
            <span className="text-primary text-glow-primary">{t.landing.tagline2}</span><br />
            {t.landing.tagline3}
          </h1>

          <p className="text-muted-foreground text-base leading-relaxed mb-10 max-w-xs">
            {t.landing.subtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-3"
        >
          <button
            onClick={() => navigate("/auth")}
            className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-[0_0_30px_hsl(142_72%_50%/0.3)] hover:shadow-[0_0_40px_hsl(142_72%_50%/0.5)] transition-all duration-300 active:scale-[0.98]"
          >
            {t.landing.startTraining}
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate("/pricing")}
            className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-secondary border border-border text-secondary-foreground font-semibold text-base hover:bg-secondary/80 transition-all duration-200 active:scale-[0.98]"
          >
            <CreditCard className="w-5 h-5" />
            {t.landing.viewPricing}
          </button>

          <button
            onClick={() => navigate("/install")}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-muted border border-border/50 text-muted-foreground font-medium text-sm hover:text-foreground hover:bg-muted/80 transition-all duration-200 active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            {t.landing.installApp}
          </button>

          <div className="flex items-center justify-center gap-1.5 py-2">
            <button
              onClick={() => navigate("/auth?mode=signup")}
              className="text-sm text-primary font-semibold hover:text-primary/80 transition-colors"
            >
              {locale === "es" ? "Registrarse" : "Sign up"}
            </button>
            <span className="text-sm text-muted-foreground">·</span>
            <button
              onClick={() => navigate("/auth")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {locale === "es" ? "Ya tengo cuenta" : "I have an account"}
            </button>
          </div>

          <div className="flex justify-center pb-2">
            <button
              onClick={() => navigate("/blog/fitness-rpg-guide")}
              className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              {locale === "es" ? "Leé la guía: cómo entrenar como en un RPG" : "Read the guide: how to train like in an RPG"}
            </button>
          </div>

          <div className="flex justify-center items-center gap-3 pt-1 pb-2 text-[11px] text-muted-foreground">
            <button onClick={() => navigate("/legal/terms")} className="hover:text-foreground transition-colors">
              {locale === "es" ? "Términos" : "Terms"}
            </button>
            <span>·</span>
            <button onClick={() => navigate("/legal/privacy")} className="hover:text-foreground transition-colors">
              {locale === "es" ? "Privacidad" : "Privacy"}
            </button>
            <span>·</span>
            <button onClick={() => navigate("/legal/cookies")} className="hover:text-foreground transition-colors">
              Cookies
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
