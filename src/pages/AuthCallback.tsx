import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";

type Status = "loading" | "success" | "error";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.substring(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hash);
        const queryParams = url.searchParams;

        // 1) Error in URL (Supabase sends ?error=...&error_description=...)
        const urlError = queryParams.get("error_description") || hashParams.get("error_description");
        if (urlError) {
          setErrorMsg(decodeURIComponent(urlError.replace(/\+/g, " ")));
          setStatus("error");
          return;
        }

        // 2) PKCE flow: ?code=...
        const code = queryParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setErrorMsg(error.message);
            setStatus("error");
            return;
          }
          setStatus("success");
          setTimeout(() => navigate("/dashboard", { replace: true }), 1800);
          return;
        }

        // 3) Implicit flow: #access_token=...&refresh_token=...
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            setErrorMsg(error.message);
            setStatus("error");
            return;
          }
          setStatus("success");
          setTimeout(() => navigate("/dashboard", { replace: true }), 1800);
          return;
        }

        // 4) OTP token verification flow: ?token_hash=...&type=signup
        const tokenHash = queryParams.get("token_hash");
        const type = queryParams.get("type");
        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
          });
          if (error) {
            setErrorMsg(error.message);
            setStatus("error");
            return;
          }
          setStatus("success");
          setTimeout(() => navigate("/dashboard", { replace: true }), 1800);
          return;
        }

        // 5) Already logged in (session may have been set by detectSessionInUrl)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus("success");
          setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
          return;
        }

        setErrorMsg(locale === "es" ? "No se encontraron credenciales en el enlace." : "No credentials found in the link.");
        setStatus("error");
      } catch (err: any) {
        setErrorMsg(err?.message || (locale === "es" ? "Error inesperado" : "Unexpected error"));
        setStatus("error");
      }
    };

    handleCallback();
  }, [navigate, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center p-8 rounded-2xl bg-card border border-border/50"
      >
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-bold text-foreground mb-2">
              {locale === "es" ? "Verificando tu cuenta..." : "Verifying your account..."}
            </h1>
            <p className="text-sm text-muted-foreground">
              {locale === "es" ? "Esto solo tomará un momento." : "This will only take a moment."}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {locale === "es" ? "¡Email verificado!" : "Email verified!"}
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              {locale === "es"
                ? "Tu cuenta fue confirmada correctamente. Te estamos llevando al dashboard..."
                : "Your account was confirmed successfully. Taking you to the dashboard..."}
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {locale === "es" ? "No pudimos verificar tu cuenta" : "We couldn't verify your account"}
            </h1>
            <p className="text-sm text-muted-foreground mb-4 break-words">
              {errorMsg}
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              {locale === "es"
                ? "El enlace puede haber expirado o ya haberse usado. Probá iniciar sesión o solicitar un nuevo email."
                : "The link may have expired or already been used. Try signing in or requesting a new email."}
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {locale === "es" ? "Ir a iniciar sesión" : "Go to sign in"}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AuthCallback;
