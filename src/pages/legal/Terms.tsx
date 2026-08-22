import { useI18n } from "@/i18n";
import { LegalLayout } from "./LegalLayout";

const OWNER = "Damián Nogueira";
const COUNTRY = "Argentina";
const EMAIL = "damian.nogueira@outlook.com";
const LAST_UPDATED = "2026-06-28";

export default function Terms() {
  const { locale } = useI18n();
  const isEs = locale === "es";

  return (
    <LegalLayout
      title={isEs ? "Términos y Condiciones" : "Terms & Conditions"}
      description={
        isEs
          ? "Reglas de uso de Vireon Fit, planes de suscripción y limitaciones de responsabilidad."
          : "Rules of use for Vireon Fit, subscription plans and limitation of liability."
      }
      path="/legal/terms"
      lastUpdated={LAST_UPDATED}
    >
      {isEs ? (
        <>
          <p>
            Esta página describe los términos bajo los cuales <strong>{OWNER}</strong> ({COUNTRY}) opera la
            aplicación <strong>Vireon Fit</strong> (la "App"). Al crear una cuenta o usar la App, aceptás estos términos.
          </p>

          <h2>1. Sobre la App</h2>
          <p>
            Vireon Fit es una aplicación de fitness gamificada para uso individual (B2C). Genera rutinas, registra
            entrenamientos y entrega progreso en formato RPG (XP, niveles, logros). No es un servicio médico, no
            sustituye el consejo de un profesional de la salud, y no diagnostica ni trata condiciones médicas.
          </p>

          <h2>2. Cuenta y uso aceptable</h2>
          <ul>
            <li>Debés tener al menos 16 años para crear una cuenta.</li>
            <li>Sos responsable de mantener la confidencialidad de tu contraseña.</li>
            <li>No podés usar la App para actividades ilegales, ni intentar vulnerar su seguridad o la de otros usuarios.</li>
            <li>No podés revender, copiar ni redistribuir el contenido generado por la App sin autorización.</li>
          </ul>

          <h2>3. Salud y riesgo asumido</h2>
          <p>
            El ejercicio físico conlleva riesgos. Consultá a un profesional antes de empezar cualquier rutina, especialmente
            si tenés lesiones, condiciones cardiovasculares u otras restricciones médicas. Usás la App bajo tu propio riesgo.
          </p>

          <h2>4. Suscripciones y pagos</h2>
          <ul>
            <li>La App ofrece un plan gratuito con límites y planes pagos (mensual/anual).</li>
            <li>Los pagos se procesan a través de <strong>Stripe</strong>; aplican los términos de Stripe a la transacción.</li>
            <li>Podés cancelar tu suscripción en cualquier momento desde la App; mantenés acceso hasta el fin del período pagado.</li>
            <li>Los reembolsos se evalúan caso por caso, escribiendo a {EMAIL}.</li>
          </ul>

          <h2>5. Propiedad intelectual</h2>
          <p>
            El código, diseño, marca "Vireon Fit", logos y contenido editorial son propiedad del titular. Conservás los
            derechos sobre los datos que vos ingresás (logs, objetivos, etc.).
          </p>

          <h2>6. Limitación de responsabilidad</h2>
          <p>
            La App se entrega "tal cual", sin garantías de disponibilidad continua. En la máxima medida permitida por la
            ley aplicable, el titular no será responsable por daños indirectos, pérdida de datos o lesiones derivadas del
            ejercicio físico.
          </p>

          <h2>7. Cambios y terminación</h2>
          <p>
            Podemos actualizar estos términos; te avisaremos en la App. Podemos suspender cuentas que violen estas reglas.
            Vos podés borrar tu cuenta en cualquier momento desde tu perfil.
          </p>

          <h2>8. Contacto</h2>
          <p>
            Consultas legales: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. Jurisdicción: {COUNTRY}.
          </p>
        </>
      ) : (
        <>
          <p>
            This page describes the terms under which <strong>{OWNER}</strong> ({COUNTRY}) operates the
            <strong> Vireon Fit</strong> application (the "App"). By creating an account or using the App, you accept these terms.
          </p>

          <h2>1. About the App</h2>
          <p>
            Vireon Fit is a gamified fitness app for individual use (B2C). It generates routines, logs workouts and
            delivers progress in an RPG format (XP, levels, achievements). It is not a medical service, does not
            replace professional health advice, and does not diagnose or treat medical conditions.
          </p>

          <h2>2. Account and acceptable use</h2>
          <ul>
            <li>You must be at least 16 to create an account.</li>
            <li>You are responsible for keeping your password confidential.</li>
            <li>You may not use the App for illegal activities or attempt to compromise its security or that of other users.</li>
            <li>You may not resell, copy or redistribute App-generated content without authorization.</li>
          </ul>

          <h2>3. Health and assumed risk</h2>
          <p>
            Physical exercise carries risk. Consult a professional before starting any routine, especially if you have
            injuries, cardiovascular conditions or other medical restrictions. You use the App at your own risk.
          </p>

          <h2>4. Subscriptions and payments</h2>
          <ul>
            <li>The App offers a free tier with limits and paid plans (monthly/yearly).</li>
            <li>Payments are processed through <strong>Stripe</strong>; Stripe's terms apply to the transaction.</li>
            <li>You can cancel your subscription anytime from the App; access continues until the end of the paid period.</li>
            <li>Refunds are evaluated case by case at {EMAIL}.</li>
          </ul>

          <h2>5. Intellectual property</h2>
          <p>
            The code, design, "Vireon Fit" brand, logos and editorial content belong to the owner. You retain rights
            over the data you input (logs, goals, etc.).
          </p>

          <h2>6. Limitation of liability</h2>
          <p>
            The App is provided "as is", without warranty of continuous availability. To the maximum extent permitted by
            applicable law, the owner is not liable for indirect damages, data loss or injuries from physical exercise.
          </p>

          <h2>7. Changes and termination</h2>
          <p>
            We may update these terms; we'll notify you in the App. We may suspend accounts violating these rules. You
            may delete your account anytime from your profile.
          </p>

          <h2>8. Contact</h2>
          <p>
            Legal inquiries: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. Jurisdiction: {COUNTRY}.
          </p>
        </>
      )}
    </LegalLayout>
  );
}
