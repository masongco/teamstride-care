-- HR Cases Module: Incidents, Misconduct & Disciplinary Management
-- This module is leadership-only, highly auditable, and legally defensible

-- Enums for case management
CREATE TYPE public.hr_case_type AS ENUM ('incident', 'misconduct', 'grievance', 'performance', 'complaint');
CREATE TYPE public.hr_case_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.hr_case_status AS ENUM ('new', 'triaged', 'investigating', 'awaiting_response', 'decision_made', 'closed');
CREATE TYPE public.hr_case_reporter_type AS ENUM ('manager', 'employee', 'external', 'anonymous');
CREATE TYPE public.hr_case_confidentiality AS ENUM ('standard', 'restricted');
CREATE TYPE public.hr_case_substantiation AS ENUM ('yes', 'no', 'partially');
CREATE TYPE public.hr_action_type AS ENUM ('verbal_warning', 'written_warning', 'final_warning', 'training', 'supervision', 'termination', 'no_action', 'other');
CREATE TYPE public.hr_action_status AS ENUM ('planned', 'active', 'completed', 'withdrawn');
CREATE TYPE public.hr_access_level AS ENUM ('normal', 'restricted');
CREATE TYPE public.hr_note_visibility AS ENUM ('standard', 'restricted');

-- Main HR Cases table
CREATE TABLE public.hr_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  case_number TEXT NOT NULL,
  case_type hr_case_type NOT NULL,
  reported_by hr_case_reporter_type NOT NULL,
  reporter_name TEXT,
  reporter_contact TEXT,
  date_reported DATE NOT NULL DEFAULT CURRENT_DATE,
  summary TEXT NOT NULL,
  detailed_description TEXT,
  severity hr_case_severity NOT NULL DEFAULT 'medium',
  safeguarding_flag BOOLEAN NOT NULL DEFAULT false,
  status hr_case_status NOT NULL DEFAULT 'new',
  assigned_investigator_user_id UUID,
  confidentiality_level hr_case_confidentiality NOT NULL DEFAULT 'standard',
  created_by_user_id UUID,
  closed_at TIMESTAMPTZ,
  closure_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case Triage table
CREATE TABLE public.hr_case_triage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hr_case_id UUID NOT NULL REFERENCES public.hr_cases(id) ON DELETE CASCADE,
  initial_risk_assessment TEXT NOT NULL,
  immediate_actions_taken TEXT,
  escalation_required BOOLEAN NOT NULL DEFAULT false,
  escalated_to TEXT,
  triaged_by_user_id UUID NOT NULL,
  triaged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case Evidence table
CREATE TABLE public.hr_case_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hr_case_id UUID NOT NULL REFERENCES public.hr_cases(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  description TEXT,
  uploaded_by_user_id UUID NOT NULL,
  uploaded_by_name TEXT,
  access_level hr_access_level NOT NULL DEFAULT 'normal',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case Notes table (internal notes)
CREATE TABLE public.hr_case_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hr_case_id UUID NOT NULL REFERENCES public.hr_cases(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_by_user_id UUID NOT NULL,
  created_by_name TEXT,
  visibility hr_note_visibility NOT NULL DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case Findings table
CREATE TABLE public.hr_case_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hr_case_id UUID NOT NULL REFERENCES public.hr_cases(id) ON DELETE CASCADE,
  findings_summary TEXT NOT NULL,
  substantiated hr_case_substantiation NOT NULL,
  contributing_factors TEXT,
  decision_maker_user_id UUID NOT NULL,
  decision_maker_name TEXT,
  decision_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case Actions table (disciplinary/corrective)
CREATE TABLE public.hr_case_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hr_case_id UUID NOT NULL REFERENCES public.hr_cases(id) ON DELETE CASCADE,
  action_type hr_action_type NOT NULL,
  description TEXT NOT NULL,
  effective_date DATE NOT NULL,
  expiry_date DATE,
  assigned_to_user_id UUID,
  assigned_to_name TEXT,
  status hr_action_status NOT NULL DEFAULT 'planned',
  created_by_user_id UUID NOT NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT warning_requires_expiry CHECK (
    action_type NOT IN ('verbal_warning', 'written_warning', 'final_warning') 
    OR expiry_date IS NOT NULL
  )
);

-- Enable RLS on all tables
ALTER TABLE public.hr_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_case_triage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_case_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_case_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_case_actions ENABLE ROW LEVEL SECURITY;

-- Security definer function to check HR case access
CREATE OR REPLACE FUNCTION public.can_access_hr_case(_user_id UUID, _case_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admins can access all
    has_role(_user_id, 'admin'::app_role)
    OR
    -- Managers can only access cases they created or are assigned to
    (
      has_role(_user_id, 'manager'::app_role) AND
      EXISTS (
        SELECT 1 FROM public.hr_cases
        WHERE id = _case_id
        AND (created_by_user_id = _user_id OR assigned_investigator_user_id = _user_id)
      )
    )
$$;

-- Function to check if user can access restricted content
CREATE OR REPLACE FUNCTION public.can_access_restricted_hr_content(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(_user_id, 'admin'::app_role)
$$;

-- HR Cases RLS Policies
CREATE POLICY "Admins can view all HR cases"
  ON public.hr_cases FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can view their own HR cases"
  ON public.hr_cases FOR SELECT
  USING (
    has_role(auth.uid(), 'manager'::app_role) AND
    (created_by_user_id = auth.uid() OR assigned_investigator_user_id = auth.uid())
  );

CREATE POLICY "Admins and managers can create HR cases"
  ON public.hr_cases FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "Admins can update any HR case"
  ON public.hr_cases FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can update their own HR cases"
  ON public.hr_cases FOR UPDATE
  USING (
    has_role(auth.uid(), 'manager'::app_role) AND
    (created_by_user_id = auth.uid() OR assigned_investigator_user_id = auth.uid())
  );

-- NO DELETE POLICY - Cases cannot be deleted

-- HR Case Triage RLS
CREATE POLICY "Users can view triage for accessible cases"
  ON public.hr_case_triage FOR SELECT
  USING (can_access_hr_case(auth.uid(), hr_case_id));

CREATE POLICY "Admins and managers can create triage"
  ON public.hr_case_triage FOR INSERT
  WITH CHECK (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
    AND can_access_hr_case(auth.uid(), hr_case_id)
  );

CREATE POLICY "Admins and managers can update triage"
  ON public.hr_case_triage FOR UPDATE
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
    AND can_access_hr_case(auth.uid(), hr_case_id)
  );

-- HR Case Evidence RLS
CREATE POLICY "Users can view normal evidence for accessible cases"
  ON public.hr_case_evidence FOR SELECT
  USING (
    can_access_hr_case(auth.uid(), hr_case_id) AND
    (access_level = 'normal' OR can_access_restricted_hr_content(auth.uid()))
  );

CREATE POLICY "Admins and managers can upload evidence"
  ON public.hr_case_evidence FOR INSERT
  WITH CHECK (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
    AND can_access_hr_case(auth.uid(), hr_case_id)
  );

-- HR Case Notes RLS
CREATE POLICY "Users can view standard notes for accessible cases"
  ON public.hr_case_notes FOR SELECT
  USING (
    can_access_hr_case(auth.uid(), hr_case_id) AND
    (visibility = 'standard' OR can_access_restricted_hr_content(auth.uid()))
  );

CREATE POLICY "Admins and managers can create notes"
  ON public.hr_case_notes FOR INSERT
  WITH CHECK (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
    AND can_access_hr_case(auth.uid(), hr_case_id)
  );

-- HR Case Findings RLS
CREATE POLICY "Users can view findings for accessible cases"
  ON public.hr_case_findings FOR SELECT
  USING (can_access_hr_case(auth.uid(), hr_case_id));

CREATE POLICY "Admins can create findings"
  ON public.hr_case_findings FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    AND can_access_hr_case(auth.uid(), hr_case_id)
  );

CREATE POLICY "Admins can update findings on open cases"
  ON public.hr_case_findings FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND can_access_hr_case(auth.uid(), hr_case_id)
    AND EXISTS (
      SELECT 1 FROM public.hr_cases
      WHERE id = hr_case_id AND status != 'closed'
    )
  );

