-- Fix RLS Policy warnings - Remove overly permissive policies and add proper organisation_id scoping

-- Drop and recreate employee_certifications policy to be more specific
DROP POLICY IF EXISTS "Admins and managers can manage certifications" ON public.employee_certifications;

CREATE POLICY "Admins and managers can insert certifications"
ON public.employee_certifications FOR INSERT
WITH CHECK (
  public.is_platform_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins and managers can update certifications"
ON public.employee_certifications FOR UPDATE
USING (
  public.is_platform_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins and managers can delete certifications"
ON public.employee_certifications FOR DELETE
USING (
  public.is_platform_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

-- Drop and recreate timesheets policy to be more specific  
DROP POLICY IF EXISTS "Admins and managers can manage timesheets" ON public.timesheets;

CREATE POLICY "Admins and managers can insert timesheets"
ON public.timesheets FOR INSERT
WITH CHECK (
  public.is_platform_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins and managers can update timesheets"
ON public.timesheets FOR UPDATE
USING (
  public.is_platform_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins and managers can delete timesheets"
ON public.timesheets FOR DELETE
USING (
  public.is_platform_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

-- Drop and recreate leave_requests policy to be more specific
DROP POLICY IF EXISTS "Admins and managers can manage leave requests" ON public.leave_requests;

CREATE POLICY "Admins and managers can insert leave requests"
ON public.leave_requests FOR INSERT
WITH CHECK (
  public.is_platform_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins and managers can update leave requests"
ON public.leave_requests FOR UPDATE
USING (
  public.is_platform_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins and managers can delete leave requests"
ON public.leave_requests FOR DELETE
USING (
  public.is_platform_user(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

-- Add organisation_id column to audit_logs for tenant isolation
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES public.organisations(id);