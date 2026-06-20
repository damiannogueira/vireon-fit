import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sanitizeAuthError } from "@/lib/auth-errors";
import { useI18n } from "@/i18n";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    } else {
      toast({ title: t.auth.invalidLink, description: t.auth.invalidLinkDesc, variant: "destructive" });
      navigate("/auth");
    }
  }, [navigate, toast, t]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: t.auth.error, description: t.auth.passwordsDontMatch, variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: t.auth.error, description: sanitizeAuthError(error), variant: "destructive" });
    } else {
      toast({ title: t.auth.passwordUpdated, description: t.auth.passwordUpdatedDesc });
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

      <h1 className="text-3xl font-display font-black text-foreground mb-1">{t.auth.newPasswordTitle}</h1>
      <p className="text-muted-foreground text-sm mb-8">{t.auth.newPasswordSubtitle}</p>

      <form onSubmit={handleReset} className="space-y-4">
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder={t.auth.newPasswordPlaceholder}
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
            placeholder={t.auth.confirmPasswordPlaceholder}
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
          {loading ? t.auth.updating : t.auth.updatePassword}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