-- HR Case Actions RLS
CREATE POLICY "Users can view actions for accessible cases"
  ON public.hr_case_actions FOR SELECT
  USING (can_access_hr_case(auth.uid(), hr_case_id));

CREATE POLICY "Admins and managers can create actions"
  ON public.hr_case_actions FOR INSERT
  WITH CHECK (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
    AND can_access_hr_case(auth.uid(), hr_case_id)
  );

CREATE POLICY "Admins and managers can update actions"
  ON public.hr_case_actions FOR UPDATE
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
    AND can_access_hr_case(auth.uid(), hr_case_id)
  );

-- Indexes for performance
CREATE INDEX idx_hr_cases_organisation ON public.hr_cases(organisation_id);
CREATE INDEX idx_hr_cases_employee ON public.hr_cases(employee_id);
CREATE INDEX idx_hr_cases_status ON public.hr_cases(status);
CREATE INDEX idx_hr_cases_severity ON public.hr_cases(severity);
CREATE INDEX idx_hr_cases_investigator ON public.hr_cases(assigned_investigator_user_id);
CREATE INDEX idx_hr_case_triage_case ON public.hr_case_triage(hr_case_id);
CREATE INDEX idx_hr_case_evidence_case ON public.hr_case_evidence(hr_case_id);
CREATE INDEX idx_hr_case_notes_case ON public.hr_case_notes(hr_case_id);
CREATE INDEX idx_hr_case_findings_case ON public.hr_case_findings(hr_case_id);
CREATE INDEX idx_hr_case_actions_case ON public.hr_case_actions(hr_case_id);
CREATE INDEX idx_hr_case_actions_status ON public.hr_case_actions(status);

-- Trigger to update updated_at
CREATE TRIGGER update_hr_cases_updated_at
  BEFORE UPDATE ON public.hr_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_case_triage_updated_at
  BEFORE UPDATE ON public.hr_case_triage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_case_findings_updated_at
  BEFORE UPDATE ON public.hr_case_findings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_case_actions_updated_at
  BEFORE UPDATE ON public.hr_case_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate case number
CREATE OR REPLACE FUNCTION public.generate_hr_case_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  case_count INTEGER;
  year_str TEXT;
BEGIN
  year_str := to_char(CURRENT_DATE, 'YYYY');
  
  SELECT COUNT(*) + 1 INTO case_count
  FROM public.hr_cases
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  NEW.case_number := 'HR-' || year_str || '-' || LPAD(case_count::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_hr_case_number_trigger
  BEFORE INSERT ON public.hr_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_hr_case_number();

-- Create storage bucket for HR case evidence
INSERT INTO storage.buckets (id, name, public)
VALUES ('hr-case-evidence', 'hr-case-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for HR case evidence
CREATE POLICY "Admins and managers can upload HR evidence"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'hr-case-evidence' AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  );

CREATE POLICY "Admins and managers can view HR evidence"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'hr-case-evidence' AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  );

CREATE POLICY "Admins can delete HR evidence"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'hr-case-evidence' AND
    has_role(auth.uid(), 'admin'::app_role)
  );