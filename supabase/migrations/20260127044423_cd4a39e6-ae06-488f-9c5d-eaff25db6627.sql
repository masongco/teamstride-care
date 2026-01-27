-- Fix overly permissive RLS policies on configuration tables
-- Restrict INSERT/UPDATE/DELETE to admins and managers only

-- ==========================================
-- DEPARTMENTS TABLE
-- ==========================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can create departments" ON public.departments;
DROP POLICY IF EXISTS "Authenticated users can update departments" ON public.departments;
DROP POLICY IF EXISTS "Authenticated users can delete departments" ON public.departments;

-- Create restricted policies for admins and managers
CREATE POLICY "Admins and managers can create departments"
ON public.departments FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can update departments"
ON public.departments FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can delete departments"
ON public.departments FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- ==========================================
-- POSITIONS TABLE
-- ==========================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can create positions" ON public.positions;
DROP POLICY IF EXISTS "Authenticated users can update positions" ON public.positions;
DROP POLICY IF EXISTS "Authenticated users can delete positions" ON public.positions;

-- Create restricted policies for admins and managers
CREATE POLICY "Admins and managers can create positions"
ON public.positions FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can update positions"
ON public.positions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can delete positions"
ON public.positions FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- ==========================================
-- AWARD CLASSIFICATIONS TABLE
-- ==========================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can create award classifications" ON public.award_classifications;
DROP POLICY IF EXISTS "Authenticated users can update award classifications" ON public.award_classifications;
DROP POLICY IF EXISTS "Authenticated users can delete award classifications" ON public.award_classifications;

-- Create restricted policies for admins and managers
CREATE POLICY "Admins and managers can create award classifications"
ON public.award_classifications FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can update award classifications"
ON public.award_classifications FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can delete award classifications"
ON public.award_classifications FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));