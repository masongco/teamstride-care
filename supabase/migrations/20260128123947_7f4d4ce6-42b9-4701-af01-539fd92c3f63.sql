-- Leave & Entitlements Engine Schema
-- Supports: configurable leave types, balances, accruals, adjustments, and audit-safe workflows

-- Enum for accrual frequency
CREATE TYPE public.accrual_frequency AS ENUM ('weekly', 'fortnightly', 'monthly', 'annually');

-- Leave Types (configurable per organisation)
CREATE TABLE public.leave_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  accrues BOOLEAN NOT NULL DEFAULT true,
  accrual_rate_hours NUMERIC(6,2) DEFAULT 0,
  accrual_frequency accrual_frequency DEFAULT 'fortnightly',
  max_balance_hours NUMERIC(8,2),
  paid BOOLEAN NOT NULL DEFAULT true,
  applicable_employment_types TEXT[] DEFAULT ARRAY['full_time', 'part_time', 'casual', 'contractor'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organisation_id, name)
);

-- Leave Balances (per employee per leave type)
CREATE TABLE public.leave_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  balance_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  last_accrual_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, leave_type_id),
  CONSTRAINT balance_non_negative CHECK (balance_hours >= 0 OR balance_hours < 0)
);

-- Leave Adjustments (manual corrections - strictly controlled)
CREATE TABLE public.leave_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  adjustment_hours NUMERIC(8,2) NOT NULL,
  reason TEXT NOT NULL,
  adjusted_by_user_id UUID NOT NULL,
  adjusted_by_name TEXT,
  adjusted_by_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update existing leave_requests table to link to leave_types
-- First add leave_type_id column if it doesn't exist
ALTER TABLE public.leave_requests 
ADD COLUMN IF NOT EXISTS leave_type_id UUID REFERENCES public.leave_types(id),
ADD COLUMN IF NOT EXISTS decided_by_user_id UUID,
ADD COLUMN IF NOT EXISTS decided_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS balance_deducted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS override_reason TEXT;

-- Enable RLS on all tables
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leave_types
CREATE POLICY "Users can view leave types in their organisation"
  ON public.leave_types FOR SELECT
  USING (
    is_platform_user(auth.uid()) OR 
    user_belongs_to_org(auth.uid(), organisation_id)
  );

