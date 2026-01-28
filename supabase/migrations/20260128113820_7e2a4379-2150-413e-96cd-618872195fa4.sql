-- Platform role enum
CREATE TYPE public.platform_role AS ENUM ('owner', 'admin', 'support_readonly');

-- Organisation status enum
CREATE TYPE public.org_status AS ENUM ('trial', 'active', 'suspended', 'readonly');

-- Subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'expired', 'past_due');

-- Support session status enum
CREATE TYPE public.support_session_status AS ENUM ('active', 'ended', 'expired');

-- Platform Users table (separate from tenant users)
CREATE TABLE public.platform_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role platform_role NOT NULL DEFAULT 'support_readonly',
  mfa_enabled BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Organisations (tenants) table
CREATE TABLE public.organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT NOT NULL,
  trading_name TEXT,
  timezone TEXT DEFAULT 'Australia/Sydney',
  status org_status NOT NULL DEFAULT 'trial',
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Plans table
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Plan entitlements (feature flags per plan)
CREATE TABLE public.plan_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(plan_id, key)
);

-- Organisation entitlements (overrides)
CREATE TABLE public.organisation_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(organisation_id, key)
);

-- Organisation subscriptions
CREATE TABLE public.organisation_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_id UUID REFERENCES public.plans(id) NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Support sessions (impersonation)
CREATE TABLE public.support_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_user_id UUID REFERENCES public.platform_users(id) ON DELETE CASCADE NOT NULL,
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE NOT NULL,
  impersonated_tenant_user_id UUID,
  reason TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 minutes'),
  status support_session_status NOT NULL DEFAULT 'active'
);

-- Platform audit logs
CREATE TABLE public.platform_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_platform_user_id UUID REFERENCES public.platform_users(id),
  organisation_id UUID REFERENCES public.organisations(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  before_json JSONB,
  after_json JSONB,
  metadata_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.platform_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check platform role
CREATE OR REPLACE FUNCTION public.is_platform_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_users
    WHERE user_id = _user_id
      AND status = 'active'
  )
$$;

-- Security definer function to get platform role
CREATE OR REPLACE FUNCTION public.get_platform_role(_user_id UUID)
RETURNS platform_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.platform_users
  WHERE user_id = _user_id
    AND status = 'active'
  LIMIT 1
$$;

-- Security definer function to check if platform user has specific role
CREATE OR REPLACE FUNCTION public.has_platform_role(_user_id UUID, _role platform_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_users
    WHERE user_id = _user_id
      AND role = _role
      AND status = 'active'
  )
$$;

-- RLS Policies for platform_users
CREATE POLICY "Platform users can view all platform users"
ON public.platform_users FOR SELECT
USING (is_platform_user(auth.uid()));

CREATE POLICY "Platform owners can manage platform users"
ON public.platform_users FOR ALL
USING (has_platform_role(auth.uid(), 'owner'));

-- RLS Policies for organisations
CREATE POLICY "Platform users can view all organisations"
ON public.organisations FOR SELECT
USING (is_platform_user(auth.uid()));

CREATE POLICY "Platform admins can manage organisations"
ON public.organisations FOR ALL
USING (has_platform_role(auth.uid(), 'owner') OR has_platform_role(auth.uid(), 'admin'));

-- RLS Policies for plans
CREATE POLICY "Platform users can view all plans"
ON public.plans FOR SELECT
USING (is_platform_user(auth.uid()));

CREATE POLICY "Platform owners can manage plans"
ON public.plans FOR ALL
USING (has_platform_role(auth.uid(), 'owner'));

-- RLS Policies for plan_entitlements
CREATE POLICY "Platform users can view plan entitlements"
ON public.plan_entitlements FOR SELECT
USING (is_platform_user(auth.uid()));

CREATE POLICY "Platform owners can manage plan entitlements"
ON public.plan_entitlements FOR ALL
USING (has_platform_role(auth.uid(), 'owner'));

-- RLS Policies for organisation_entitlements
CREATE POLICY "Platform users can view organisation entitlements"
ON public.organisation_entitlements FOR SELECT
USING (is_platform_user(auth.uid()));

CREATE POLICY "Platform admins can manage organisation entitlements"
ON public.organisation_entitlements FOR ALL
USING (has_platform_role(auth.uid(), 'owner') OR has_platform_role(auth.uid(), 'admin'));

-- RLS Policies for organisation_subscriptions
CREATE POLICY "Platform users can view organisation subscriptions"
ON public.organisation_subscriptions FOR SELECT
USING (is_platform_user(auth.uid()));

CREATE POLICY "Platform admins can manage organisation subscriptions"
ON public.organisation_subscriptions FOR ALL
USING (has_platform_role(auth.uid(), 'owner') OR has_platform_role(auth.uid(), 'admin'));

-- RLS Policies for support_sessions
CREATE POLICY "Platform users can view support sessions"
ON public.support_sessions FOR SELECT
USING (is_platform_user(auth.uid()));

CREATE POLICY "Platform admins can create support sessions"
ON public.support_sessions FOR INSERT
WITH CHECK (has_platform_role(auth.uid(), 'owner') OR has_platform_role(auth.uid(), 'admin'));

CREATE POLICY "Platform admins can update support sessions"
ON public.support_sessions FOR UPDATE
USING (has_platform_role(auth.uid(), 'owner') OR has_platform_role(auth.uid(), 'admin'));

-- RLS Policies for platform_audit_logs
CREATE POLICY "Platform users can view platform audit logs"
ON public.platform_audit_logs FOR SELECT
USING (is_platform_user(auth.uid()));

CREATE POLICY "System can create platform audit logs"
ON public.platform_audit_logs FOR INSERT
WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_organisations_updated_at
BEFORE UPDATE ON public.organisations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organisation_entitlements_updated_at
BEFORE UPDATE ON public.organisation_entitlements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organisation_subscriptions_updated_at
BEFORE UPDATE ON public.organisation_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();