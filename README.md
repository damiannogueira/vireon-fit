# 🏋️ Vireon Fit

Vireon Fit es una **PWA gamificada de fitness B2C** que funciona como entrenador personal digital: genera rutinas inteligentes, registra tu progreso y te recompensa con XP, niveles y logros estilo RPG.

Producción: [vireonfitapp.com](https://vireonfitapp.com)

---

## 🚀 Visión

Convertir el progreso del entrenamiento en un viaje medible y motivador para usuarios individuales, con un coach virtual que adapta el plan semana a semana.

---

## 🧠 Funcionalidades del MVP

### Entrenamiento
- Generador de rutinas con IA según objetivo, nivel y disponibilidad.
- Registro de sets, reps y peso por ejercicio.
- Sobrecarga progresiva y ajuste semanal automático de dificultad.
- Catálogo de ejercicios con imágenes y descripciones en español/inglés.
- Rutinas completadas quedan bloqueadas (no se repiten).

### Gamificación
- Sistema XP/Nivel (500 XP por nivel, 10 XP por set).
- Logros automáticos vía triggers de base de datos.
- Racha diaria (`streak_days`) y desafíos semanales.

### Producto
- PWA instalable con soporte offline y página dedicada `/install`.
- Bilingüe ES/EN y multi-moneda USD/EUR (persistencia en navegador).
- Modelo **freemium** (Free / Pro mensual / Pro anual).
- Panel de **super-admin** en `/admin` para roles, planes y suscripciones.
- Notificaciones por email (Resend) para recordatorios de pago.

> ⚠️ **El modo Gym / multi-tenant fue removido.** La app es exclusivamente B2C individual. No quedan flujos de administración de gimnasios, asignación de rutinas a alumnos ni branding white-label.

---

## 🛠 Stack

- ⚛️ React 18 + TypeScript + Vite 5
- 🎨 TailwindCSS v3 + shadcn/ui + Framer Motion
- 🗄 Supabase (Auth + Postgres + RLS + Storage + Edge Functions)
- 🤖 Lovable AI Gateway (generación de rutinas e imágenes)
- 📧 Resend (emails transaccionales)
- 🧪 Vitest + Deno test (RLS / privilegios)
- 🌐 react-helmet-async + sitemap/robots/llms.txt para SEO

---

## 📦 Estructura

```
src/
├── components/        # UI, admin/, workout/, ui/ (shadcn)
├── pages/             # Landing, Auth, Dashboard, Workout, Pricing, Admin, ...
├── hooks/             # useSubscription, useUserRole, useSmartRoutineGenerator, ...
├── contexts/          # AuthContext
├── i18n/              # locales/es.ts, locales/en.ts, provider
├── integrations/      # supabase/client.ts + types.ts (auto-generado)
└── lib/

supabase/
├── functions/         # auth-email-hook, generate-smart-routine,
│                      # generate-exercise-image, update-exercise-descriptions,
│                      # weekly-adjustment, send-payment-reminder
└── migrations/        # Esquema, RLS y hardening
```

---

## 🔐 Seguridad

Postura actual tras la auditoría:

- **RLS habilitado** en todas las tablas `public`; GRANTs explícitos por rol.
- **Roles en tabla aparte** (`user_roles` + enum `app_role`); chequeo vía `has_role` / `is_super_admin` (`SECURITY DEFINER`).
- **Protección contra escalada de privilegios**: solo super-admins pueden asignar el rol `admin`; políticas de `INSERT/UPDATE/DELETE` en `user_roles` validadas.
- **`SECURITY DEFINER` endurecidos**: `EXECUTE` revocado de `PUBLIC`/`anon` (y de `authenticated` cuando no se usa desde el cliente) en helpers internos como `rls_auto_enable`, `is_super_admin`, `cancel_own_subscription`.
- **Edge Functions**:
  - `weekly-adjustment` y `update-exercise-descriptions` requieren header `x-cron-secret` validado contra `CRON_SECRET`.
  - `generate-exercise-image` verifica rol admin del invocador.
  - Errores sanitizados antes de devolverse al cliente.
- **Storage**: `exercise-images` y `gym-logos` son públicos a propósito (assets servidos vía CDN para la PWA); escrituras restringidas por políticas.
- **Auth**: cliente Supabase con `persistSession` + `autoRefreshToken`; redirect URLs corregidos para dominios `lovableproject.com` → `lovable.app`.
- **Test automatizado de privilegios**: `supabase/functions/_shared/security_definer_privileges_test.ts` previene "privilege drift" sobre funciones `SECURITY DEFINER`.
- **Dependencias**: `vite-plugin-pwa`, `react-router-dom`, `recharts` y `@supabase/supabase-js` actualizadas para cerrar ReDoS, prototype pollution, XSS y command injection transitivos.

### Limitación conocida

- **Leaked Password Protection** de Supabase Auth requiere plan Premium y no está habilitada en esta instancia externa.

Detalle vivo de la postura en `mem://security-memory` y migraciones bajo `supabase/migrations/`.

---

## 🌐 SEO y accesibilidad

- `sitemap.xml`, `robots.txt`, `llms.txt` y JSON-LD (`Organization`, `WebSite`, `Product` en `/pricing`).
- Metadata por ruta vía componente `SEO` (`react-helmet-async`).
- `google-site-verification` activa; sitemap enviado a Google Search Console.
- Mejoras de contraste y ARIA (toggle de idioma, notificaciones, bottom nav).

---

## 🧪 Scripts

```bash
npm run dev              # Vite dev server
npm run build            # Build de producción
npm run preview          # Servir build local
npm run test             # Vitest
npm run generate:sitemap # Regenerar public/sitemap.xml
```

Las Edge Functions se despliegan automáticamente al guardar (Lovable).

---

## 🗺 Roadmap próximo

- [ ] Guía editorial `/blog/fitness-rpg-guide` (ES/EN).
- [ ] QA end-to-end (Playwright) de signup, rutina, upgrade Pro y PWA install.
- [ ] Páginas legales `/terms`, `/privacy`, `/cookies` bilingües.
- [ ] OG images propias 1200×630 para Landing, Pricing y guía.
- [ ] Lighthouse final sobre producción.

---

## 👨‍💻 Autor

Construido por **Damián Nogueira** — building in public 🚀
