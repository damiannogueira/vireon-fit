import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Monitor, Smartphone, Tablet, CheckCircle2, Share } from "lucide-react";
import { motion } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>
      <div className="flex-1 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 text-center"
      >
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Download className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Instalá Vireon Fit
          </h1>
          <p className="text-muted-foreground">
            Instalá la app en tu dispositivo para acceso rápido, uso offline y la mejor experiencia.
          </p>
        </div>

        <div className="flex justify-center gap-6 text-muted-foreground">
          <div className="flex flex-col items-center gap-1.5">
            <Smartphone className="w-6 h-6" />
            <span className="text-xs">Celular</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Tablet className="w-6 h-6" />
            <span className="text-xs">Tablet</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Monitor className="w-6 h-6" />
            <span className="text-xs">PC</span>
          </div>
        </div>

        {isInstalled ? (
          <div className="glass rounded-xl p-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
            <p className="text-foreground font-medium">¡Ya tenés la app instalada!</p>
            <p className="text-sm text-muted-foreground">
              Abrila desde tu pantalla de inicio.
            </p>
          </div>
        ) : deferredPrompt ? (
          <Button
            size="lg"
            onClick={handleInstall}
            className="w-full text-lg py-6 font-semibold"
          >
            <Download className="w-5 h-5 mr-2" />
            Instalar ahora
          </Button>
        ) : isIOS ? (
          <div className="glass rounded-xl p-6 space-y-3 text-left">
            <p className="text-foreground font-medium text-center">Cómo instalar en iOS</p>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>Tocá el botón <Share className="w-4 h-4 inline" /> <strong className="text-foreground">Compartir</strong> en Safari</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>Seleccioná <strong className="text-foreground">"Agregar a pantalla de inicio"</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>Tocá <strong className="text-foreground">"Agregar"</strong></span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="glass rounded-xl p-6 space-y-3">
            <p className="text-foreground font-medium">Cómo instalar</p>
            <p className="text-sm text-muted-foreground">
              Abrí esta página en Chrome, Edge o Safari y usá la opción de instalar del navegador.
            </p>
          </div>
        )}

        <div className="space-y-2 text-xs text-muted-foreground">
          <p>✓ Sin app stores · ✓ Actualizaciones automáticas · ✓ Funciona offline</p>
        </div>
      </motion.div>
      </div>
    </div>
  );
};

export default Install;
