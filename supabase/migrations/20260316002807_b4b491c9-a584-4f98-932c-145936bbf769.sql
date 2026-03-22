
-- Remove direct INSERT/UPDATE from authenticated users on user_subscriptions
DROP POLICY IF EXISTS "Users can create own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.user_subscriptions;

-- Only super admins can directly insert/update subscriptions
CREATE POLICY "Only admins can manage subscriptions" ON public.user_subscriptions
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Users can still view their own subscriptions
-- (SELECT policy already exists, keeping it)

-- Create a SECURITY DEFINER function for server-side subscription creation
CREATE OR REPLACE FUNCTION public.create_user_subscription(
  _user_id uuid,
  _plan_id uuid,
  _gym_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plan record;
  _sub_id uuid;
  _expires timestamp with time zone;
BEGIN
  -- Validate plan exists and is active
  SELECT * INTO _plan FROM subscription_plans WHERE id = _plan_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or inactive plan';
  END IF;

  -- Calculate expiry based on interval
  _expires := CASE _plan.interval
    WHEN 'monthly' THEN now() + interval '1 month'
    WHEN 'quarterly' THEN now() + interval '3 months'
    WHEN 'semi_annual' THEN now() + interval '6 months'
    WHEN 'annual' THEN now() + interval '1 year'
    WHEN 'trial' THEN now() + (COALESCE(_plan.trial_days, 14) || ' days')::interval
    WHEN 'free' THEN NULL
    ELSE now() + interval '1 month'
  END;

  -- Expire any existing active subscription
  UPDATE user_subscriptions
  SET status = 'expired', cancelled_at = now()
  WHERE user_id = _user_id AND status IN ('active', 'trial');

  -- Create new subscription
  INSERT INTO user_subscriptions (user_id, plan_id, gym_id, status, started_at, expires_at)
  VALUES (
    _user_id,
    _plan_id,
    _gym_id,
    CASE WHEN _plan.interval = 'trial' THEN 'trial'::subscription_status ELSE 'active'::subscription_status END,
    now(),
    _expires
  )
  RETURNING id INTO _sub_id;

  RETURN _sub_id;
END;
$$;

-- Create a function to cancel own subscription (safe, only downgrades)
CREATE OR REPLACE FUNCTION public.cancel_own_subscription(_subscription_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_subscriptions
  SET status = 'cancelled', cancelled_at = now()
  WHERE id = _subscription_id
    AND user_id = auth.uid()
    AND status IN ('active', 'trial');

  RETURN FOUND;
END;
$$;
