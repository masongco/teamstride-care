-- Create compliance_overrides table for tracking admin overrides
CREATE TABLE public.compliance_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  override_by UUID NOT NULL,
  override_by_name TEXT NOT NULL,
  override_by_email TEXT NOT NULL,
  reason TEXT NOT NULL,
  blocked_certifications JSONB NOT NULL DEFAULT '[]',
  context_type TEXT NOT NULL, -- 'shift', 'client', 'service'
  context_id UUID, -- Optional reference to the specific shift/client/service
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure override can't exceed 14 days
  CONSTRAINT override_max_duration CHECK (expires_at <= created_at + INTERVAL '14 days')
);

-- Create index for fast lookups
CREATE INDEX idx_compliance_overrides_employee ON public.compliance_overrides(employee_id, is_active);
CREATE INDEX idx_compliance_overrides_expires ON public.compliance_overrides(expires_at) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.compliance_overrides ENABLE ROW LEVEL SECURITY;

-- Only admins can view overrides
CREATE POLICY "Admins can view compliance overrides"
  ON public.compliance_overrides FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Only admins can create overrides
CREATE POLICY "Admins can create compliance overrides"
  ON public.compliance_overrides FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can update overrides
CREATE POLICY "Admins can update compliance overrides"
  ON public.compliance_overrides FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_compliance_overrides_updated_at
  BEFORE UPDATE ON public.compliance_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to automatically expire overrides
CREATE OR REPLACE FUNCTION public.expire_compliance_overrides()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.compliance_overrides
  SET is_active = false, updated_at = now()
  WHERE is_active = true AND expires_at < now();
END;
$$;

-- Create a function to check if employee has active override for a context
CREATE OR REPLACE FUNCTION public.has_active_compliance_override(
  _employee_id UUID,
  _context_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.compliance_overrides
    WHERE employee_id = _employee_id
      AND is_active = true
      AND expires_at > now()
      AND (_context_type IS NULL OR context_type = _context_type)
  )
$$;

-- Add 'director' to the app_role enum if it doesn't exist
DO $$
BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'director';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;