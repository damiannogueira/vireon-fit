import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sanitizeAuthError } from "@/lib/auth-errors";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

type AuthMode = "login" | "signup" | "forgot";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Error al iniciar sesión", description: sanitizeAuthError(error), variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName },
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error al registrarse", description: sanitizeAuthError(error), variant: "destructive" });
    } else {
      toast({ title: "¡Cuenta creada!", description: "Revisa tu correo para confirmar tu cuenta." });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: sanitizeAuthError(error), variant: "destructive" });
    } else {
      toast({ title: "Correo enviado", description: "Revisa tu bandeja para restablecer tu contraseña." });
    }
  };

  const titles: Record<AuthMode, string> = {
    login: "Bienvenido de vuelta",
    signup: "Crea tu cuenta",
    forgot: "Recupera tu contraseña",
  };

  const subtitles: Record<AuthMode, string> = {
    login: "Inicia sesión para continuar tu entrenamiento",
    signup: "Empieza tu aventura fitness hoy",
    forgot: "Te enviaremos un enlace para restablecer tu contraseña",
  };

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-foreground">VIREON<span className="text-primary"> FIT</span></span>
        </div>
      </div>

      {/* Title */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-display font-black text-foreground mb-1">{titles[mode]}</h1>
          <p className="text-muted-foreground text-sm">{subtitles[mode]}</p>
        </motion.div>
      </AnimatePresence>

      {/* Form */}
      <form onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgotPassword} className="flex-1 flex flex-col">
        <div className="space-y-4 mb-6">
          {mode === "signup" && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Nombre"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-13 pl-11 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-13 pl-11 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              required
            />
          </div>

          {mode !== "forgot" && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-13 pl-11 pr-12 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {mode === "login" && (
          <button type="button" onClick={() => setMode("forgot")} className="text-sm text-primary hover:text-primary/80 mb-6 text-left transition-colors">
            ¿Olvidaste tu contraseña?
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-[var(--shadow-glow-primary)] hover:brightness-110 transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
        >
          {loading
            ? "Cargando..."
            : mode === "login"
            ? "Iniciar Sesión"
            : mode === "signup"
            ? "Crear Cuenta"
            : "Enviar enlace"}
        </button>

        <div className="mt-auto pt-8 text-center">
          {mode === "login" ? (
            <p className="text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <button type="button" onClick={() => setMode("signup")} className="text-primary font-semibold hover:text-primary/80 transition-colors">
                Regístrate
              </button>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <button type="button" onClick={() => setMode("login")} className="text-primary font-semibold hover:text-primary/80 transition-colors">
                Inicia sesión
              </button>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default Auth;
