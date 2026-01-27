-- Fix security issues for contracts and signatures tables
-- Issue 1 & 2: contracts table - restrict to role-based access
-- Issue 3: signatures table - restrict to role-based access

-- =============================================
-- FIX CONTRACTS TABLE RLS POLICIES
-- =============================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can view contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can create contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can update contracts" ON public.contracts;

-- Admins and managers can view all contracts
CREATE POLICY "Admins and managers can view all contracts"
ON public.contracts
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Employees can view their own contracts (by email match)
CREATE POLICY "Employees can view own contracts"
ON public.contracts
FOR SELECT
TO authenticated
USING (
  employee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Only admins and managers can create contracts
CREATE POLICY "Admins and managers can create contracts"
ON public.contracts
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Only admins and managers can update contracts
CREATE POLICY "Admins and managers can update contracts"
ON public.contracts
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- =============================================
-- FIX SIGNATURES TABLE RLS POLICIES
-- =============================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can view signatures" ON public.signatures;
DROP POLICY IF EXISTS "Authenticated users can create signatures" ON public.signatures;

-- Admins and managers can view all signatures
CREATE POLICY "Admins and managers can view signatures"
ON public.signatures
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Employees can view their own signatures
CREATE POLICY "Employees can view own signatures"
ON public.signatures
FOR SELECT
TO authenticated
USING (
  signer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Users can only create signatures with their own email
CREATE POLICY "Users can create own signatures"
ON public.signatures
FOR INSERT
TO authenticated
WITH CHECK (
  signer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- =============================================
-- FIX CONTRACT AUDIT LOG RLS POLICIES
-- =============================================

-- Drop existing permissive policies on audit log
DROP POLICY IF EXISTS "Authenticated users can view audit log" ON public.contract_audit_log;
DROP POLICY IF EXISTS "Authenticated users can create audit entries" ON public.contract_audit_log;

-- Admins and managers can view all audit logs
CREATE POLICY "Admins and managers can view audit logs"
ON public.contract_audit_log
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Employees can view audit logs for their own contracts
CREATE POLICY "Employees can view own contract audit logs"
ON public.contract_audit_log
FOR SELECT
TO authenticated
USING (
  contract_id IN (
    SELECT id FROM public.contracts 
    WHERE employee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Allow authenticated users to create audit entries (needed for logging actions)
CREATE POLICY "Authenticated users can create audit entries"
ON public.contract_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);