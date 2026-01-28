-- =====================================================
-- Payroll Export Integration - Core Tables
-- =====================================================

-- Enum for pay period status
CREATE TYPE public.pay_period_status AS ENUM ('open', 'exported', 'closed');

-- Enum for payroll export provider
CREATE TYPE public.payroll_provider AS ENUM ('generic_csv', 'keypay', 'xero', 'myob');

-- Enum for payroll export status
CREATE TYPE public.payroll_export_status AS ENUM ('generated', 'voided');

-- =====================================================
-- A) Pay Periods Table
-- =====================================================
CREATE TABLE public.pay_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status public.pay_period_status NOT NULL DEFAULT 'open',
  created_by_user_id UUID NOT NULL,
  created_by_name TEXT,
  created_by_email TEXT,
  closed_at TIMESTAMPTZ,
  closed_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pay_periods_date_order CHECK (end_date >= start_date)
);

-- Enable RLS
ALTER TABLE public.pay_periods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins and managers can view pay periods"
  ON public.pay_periods FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can create pay periods"
  ON public.pay_periods FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pay periods"
  ON public.pay_periods FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_pay_periods_updated_at
  BEFORE UPDATE ON public.pay_periods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- B) Timesheets Enhancement
-- =====================================================
-- Add export-related columns to timesheets
ALTER TABLE public.timesheets 
  ADD COLUMN IF NOT EXISTS exported_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS exported_in_pay_period_id UUID REFERENCES public.pay_periods(id),
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_reason TEXT,
  ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unlocked_by_user_id UUID,
  ADD COLUMN IF NOT EXISTS unlocked_reason TEXT;

-- =====================================================
-- C) Payroll Mappings Table
-- =====================================================
CREATE TABLE public.payroll_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  shift_type TEXT NOT NULL,
  earning_code TEXT NOT NULL,
  description TEXT,
  multiplier NUMERIC DEFAULT 1.0,
  applies_when JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organisation_id, shift_type)
);

-- Enable RLS
ALTER TABLE public.payroll_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins and managers can view payroll mappings"
  ON public.payroll_mappings FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can manage payroll mappings"
  ON public.payroll_mappings FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_payroll_mappings_updated_at
  BEFORE UPDATE ON public.payroll_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- D) Payroll Exports Table
-- =====================================================
CREATE TABLE public.payroll_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  pay_period_id UUID NOT NULL REFERENCES public.pay_periods(id),
  provider public.payroll_provider NOT NULL,
  file_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  totals_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id UUID NOT NULL,
  created_by_name TEXT,
  created_by_email TEXT,
  status public.payroll_export_status NOT NULL DEFAULT 'generated',
  voided_at TIMESTAMPTZ,
  voided_by_user_id UUID,
  voided_by_name TEXT,
  voided_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payroll_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins and managers can view payroll exports"
  ON public.payroll_exports FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can create payroll exports"
  ON public.payroll_exports FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payroll exports"
  ON public.payroll_exports FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_payroll_exports_updated_at
  BEFORE UPDATE ON public.payroll_exports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- E) Timesheet Export Unlock Log
-- =====================================================
CREATE TABLE public.timesheet_unlock_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  timesheet_id UUID NOT NULL REFERENCES public.timesheets(id),
  unlocked_by_user_id UUID NOT NULL,
  unlocked_by_name TEXT,
  unlocked_by_email TEXT,
  reason TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.timesheet_unlock_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view unlock logs"
  ON public.timesheet_unlock_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create unlock logs"
  ON public.timesheet_unlock_log FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- =====================================================
-- Storage Bucket for Payroll Exports
-- =====================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payroll-exports', 'payroll-exports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Admins can upload payroll exports"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payroll-exports' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and managers can read payroll exports"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payroll-exports' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')));

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to check if a timesheet can be edited
CREATE OR REPLACE FUNCTION public.can_edit_timesheet(_timesheet_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT COALESCE(is_locked, false)
  FROM public.timesheets
  WHERE id = _timesheet_id
$$;

-- Function to lock timesheets after export
CREATE OR REPLACE FUNCTION public.lock_timesheets_for_export(
  _timesheet_ids UUID[],
  _pay_period_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  locked_count INTEGER;
BEGIN
  UPDATE public.timesheets
  SET 
    is_locked = true,
    locked_reason = 'Exported in pay period',
    exported_at = now(),
    exported_in_pay_period_id = _pay_period_id,
    status = 'approved',
    updated_at = now()
  WHERE id = ANY(_timesheet_ids)
    AND status = 'approved'
    AND NOT COALESCE(is_locked, false);
  
  GET DIAGNOSTICS locked_count = ROW_COUNT;
  RETURN locked_count;
END;
$$;

-- Function to unlock a timesheet (admin only with reason)
CREATE OR REPLACE FUNCTION public.unlock_timesheet(
  _timesheet_id UUID,
  _user_id UUID,
  _user_name TEXT,
  _user_email TEXT,
  _reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id UUID;
BEGIN
  SELECT organisation_id INTO _org_id
  FROM public.timesheets
  WHERE id = _timesheet_id;
  
  INSERT INTO public.timesheet_unlock_log (
    organisation_id, timesheet_id, unlocked_by_user_id, 
    unlocked_by_name, unlocked_by_email, reason
  ) VALUES (
    _org_id, _timesheet_id, _user_id, 
    _user_name, _user_email, _reason
  );
  
  UPDATE public.timesheets
  SET 
    is_locked = false,
    unlocked_at = now(),
    unlocked_by_user_id = _user_id,
    unlocked_reason = _reason,
    updated_at = now()
  WHERE id = _timesheet_id;
  
  RETURN FOUND;
END;
$$;

-- Seed default payroll mappings
INSERT INTO public.payroll_mappings (organisation_id, shift_type, earning_code, description)
SELECT 
  o.id,
  shift_types.shift_type,
  shift_types.earning_code,
  shift_types.mapping_desc
FROM public.organisations o
CROSS JOIN (VALUES
  ('standard', 'ORD', 'Ordinary Hours'),
  ('overtime', 'OT1.5', 'Overtime 1.5x'),
  ('weekend', 'SAT', 'Saturday Rate'),
  ('sunday', 'SUN', 'Sunday Rate'),
  ('public_holiday', 'PH', 'Public Holiday Rate'),
  ('evening', 'EVE', 'Evening Shift'),
  ('night', 'NIGHT', 'Night Shift'),
  ('sleepover', 'SLEEP', 'Sleepover Allowance')
) AS shift_types(shift_type, earning_code, mapping_desc)
ON CONFLICT (organisation_id, shift_type) DO NOTHING;