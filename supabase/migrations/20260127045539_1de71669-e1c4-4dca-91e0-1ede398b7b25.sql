-- Fix signature authorization: users can only sign contracts assigned to them
-- and contracts must be in pending_signature status

-- Drop the current permissive policy
DROP POLICY IF EXISTS "Users can create own signatures" ON public.signatures;

-- Create a more restrictive policy that verifies:
-- 1. The signer_email matches the authenticated user's email
-- 2. The contract is assigned to them (employee_email matches)
-- 3. The contract is in pending_signature status
CREATE POLICY "Users can sign their own contracts"
ON public.signatures FOR INSERT
TO authenticated
WITH CHECK (
  signer_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
  AND
  contract_id IN (
    SELECT id FROM public.contracts
    WHERE employee_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
    AND status = 'pending_signature'
  )
);

-- Add unique constraint to prevent multiple signatures per contract
ALTER TABLE public.signatures 
ADD CONSTRAINT signatures_contract_id_unique UNIQUE (contract_id);