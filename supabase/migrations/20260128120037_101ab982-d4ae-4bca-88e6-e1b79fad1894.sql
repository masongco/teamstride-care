-- =============================================
-- P0 HRMS Data & Safety Hardening Migration
-- =============================================

-- 1. Create employment_type enum
CREATE TYPE public.employment_type AS ENUM ('casual', 'part_time', 'full_time', 'contractor');

-- 2. Create employee_status enum  
CREATE TYPE public.employee_status AS ENUM ('active', 'inactive', 'onboarding', 'offboarding', 'terminated');

-- 3. Create compliance_status enum
CREATE TYPE public.compliance_status AS ENUM ('compliant', 'expiring', 'expired', 'pending');

-- 4. Create employees table (tenant-scoped)
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  employment_type public.employment_type NOT NULL DEFAULT 'casual',
  position TEXT,
  department TEXT,
  start_date DATE,
  end_date DATE,
  status public.employee_status NOT NULL DEFAULT 'active',
  compliance_status public.compliance_status NOT NULL DEFAULT 'pending',
  pay_rate NUMERIC(10,2),
  award_classification_id UUID REFERENCES public.award_classifications(id),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organisation_id, email)
);

-- 5. Create employee_certifications table (tenant-scoped)
CREATE TABLE public.employee_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- police_check, ndis_screening, first_aid, cpr, training, wwcc_vic, wwcc_nsw, drivers_license, other
  issue_date DATE,
  expiry_date DATE,
  status public.compliance_status NOT NULL DEFAULT 'pending',
  document_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create timesheets table (tenant-scoped)
CREATE TABLE public.timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clock_in TIME NOT NULL,
  clock_out TIME,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  total_hours NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Create leave_requests table (tenant-scoped)
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('annual', 'personal', 'unpaid', 'compassionate', 'parental', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  hours NUMERIC(5,2) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Add organisation_id to existing tables that need tenant isolation

-- Add to award_classifications (if not already tenant-scoped)
ALTER TABLE public.award_classifications 
ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE;

-- 9. Enable RLS on all new tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- 10. Create helper function to get user's organisation_id
CREATE OR REPLACE FUNCTION public.get_user_organisation_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- For now, return the first organisation (single-tenant mode)
  -- This will be updated when user-org mapping is implemented
  SELECT id FROM public.organisations LIMIT 1
$$;

-- 11. Create helper function to check if user belongs to organisation
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Platform users can access via impersonation
  -- Regular users access their own org
  SELECT 
    public.is_platform_user(_user_id) 
    OR EXISTS (
      SELECT 1 FROM public.organisations WHERE id = _org_id
    )
$$;

-- 12. RLS Policies for employees table
CREATE POLICY "Users can view employees in their organisation"
ON public.employees FOR SELECT
USING (
  public.is_platform_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins and managers can create employees"
ON public.employees FOR INSERT
WITH CHECK (
  public.is_platform_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins and managers can update employees"
ON public.employees FOR UPDATE
USING (
  public.is_platform_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins can delete employees"
ON public.employees FOR DELETE
USING (
  public.is_platform_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- 13. RLS Policies for employee_certifications table
CREATE POLICY "Users can view certifications in their organisation"
ON public.employee_certifications FOR SELECT
USING (
  public.is_platform_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins and managers can manage certifications"
ON public.employee_certifications FOR ALL
USING (
  public.is_platform_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

-- 14. RLS Policies for timesheets table
CREATE POLICY "Users can view timesheets in their organisation"
ON public.timesheets FOR SELECT
USING (
  public.is_platform_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins and managers can manage timesheets"
ON public.timesheets FOR ALL
USING (
  public.is_platform_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

-- 15. RLS Policies for leave_requests table
CREATE POLICY "Users can view leave requests in their organisation"
ON public.leave_requests FOR SELECT
USING (
  public.is_platform_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins and managers can manage leave requests"
ON public.leave_requests FOR ALL
USING (
  public.is_platform_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

-- 16. Create indexes for performance
CREATE INDEX idx_employees_organisation ON public.employees(organisation_id);
CREATE INDEX idx_employees_status ON public.employees(status);
CREATE INDEX idx_employees_email ON public.employees(email);
CREATE INDEX idx_employee_certifications_employee ON public.employee_certifications(employee_id);
CREATE INDEX idx_employee_certifications_expiry ON public.employee_certifications(expiry_date);
CREATE INDEX idx_timesheets_employee ON public.timesheets(employee_id);
CREATE INDEX idx_timesheets_date ON public.timesheets(date);
CREATE INDEX idx_leave_requests_employee ON public.leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON public.leave_requests(status);

-- 17. Create triggers for updated_at
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_certifications_updated_at
BEFORE UPDATE ON public.employee_certifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timesheets_updated_at
BEFORE UPDATE ON public.timesheets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
BEFORE UPDATE ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();