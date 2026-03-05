
-- Table for tracking monthly gym payments
CREATE TABLE public.gym_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  period_month date NOT NULL, -- first day of the month (e.g. 2026-03-01)
  amount numeric NOT NULL DEFAULT 0,
  is_paid boolean NOT NULL DEFAULT false,
  paid_at timestamp with time zone,
  marked_by uuid, -- gym_admin who marked it
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(gym_id, user_id, period_month)
);

-- RLS
ALTER TABLE public.gym_payments ENABLE ROW LEVEL SECURITY;

-- Gym admins can manage all payments for their gym
CREATE POLICY "Gym admins can manage payments"
  ON public.gym_payments FOR ALL
  TO authenticated
  USING (is_gym_admin(auth.uid(), gym_id) OR is_super_admin(auth.uid()))
  WITH CHECK (is_gym_admin(auth.uid(), gym_id) OR is_super_admin(auth.uid()));

-- Users can view their own payment records
CREATE POLICY "Users can view own payments"
  ON public.gym_payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_gym_payments_updated_at
  BEFORE UPDATE ON public.gym_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
