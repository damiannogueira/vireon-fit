import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Dumbbell, Users } from "lucide-react";
import heroImage from "@/assets/hero-fitness.jpg";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-background">
      {/* Hero image */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="Fitness" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-12 pt-20">
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
            Entrena.<br />
            <span className="text-primary text-glow-primary">Sube de nivel.</span><br />
            Conquista.
          </h1>

          <p className="text-muted-foreground text-base leading-relaxed mb-10 max-w-xs">
            Rutinas personalizadas con gamificación RPG. Cada rep te acerca a tu mejor versión.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-3"
        >
          <button
            onClick={() => navigate("/onboarding")}
            className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-[0_0_30px_hsl(142_72%_50%/0.3)] hover:shadow-[0_0_40px_hsl(142_72%_50%/0.5)] transition-all duration-300 active:scale-[0.98]"
          >
            Comenzar Entrenamiento
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate("/gym")}
            className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-secondary border border-border text-secondary-foreground font-semibold text-base hover:bg-secondary/80 transition-all duration-200 active:scale-[0.98]"
          >
            <Users className="w-5 h-5" />
            Soy un Gimnasio
          </button>

          <button
            onClick={() => navigate("/auth")}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Ya tengo cuenta · Iniciar sesión
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