CREATE POLICY "Admins can manage leave types"
  ON public.leave_types FOR ALL
  USING (
    is_platform_user(auth.uid()) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for leave_balances
CREATE POLICY "Users can view leave balances in their organisation"
  ON public.leave_balances FOR SELECT
  USING (
    is_platform_user(auth.uid()) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "Admins and managers can manage leave balances"
  ON public.leave_balances FOR ALL
  USING (
    is_platform_user(auth.uid()) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  );

-- RLS Policies for leave_adjustments
CREATE POLICY "Admins can view leave adjustments"
  ON public.leave_adjustments FOR SELECT
  USING (
    is_platform_user(auth.uid()) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "Admins can create leave adjustments"
  ON public.leave_adjustments FOR INSERT
  WITH CHECK (
    is_platform_user(auth.uid()) OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- No update or delete on adjustments (immutable)

-- Triggers for updated_at
CREATE TRIGGER update_leave_types_updated_at
  BEFORE UPDATE ON public.leave_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at
  BEFORE UPDATE ON public.leave_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if balance allows leave request
CREATE OR REPLACE FUNCTION public.check_leave_balance(_employee_id UUID, _leave_type_id UUID, _hours_requested NUMERIC)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT balance_hours >= _hours_requested
     FROM public.leave_balances
     WHERE employee_id = _employee_id
       AND leave_type_id = _leave_type_id),
    false
  )
$$;

-- Function to deduct balance on approval
CREATE OR REPLACE FUNCTION public.deduct_leave_balance(_employee_id UUID, _leave_type_id UUID, _hours NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leave_balances
  SET balance_hours = balance_hours - _hours,
      updated_at = now()
  WHERE employee_id = _employee_id
    AND leave_type_id = _leave_type_id;
  
  RETURN FOUND;
END;
$$;

-- Function to restore balance on cancellation
CREATE OR REPLACE FUNCTION public.restore_leave_balance(_employee_id UUID, _leave_type_id UUID, _hours NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leave_balances
  SET balance_hours = balance_hours + _hours,
      updated_at = now()
  WHERE employee_id = _employee_id
    AND leave_type_id = _leave_type_id;
  
  RETURN FOUND;
END;
$$;

-- Function to run accruals for an organisation
CREATE OR REPLACE FUNCTION public.run_leave_accruals(_organisation_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  accrued_count INTEGER := 0;
  emp RECORD;
  lt RECORD;
  should_accrue BOOLEAN;
  last_accrual TIMESTAMP WITH TIME ZONE;
  interval_days INTEGER;
BEGIN
  -- Loop through active employees
  FOR emp IN 
    SELECT id, employment_type 
    FROM public.employees 
    WHERE organisation_id = _organisation_id AND status = 'active'
  LOOP
    -- Loop through applicable leave types
    FOR lt IN 
      SELECT id, accrual_rate_hours, accrual_frequency, max_balance_hours
      FROM public.leave_types
      WHERE organisation_id = _organisation_id
        AND accrues = true
        AND is_active = true
        AND emp.employment_type::text = ANY(applicable_employment_types)
    LOOP
      -- Get or create balance record
      INSERT INTO public.leave_balances (organisation_id, employee_id, leave_type_id, balance_hours)
      VALUES (_organisation_id, emp.id, lt.id, 0)
      ON CONFLICT (employee_id, leave_type_id) DO NOTHING;
      
      -- Check if accrual is due
      SELECT last_accrual_at INTO last_accrual
      FROM public.leave_balances
      WHERE employee_id = emp.id AND leave_type_id = lt.id;
      
      -- Calculate interval based on frequency
      interval_days := CASE lt.accrual_frequency
        WHEN 'weekly' THEN 7
        WHEN 'fortnightly' THEN 14
        WHEN 'monthly' THEN 30
        WHEN 'annually' THEN 365
        ELSE 14
      END;
      
      -- Check if enough time has passed
      should_accrue := last_accrual IS NULL OR 
                       (now() - last_accrual) >= (interval_days || ' days')::interval;
      
      IF should_accrue THEN
        -- Apply accrual (respecting max balance if set)
        UPDATE public.leave_balances
        SET balance_hours = CASE 
              WHEN lt.max_balance_hours IS NOT NULL 
              THEN LEAST(balance_hours + lt.accrual_rate_hours, lt.max_balance_hours)
              ELSE balance_hours + lt.accrual_rate_hours
            END,
            last_accrual_at = now(),
            updated_at = now()
        WHERE employee_id = emp.id AND leave_type_id = lt.id;
        
        accrued_count := accrued_count + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN accrued_count;
END;
$$;

-- Seed default leave types for existing organisations
INSERT INTO public.leave_types (organisation_id, name, description, accrues, accrual_rate_hours, accrual_frequency, max_balance_hours, paid, applicable_employment_types, display_order)
SELECT 
  o.id,
  lt.name,
  lt.description,
  lt.accrues,
  lt.accrual_rate_hours,
  lt.accrual_frequency::accrual_frequency,
  lt.max_balance_hours,
  lt.paid,
  lt.applicable_employment_types,
  lt.display_order
FROM public.organisations o
CROSS JOIN (VALUES
  ('Annual Leave', 'Standard annual leave entitlement', true, 6.08, 'fortnightly', 304.00, true, ARRAY['full_time', 'part_time'], 1),
  ('Personal/Sick Leave', 'Personal/carer''s leave', true, 3.08, 'fortnightly', 152.00, true, ARRAY['full_time', 'part_time'], 2),
  ('Compassionate Leave', 'Leave for bereavement or family emergency', false, 0, 'fortnightly', NULL, true, ARRAY['full_time', 'part_time', 'casual', 'contractor'], 3),
  ('Parental Leave', 'Maternity/paternity/adoption leave', false, 0, 'fortnightly', NULL, true, ARRAY['full_time', 'part_time'], 4),
  ('Unpaid Leave', 'Leave without pay', false, 0, 'fortnightly', NULL, false, ARRAY['full_time', 'part_time', 'casual', 'contractor'], 5),
  ('Other', 'Other leave types', false, 0, 'fortnightly', NULL, false, ARRAY['full_time', 'part_time', 'casual', 'contractor'], 6)
) AS lt(name, description, accrues, accrual_rate_hours, accrual_frequency, max_balance_hours, paid, applicable_employment_types, display_order)
ON CONFLICT (organisation_id, name) DO NOTHING;