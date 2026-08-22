import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Dumbbell, Globe } from "lucide-react";
import { useI18n } from "@/i18n";
import { SEO } from "@/components/SEO";

interface LegalLayoutProps {
  title: string;
  description: string;
  path: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalLayout({ title, description, path, lastUpdated, children }: LegalLayoutProps) {
  const navigate = useNavigate();
  const { locale, setLocale } = useI18n();
  const isEs = locale === "es";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title={`${title} — Vireon Fit`} description={description} path={path} />

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
            <span className="font-display font-black text-sm">
              VIREON <span className="text-primary">FIT</span>
            </span>
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
          {isEs ? "Legal" : "Legal"}
        </p>
        <h1 className="text-3xl md:text-4xl font-display font-black leading-tight mb-3">{title}</h1>
        <p className="text-sm text-muted-foreground mb-2">{description}</p>
        <p className="text-xs text-muted-foreground mb-10">
          {isEs ? "Última actualización" : "Last updated"}: {lastUpdated}
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:text-foreground [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-3 [&_strong]:text-foreground [&_a]:text-primary [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
          {children}
        </div>

        <nav className="mt-12 flex flex-wrap gap-3 text-xs">
          <Link to="/legal/terms" className="px-3 py-1.5 rounded-md bg-secondary hover:text-foreground text-muted-foreground">
            {isEs ? "Términos" : "Terms"}
          </Link>
          <Link to="/legal/privacy" className="px-3 py-1.5 rounded-md bg-secondary hover:text-foreground text-muted-foreground">
            {isEs ? "Privacidad" : "Privacy"}
          </Link>
          <Link to="/legal/cookies" className="px-3 py-1.5 rounded-md bg-secondary hover:text-foreground text-muted-foreground">
            Cookies
          </Link>
        </nav>
      </article>
    </div>
  );
}
