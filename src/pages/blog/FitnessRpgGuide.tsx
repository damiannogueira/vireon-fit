import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Dumbbell, Globe, Sparkles, Trophy, Flame, Target } from "lucide-react";
import { useI18n } from "@/i18n";
import { SEO } from "@/components/SEO";

const FitnessRpgGuide = () => {
  const navigate = useNavigate();
  const { locale, setLocale } = useI18n();
  const isEs = locale === "es";

  const title = isEs
    ? "Guía Fitness RPG: cómo convertir tu entrenamiento en un juego que sí terminás"
    : "Fitness RPG Guide: turn your training into a game you actually finish";
  const description = isEs
    ? "Cómo la gamificación (XP, niveles, rachas y logros) sostiene la motivación a largo plazo y cómo aplicarla con Vireon Fit."
    : "How gamification (XP, levels, streaks and achievements) sustains long-term motivation, and how to apply it with Vireon Fit.";
  const path = "/blog/fitness-rpg-guide";
  const url = `https://vireonfitapp.com${path}`;
  const datePublished = "2026-06-27";

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    inLanguage: isEs ? "es" : "en",
    datePublished,
    dateModified: datePublished,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: "Vireon Fit" },
    publisher: {
      "@type": "Organization",
      name: "Vireon Fit",
      url: "https://vireonfitapp.com",
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: isEs ? "Inicio" : "Home", item: "https://vireonfitapp.com/" },
      { "@type": "ListItem", position: 2, name: isEs ? "Guía Fitness RPG" : "Fitness RPG Guide", item: url },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title={title} description={description} path={path} type="article" jsonLd={[articleLd, breadcrumbLd]} />

      <header className="sticky top-0 z-20 backdrop-blur bg-background/80 border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            aria-label={isEs ? "Volver" : "Back"}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> {isEs ? "Volver" : "Back"}
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-black text-sm">VIREON <span className="text-primary">FIT</span></span>
          </Link>
          <button
            onClick={() => setLocale(isEs ? "en" : "es")}
            aria-label={isEs ? "Switch to English" : "Cambiar a español"}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <Globe className="w-3.5 h-3.5" /> {isEs ? "EN" : "ES"}
          </button>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-5 py-10">
        <p className="text-xs uppercase tracking-widest text-primary font-bold mb-3">
          {isEs ? "Guía" : "Guide"} · {isEs ? "Lectura 6 min" : "6 min read"}
        </p>
        <h1 className="text-3xl md:text-4xl font-display font-black leading-tight mb-4">{title}</h1>
        <p className="text-lg text-muted-foreground mb-10">{description}</p>

        {isEs ? <SpanishBody /> : <EnglishBody />}

        <div className="mt-12 p-6 rounded-2xl bg-secondary/50 border border-border">
          <h2 className="text-xl font-display font-bold mb-2">
            {isEs ? "Empezá tu run hoy" : "Start your run today"}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {isEs
              ? "Creá tu personaje en Vireon Fit, dejá que la IA genere tu primera rutina y subí de nivel set a set."
              : "Create your character on Vireon Fit, let the AI generate your first routine, and level up set by set."}
          </p>
          <div className="flex gap-2 flex-wrap">
            <Link to="/auth?mode=signup" className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
              {isEs ? "Crear cuenta gratis" : "Create free account"}
            </Link>
            <Link to="/pricing" className="px-4 py-2.5 rounded-xl bg-secondary border border-border font-semibold text-sm">
              {isEs ? "Ver planes" : "See plans"}
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
};

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <section className="mt-10">
    <h2 className="flex items-center gap-2 text-2xl font-display font-bold mb-3">
      <Icon className="w-5 h-5 text-primary" aria-hidden="true" /> {title}
    </h2>
    <div className="space-y-4 text-base leading-relaxed text-muted-foreground">{children}</div>
  </section>
);

