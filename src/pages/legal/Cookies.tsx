import { useI18n } from "@/i18n";
import { LegalLayout } from "./LegalLayout";

const EMAIL = "damian.nogueira@outlook.com";
const LAST_UPDATED = "2026-06-28";

export default function Cookies() {
  const { locale } = useI18n();
  const isEs = locale === "es";

  return (
    <LegalLayout
      title={isEs ? "Política de Cookies" : "Cookie Policy"}
      description={
        isEs
          ? "Vireon Fit solo usa almacenamiento técnico necesario para que la App funcione. No usamos cookies publicitarias ni analytics de terceros."
          : "Vireon Fit only uses technical storage required for the App to work. We don't use advertising cookies or third-party analytics."
      }
      path="/legal/cookies"
      lastUpdated={LAST_UPDATED}
    >
      {isEs ? (
        <>
          <p>
            Vireon Fit es una aplicación web instalable (PWA) que usa almacenamiento del navegador exclusivamente para
            funciones esenciales. No usamos cookies de publicidad, no usamos analytics de terceros (Google Analytics,
            Meta Pixel, etc.) y no rastreamos tu navegación fuera de la App.
          </p>

          <h2>Qué guardamos en tu navegador</h2>
          <ul>
            <li>
              <strong>Sesión de autenticación</strong> (localStorage, clave <code>sb-*-auth-token</code>): para mantenerte
              logueado entre visitas. La gestiona nuestro proveedor de auth (Supabase).
            </li>
            <li>
              <strong>Preferencias de idioma</strong> (<code>vireon-locale</code>): recuerda si elegiste español o inglés.
            </li>
            <li>
              <strong>Preferencia de moneda</strong> (<code>vireon-currency</code>): USD o EUR para mostrar precios.
            </li>
            <li>
              <strong>Caché PWA</strong> (Service Worker): permite que la App funcione offline después de instalarla.
            </li>
          </ul>

          <h2>¿Necesito aceptar cookies?</h2>
          <p>
            No mostramos banner de cookies porque solo usamos almacenamiento técnico estrictamente necesario para que la
            App funcione, lo cual está exento de consentimiento bajo la mayoría de marcos de privacidad.
          </p>

          <h2>Cómo borrarlo</h2>
          <p>
            Podés borrar todo el almacenamiento desde tu navegador (Configuración → Privacidad → Borrar datos del sitio).
            Si lo hacés, vas a tener que loguearte de nuevo y la App perderá la caché offline.
          </p>

          <h2>Si esto cambia</h2>
          <p>
            Si en el futuro agregamos analytics o cookies opcionales, actualizaremos esta página y mostraremos un banner
            de consentimiento antes de activarlas. Consultas: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </p>
        </>
      ) : (
        <>
          <p>
            Vireon Fit is an installable web application (PWA) that uses browser storage exclusively for essential
            functions. We don't use advertising cookies, we don't use third-party analytics (Google Analytics, Meta
            Pixel, etc.) and we don't track your browsing outside the App.
          </p>

          <h2>What we store in your browser</h2>
          <ul>
            <li>
              <strong>Authentication session</strong> (localStorage, key <code>sb-*-auth-token</code>): to keep you logged
              in between visits. Managed by our auth provider (Supabase).
            </li>
            <li>
              <strong>Language preference</strong> (<code>vireon-locale</code>): remembers whether you chose Spanish or English.
            </li>
            <li>
              <strong>Currency preference</strong> (<code>vireon-currency</code>): USD or EUR to display prices.
            </li>
            <li>
              <strong>PWA cache</strong> (Service Worker): allows the App to work offline after installation.
            </li>
          </ul>

          <h2>Do I need to accept cookies?</h2>
          <p>
            We don't show a cookie banner because we only use strictly-necessary technical storage required for the App
            to work, which is exempt from consent under most privacy frameworks.
          </p>

          <h2>How to clear it</h2>
          <p>
            You can clear all storage from your browser (Settings → Privacy → Clear site data). If you do, you'll need
            to log in again and the App will lose its offline cache.
          </p>

          <h2>If this changes</h2>
          <p>
            If we add analytics or optional cookies in the future, we'll update this page and show a consent banner
            before activating them. Inquiries: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </p>
        </>
      )}
    </LegalLayout>
  );
}
