-- Create enum for contract status
CREATE TYPE public.contract_status AS ENUM ('draft', 'pending_signature', 'signed', 'expired', 'voided');

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  employee_email TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT,
  start_date DATE,
  pay_rate DECIMAL(10,2),
  employment_type TEXT,
  status contract_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE
);

-- Create signatures table
CREATE TABLE public.signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signature_data TEXT NOT NULL,
  signature_type TEXT NOT NULL DEFAULT 'drawn',
  ip_address TEXT,
  user_agent TEXT,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit trail table
CREATE TABLE public.contract_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_email TEXT,
  actor_name TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contracts
CREATE POLICY "Authenticated users can view contracts"
  ON public.contracts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create contracts"
  ON public.contracts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update contracts"
  ON public.contracts FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for signatures
CREATE POLICY "Authenticated users can view signatures"
  ON public.signatures FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create signatures"
  ON public.signatures FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for audit log
CREATE POLICY "Authenticated users can view audit log"
  ON public.contract_audit_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create audit entries"
  ON public.contract_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create trigger for contracts updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();