const SpanishBody = () => (
  <>
    <Section icon={Sparkles} title="Por qué el fitness gamificado funciona">
      <p>
        El 80% de las rutinas se abandonan antes del tercer mes. No por falta de plan, sino por falta de
        feedback inmediato. Tu cerebro necesita pequeñas victorias visibles cada sesión — y eso es exactamente lo
        que un sistema RPG entrega: XP por set, barra de nivel que sube, logros que aparecen, racha que no querés romper.
      </p>
      <p>
        Vireon Fit toma esa mecánica probada en videojuegos y la aplica a tu entrenamiento real, sin convertirlo en un
        juguete: los pesos, las repeticiones y la progresión siguen siendo serios; lo que cambia es cómo los percibís.
      </p>
    </Section>

    <Section icon={Target} title="Los cuatro pilares del sistema">
      <ul className="list-disc pl-6 space-y-2">
        <li><strong className="text-foreground">XP por esfuerzo:</strong> 10 XP por set completado. Cada serie cuenta.</li>
        <li><strong className="text-foreground">Niveles:</strong> 500 XP por nivel. Subir es un hito visible.</li>
        <li><strong className="text-foreground">Logros:</strong> se desbloquean automáticamente al cumplir hitos (primer entrenamiento, primera semana completa, primer mes, etc.).</li>
        <li><strong className="text-foreground">Racha diaria:</strong> días seguidos entrenando. Romperla duele, mantenerla engancha.</li>
      </ul>
    </Section>

    <Section icon={Flame} title="Cómo construir una racha que aguante">
      <p>
        La racha no se trata de entrenar todos los días al máximo. Se trata de aparecer. Definí un mínimo viable
        (por ejemplo, 3 sesiones por semana) y dejá que la IA ajuste el volumen semana a semana según tu tasa de finalización.
        Si fallás, no reinicies tu plan: retomá donde quedaste.
      </p>
    </Section>

    <Section icon={Trophy} title="De principiante a nivel 20 en 12 semanas">
      <p>
        Plan realista: 4 sesiones/semana × 6 ejercicios × 4 sets ≈ 960 XP/semana ≈ casi 2 niveles. En 12 semanas estás cerca del
        nivel 20, con sobrecarga progresiva aplicada automáticamente y al menos 8 logros desbloqueados.
      </p>
      <p>
        Lo importante: a esa altura ya no entrenás "porque toca". Entrenás porque querés ver el próximo nivel.
      </p>
    </Section>

    <Section icon={Sparkles} title="Empezá bien">
      <ol className="list-decimal pl-6 space-y-2">
        <li>Completá el onboarding con tu objetivo real (fuerza, hipertrofia, resistencia, pérdida de grasa).</li>
        <li>Dejá que la IA arme tu primera rutina y no la cambies en las primeras dos semanas.</li>
        <li>Registrá todos los sets — el XP solo cuenta lo registrado.</li>
        <li>Revisá tu progreso semanal y dejá que el ajuste automático mueva la dificultad.</li>
      </ol>
    </Section>
  </>
);

const EnglishBody = () => (
  <>
    <Section icon={Sparkles} title="Why gamified fitness works">
      <p>
        80% of training plans get abandoned before month three. Not because the plan was bad — because there's no
        immediate feedback. Your brain needs small, visible wins every session, and that's exactly what an RPG system
        delivers: XP per set, a level bar that fills up, achievements popping in, a streak you don't want to break.
      </p>
      <p>
        Vireon Fit takes that proven game-loop and applies it to real training without turning it into a toy: weights,
        reps and progression stay serious — only how you experience them changes.
      </p>
    </Section>

    <Section icon={Target} title="The four pillars of the system">
      <ul className="list-disc pl-6 space-y-2">
        <li><strong className="text-foreground">XP per effort:</strong> 10 XP per completed set. Every set counts.</li>
        <li><strong className="text-foreground">Levels:</strong> 500 XP per level. Leveling up is a visible milestone.</li>
        <li><strong className="text-foreground">Achievements:</strong> auto-unlocked when you hit milestones (first workout, first full week, first month, etc.).</li>
        <li><strong className="text-foreground">Daily streak:</strong> consecutive training days. Breaking it stings, keeping it hooks you.</li>
      </ul>
    </Section>

    <Section icon={Flame} title="How to build a streak that lasts">
      <p>
        Streaks aren't about training all-out every day. They're about showing up. Set a minimum viable cadence
        (e.g. 3 sessions/week) and let the AI adjust weekly volume based on your completion rate. If you miss a day,
        don't restart your plan — pick up where you left off.
      </p>
    </Section>

    <Section icon={Trophy} title="From beginner to level 20 in 12 weeks">
      <p>
        Realistic plan: 4 sessions/week × 6 exercises × 4 sets ≈ 960 XP/week ≈ nearly 2 levels. In 12 weeks you'll be
        close to level 20, with progressive overload applied automatically and at least 8 achievements unlocked.
      </p>
      <p>
        The real shift: by then you don't train "because you have to". You train because you want to see the next level.
      </p>
    </Section>

    <Section icon={Sparkles} title="Get started right">
      <ol className="list-decimal pl-6 space-y-2">
        <li>Complete onboarding with your real goal (strength, hypertrophy, endurance, fat loss).</li>
        <li>Let the AI build your first routine and don't change it for two weeks.</li>
        <li>Log every set — only logged work earns XP.</li>
        <li>Check your weekly progress and let the auto-adjustment move difficulty.</li>
      </ol>
    </Section>
  </>
);

export default FitnessRpgGuide;
