import { useI18n } from "@/i18n";
import { LegalLayout } from "./LegalLayout";

const OWNER = "Damián Nogueira";
const COUNTRY = "Argentina";
const EMAIL = "damian.nogueira@outlook.com";
const LAST_UPDATED = "2026-06-28";

export default function Privacy() {
  const { locale } = useI18n();
  const isEs = locale === "es";

  return (
    <LegalLayout
      title={isEs ? "Política de Privacidad" : "Privacy Policy"}
      description={
        isEs
          ? "Qué datos recolecta Vireon Fit, con quién se comparten y cómo ejercés tus derechos."
          : "What data Vireon Fit collects, who it is shared with, and how you exercise your rights."
      }
      path="/legal/privacy"
      lastUpdated={LAST_UPDATED}
    >
      {isEs ? (
        <>
          <p>
            <strong>{OWNER}</strong> ({COUNTRY}) es el responsable del tratamiento de los datos personales de los
            usuarios de Vireon Fit. Esta página explica qué datos manejamos y cómo.
          </p>

          <h2>1. Datos que recolectamos</h2>
          <ul>
            <li><strong>Cuenta:</strong> email, nombre opcional, contraseña (hasheada por nuestro proveedor de auth).</li>
            <li><strong>Perfil deportivo:</strong> objetivo, nivel físico, fecha de nacimiento (para cálculo de edad y rangos).</li>
            <li><strong>Actividad:</strong> rutinas generadas, logs de entrenamiento, XP, logros, rachas.</li>
            <li><strong>Suscripción:</strong> estado del plan e identificadores del procesador de pagos (no almacenamos números de tarjeta).</li>
            <li><strong>Técnicos:</strong> idioma, moneda y preferencias guardadas localmente; logs de errores anónimos.</li>
          </ul>

          <h2>2. Para qué los usamos</h2>
          <ul>
            <li>Operar la App: generar rutinas personalizadas, registrar progreso y mostrar tu nivel.</li>
            <li>Procesar tu suscripción y notificaciones de pago.</li>
            <li>Enviar emails transaccionales (confirmación, recuperación de contraseña, recordatorios de pago).</li>
            <li>Mejorar la App de forma agregada y anónima.</li>
          </ul>
          <p>No vendemos datos personales. No los usamos para publicidad de terceros.</p>

          <h2>3. Con quién los compartimos (subprocesadores)</h2>
          <ul>
            <li>
              <strong>Supabase</strong> — backend, base de datos y autenticación. Aloja tu cuenta y tus logs.
            </li>
            <li>
              <strong>Stripe</strong> — procesador de pagos. Recibe tu email y datos de tarjeta directamente (no pasan por nuestros servidores).
            </li>
            <li>
              <strong>Resend</strong> — envío de emails transaccionales. Recibe tu email y el contenido del mensaje.
            </li>
          </ul>
          <p>
            Estos proveedores procesan los datos solo para prestar su servicio y bajo sus propias políticas. No usamos
            Google Analytics ni píxeles de seguimiento de terceros.
          </p>

          <h2>4. Conservación</h2>
          <p>
            Mantenemos tus datos mientras tu cuenta esté activa. Si borrás la cuenta, eliminamos tu perfil y logs en un
            plazo razonable (excepto registros mínimos requeridos por motivos legales o fiscales).
          </p>

          <h2>5. Tus derechos</h2>
          <p>
            Podés acceder, corregir, exportar o borrar tus datos en cualquier momento escribiendo a{" "}
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. También podés borrar tu cuenta directamente desde tu perfil en la App.
          </p>

          <h2>6. Seguridad</h2>
          <p>
            Aplicamos controles de acceso por usuario (Row Level Security) en la base de datos, conexiones cifradas
            (HTTPS/TLS) y separación de roles administrativos. Ningún sistema es 100% seguro: te pedimos usar una
            contraseña fuerte y única.
          </p>

          <h2>7. Menores</h2>
          <p>La App no está dirigida a menores de 16 años.</p>

          <h2>8. Cambios</h2>
          <p>
            Podemos actualizar esta política; la fecha arriba refleja la última versión. Cambios materiales se notifican
            dentro de la App.
          </p>

          <h2>9. Contacto</h2>
          <p>
            Consultas de privacidad: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </p>
        </>
      ) : (
        <>
          <p>
            <strong>{OWNER}</strong> ({COUNTRY}) is the data controller for Vireon Fit users. This page explains what
            data we handle and how.
          </p>

          <h2>1. Data we collect</h2>
          <ul>
            <li><strong>Account:</strong> email, optional name, password (hashed by our auth provider).</li>
            <li><strong>Fitness profile:</strong> goal, physical level, date of birth (used for age and range calculations).</li>
            <li><strong>Activity:</strong> generated routines, workout logs, XP, achievements, streaks.</li>
            <li><strong>Subscription:</strong> plan status and payment-processor identifiers (we don't store card numbers).</li>
            <li><strong>Technical:</strong> language, currency and preferences saved locally; anonymous error logs.</li>
          </ul>

          <h2>2. How we use it</h2>
          <ul>
            <li>Operate the App: generate personalized routines, log progress and display your level.</li>
            <li>Process your subscription and payment notifications.</li>
            <li>Send transactional emails (confirmation, password recovery, payment reminders).</li>
            <li>Improve the App in an aggregated, anonymous way.</li>
          </ul>
          <p>We don't sell personal data. We don't use it for third-party advertising.</p>

          <h2>3. Who we share it with (subprocessors)</h2>
          <ul>
            <li><strong>Supabase</strong> — backend, database and authentication. Hosts your account and logs.</li>
            <li><strong>Stripe</strong> — payment processor. Receives your email and card data directly (it does not pass through our servers).</li>
            <li><strong>Resend</strong> — transactional email delivery. Receives your email and message content.</li>
          </ul>
          <p>
            These providers process data only to deliver their service, under their own policies. We don't use Google
            Analytics or third-party tracking pixels.
          </p>

          <h2>4. Retention</h2>
          <p>
            We keep your data while your account is active. If you delete your account, we remove your profile and logs
            within a reasonable timeframe (except minimal records required for legal or tax reasons).
          </p>

          <h2>5. Your rights</h2>
          <p>
            You can access, correct, export or delete your data anytime by writing to{" "}
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. You can also delete your account directly from your profile in the App.
          </p>

          <h2>6. Security</h2>
          <p>
            We apply per-user access controls (Row Level Security) in the database, encrypted connections (HTTPS/TLS)
            and separation of admin roles. No system is 100% secure: please use a strong, unique password.
          </p>

          <h2>7. Minors</h2>
          <p>The App is not intended for children under 16.</p>

          <h2>8. Changes</h2>
          <p>
            We may update this policy; the date above reflects the latest version. Material changes are notified inside the App.
          </p>

          <h2>9. Contact</h2>
          <p>
            Privacy inquiries: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </p>
        </>
      )}
    </LegalLayout>
  );
}
