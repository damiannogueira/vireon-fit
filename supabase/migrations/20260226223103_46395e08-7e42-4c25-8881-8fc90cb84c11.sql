
-- Enum for subscription intervals
CREATE TYPE public.subscription_interval AS ENUM ('free', 'monthly', 'quarterly', 'semi_annual', 'annual', 'trial');

-- Enum for subscription target
CREATE TYPE public.subscription_target AS ENUM ('individual', 'gym');

-- Enum for subscription status
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled', 'trial');

-- Subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  target subscription_target NOT NULL,
  interval subscription_interval NOT NULL,
  price_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_eur NUMERIC(10,2) NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  is_highlighted BOOLEAN DEFAULT false,
  trial_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  gym_id UUID REFERENCES public.gyms(id),
  status subscription_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Plans are viewable by everyone
CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans FOR SELECT
USING (is_active = true);

-- Only admins can manage plans
CREATE POLICY "Admins can insert plans"
ON public.subscription_plans FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Admins can update plans"
ON public.subscription_plans FOR UPDATE
USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can delete plans"
ON public.subscription_plans FOR DELETE
USING (is_super_admin(auth.uid()));

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.user_subscriptions FOR SELECT
USING (user_id = auth.uid() OR is_super_admin(auth.uid()));

-- Users can subscribe
CREATE POLICY "Users can create own subscriptions"
ON public.user_subscriptions FOR INSERT
WITH CHECK (user_id = auth.uid() OR is_super_admin(auth.uid()));

-- Users can update own subscriptions (cancel)
CREATE POLICY "Users can update own subscriptions"
ON public.user_subscriptions FOR UPDATE
USING (user_id = auth.uid() OR is_super_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed subscription plans
-- Individual Free
INSERT INTO public.subscription_plans (name, description, target, interval, price_usd, price_eur, features, sort_order, is_highlighted, trial_days) VALUES
('Free', 'Acceso básico limitado', 'individual', 'free', 0, 0, '["Rutinas básicas", "Acceso limitado a métricas", "Seguimiento básico de progreso"]', 0, false, 0),
('Mensual', 'Plan mensual individual', 'individual', 'monthly', 8.00, 7.50, '["Historial completo de progreso", "Retos semanales", "Estadísticas avanzadas", "Integración con comunidad", "Soporte prioritario"]', 1, false, 0),
('Trimestral', 'Plan trimestral individual', 'individual', 'quarterly', 20.00, 18.50, '["Historial completo de progreso", "Retos semanales", "Estadísticas avanzadas", "Integración con comunidad", "Soporte prioritario", "Ahorro del 17%"]', 2, true, 0),
('Semestral', 'Plan semestral individual', 'individual', 'semi_annual', 36.00, 33.50, '["Historial completo de progreso", "Retos semanales", "Estadísticas avanzadas", "Integración con comunidad", "Soporte prioritario", "Ahorro del 25%"]', 3, false, 0),
('Anual', 'Plan anual individual', 'individual', 'annual', 60.00, 55.50, '["Historial completo de progreso", "Retos semanales", "Estadísticas avanzadas", "Integración con comunidad", "Soporte prioritario", "Ahorro del 38%"]', 4, false, 0),
-- Gym plans
('Trial Gimnasio', 'Prueba gratuita para gimnasios', 'gym', 'trial', 0, 0, '["Acceso completo por 14 días", "Demo de dashboard administrador", "Gestión de miembros", "Estadísticas de uso"]', 10, false, 14),
('Semestral Gimnasio', 'Plan semestral para gimnasios', 'gym', 'semi_annual', 150.00, 139.00, '["Gestión de miembros", "Estadísticas de uso y retención", "Pagos mensuales automáticos", "Integración con sistema de cobros", "Soporte dedicado", "Personalización white-label"]', 11, true, 0),
('Anual Gimnasio', 'Plan anual para gimnasios', 'gym', 'annual', 260.00, 241.00, '["Gestión de miembros", "Estadísticas de uso y retención", "Pagos mensuales automáticos", "Integración con sistema de cobros", "Soporte dedicado", "Personalización white-label", "Ahorro del 13%"]', 12, false, 0);
