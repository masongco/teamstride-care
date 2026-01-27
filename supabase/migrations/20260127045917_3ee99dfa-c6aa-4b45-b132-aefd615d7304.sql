-- Fix overly permissive INSERT policy on contract_audit_log
-- The current policy allows any authenticated user to insert any audit entry

-- Drop the current permissive policy
DROP POLICY IF EXISTS "Authenticated users can create audit entries" ON public.contract_audit_log;

-- Create a more restrictive policy that ensures:
-- 1. The actor can only create audit entries for contracts they have access to
-- 2. The actor_email must match their own email (if provided)
CREATE POLICY "Users can create audit entries for accessible contracts"
ON public.contract_audit_log FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin/managers can create audit entries for any contract they manage
  (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  )
  OR
  -- Employees can only create audit entries for their own contracts
  (
    contract_id IN (
      SELECT id FROM public.contracts
      WHERE employee_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
    )
  )
);