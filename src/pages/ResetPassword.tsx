import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sanitizeAuthError } from "@/lib/auth-errors";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    } else {
      toast({ title: "Enlace inválido", description: "Este enlace de recuperación no es válido.", variant: "destructive" });
      navigate("/auth");
    }
  }, [navigate, toast]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: sanitizeAuthError(error), variant: "destructive" });
    } else {
      toast({ title: "¡Contraseña actualizada!", description: "Ya puedes iniciar sesión con tu nueva contraseña." });
      navigate("/dashboard");
    }
  };

  if (!isRecovery) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 py-8">
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Dumbbell className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-foreground">VIREON<span className="text-primary"> FIT</span></span>
      </div>

      <h1 className="text-3xl font-display font-black text-foreground mb-1">Nueva contraseña</h1>
      <p className="text-muted-foreground text-sm mb-8">Ingresa tu nueva contraseña para continuar.</p>

      <form onSubmit={handleReset} className="space-y-4">
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-13 pl-11 pr-12 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            required
            minLength={6}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full h-13 pl-11 pr-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-[var(--shadow-glow-primary)] hover:brightness-110 transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Actualizando..." : "Actualizar Contraseña"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
