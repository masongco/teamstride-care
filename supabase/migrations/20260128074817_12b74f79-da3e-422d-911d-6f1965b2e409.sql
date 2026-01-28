-- =============================================================================
-- EMPLOYEE SELF-SERVICE PORTAL + LMS SCHEMA
-- =============================================================================

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE public.document_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
CREATE TYPE public.module_type AS ENUM ('video', 'pdf', 'policy', 'quiz');
CREATE TYPE public.assignment_status AS ENUM ('assigned', 'in_progress', 'completed', 'overdue');
CREATE TYPE public.assignment_target_type AS ENUM ('individual', 'team', 'role', 'department', 'location', 'all');
CREATE TYPE public.recurrence_type AS ENUM ('none', 'annual', 'biannual', 'quarterly', 'monthly');

-- =============================================================================
-- DOCUMENT MANAGEMENT
-- =============================================================================

-- Document Types (configurable categories)
CREATE TABLE public.document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  validity_months INTEGER, -- How long before expiry (null = no expiry)
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Compliance Rules (required docs by role/location/department)
CREATE TABLE public.compliance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type_id UUID REFERENCES public.document_types(id) ON DELETE CASCADE NOT NULL,
  target_type assignment_target_type NOT NULL,
  target_value TEXT, -- role name, department id, location, or null for 'all'
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Employee Documents
CREATE TABLE public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_type_id UUID REFERENCES public.document_types(id) ON DELETE RESTRICT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  status document_status DEFAULT 'pending' NOT NULL,
  current_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Document Versions (version history)
CREATE TABLE public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.employee_documents(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Document Reviews (approval/rejection records)
CREATE TABLE public.document_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.employee_documents(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID NOT NULL,
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT NOT NULL,
  action document_status NOT NULL,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================================================
-- LMS - COURSES & MODULES
-- =============================================================================

-- Courses
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  estimated_duration_minutes INTEGER,
  pass_mark INTEGER DEFAULT 80, -- Quiz pass percentage
  is_published BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Course Modules (ordered content within a course)
CREATE TABLE public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  module_type module_type NOT NULL,
  content_url TEXT, -- URL for video/PDF
  content_text TEXT, -- Policy text for acknowledgement
  is_required BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Quiz Questions (question bank per module)
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice', -- multiple_choice, true_false
  options JSONB NOT NULL DEFAULT '[]', -- Array of {text, is_correct}
  explanation TEXT, -- Shown after answering
  points INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================================================
-- LMS - ASSIGNMENTS & PROGRESS
-- =============================================================================

-- Course Assignments (who needs to complete what)
CREATE TABLE public.course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  target_type assignment_target_type NOT NULL,
  target_value TEXT, -- user_id, role name, department_id, location, or null for 'all'
  assigned_by UUID,
  assigned_by_name TEXT,
  due_date DATE,
  recurrence recurrence_type DEFAULT 'none',
  auto_assign_on_hire BOOLEAN DEFAULT false,
  is_mandatory BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- User Course Assignments (individual assignment records)
CREATE TABLE public.user_course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  assignment_id UUID REFERENCES public.course_assignments(id) ON DELETE SET NULL,
  status assignment_status DEFAULT 'assigned' NOT NULL,
  due_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  progress_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, course_id, assignment_id)
);

-- Module Completions (track which modules are done)
CREATE TABLE public.module_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE NOT NULL,
  user_assignment_id UUID REFERENCES public.user_course_assignments(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  policy_acknowledged_at TIMESTAMPTZ, -- For policy modules
  time_spent_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, module_id, user_assignment_id)
);

-- Quiz Attempts
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE NOT NULL,
  user_assignment_id UUID REFERENCES public.user_course_assignments(id) ON DELETE CASCADE,
  attempt_number INTEGER DEFAULT 1,
  score INTEGER,
  max_score INTEGER,
  percentage NUMERIC(5,2),
  passed BOOLEAN,
  answers JSONB DEFAULT '[]', -- Array of {question_id, selected_option, is_correct}
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- info, warning, error, success
  category TEXT, -- training, document, compliance, system
  link TEXT, -- Optional link to related page
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================================================
-- AUDIT LOGS
-- =============================================================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- document, course, quiz, assignment, etc.
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================================================
-- STORAGE BUCKET FOR DOCUMENTS
-- =============================================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('employee-documents', 'employee-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-content', 'course-content', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- ENABLE RLS
-- =============================================================================

ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES - DOCUMENT TYPES & COMPLIANCE RULES (Admin/Manager manage, all view)
-- =============================================================================

CREATE POLICY "Authenticated users can view document types"
ON public.document_types FOR SELECT
USING (true);

CREATE POLICY "Admins and managers can manage document types"
ON public.document_types FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Authenticated users can view compliance rules"
ON public.compliance_rules FOR SELECT
USING (true);

CREATE POLICY "Admins and managers can manage compliance rules"
ON public.compliance_rules FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- =============================================================================
-- RLS POLICIES - EMPLOYEE DOCUMENTS
-- =============================================================================

CREATE POLICY "Employees can view their own documents"
ON public.employee_documents FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins and managers can view all documents"
ON public.employee_documents FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Employees can upload their own documents"
ON public.employee_documents FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Employees can update their pending documents"
ON public.employee_documents FOR UPDATE
USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins and managers can update any document"
ON public.employee_documents FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Employees can delete their pending documents"
ON public.employee_documents FOR DELETE
USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can delete any document"
ON public.employee_documents FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- =============================================================================
-- RLS POLICIES - DOCUMENT VERSIONS
-- =============================================================================

CREATE POLICY "Users can view versions of their documents"
ON public.document_versions FOR SELECT
USING (
  document_id IN (SELECT id FROM public.employee_documents WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'manager')
);

CREATE POLICY "Users can create versions of their documents"
ON public.document_versions FOR INSERT
WITH CHECK (
  document_id IN (SELECT id FROM public.employee_documents WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'manager')
);

-- =============================================================================
-- RLS POLICIES - DOCUMENT REVIEWS
-- =============================================================================

CREATE POLICY "Users can view reviews of their documents"
ON public.document_reviews FOR SELECT
USING (
  document_id IN (SELECT id FROM public.employee_documents WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins and managers can create reviews"
ON public.document_reviews FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- =============================================================================
-- RLS POLICIES - COURSES & MODULES
-- =============================================================================

CREATE POLICY "Authenticated users can view published courses"
ON public.courses FOR SELECT
USING (is_published = true OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can manage courses"
ON public.courses FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Authenticated users can view course modules"
ON public.course_modules FOR SELECT
USING (
  course_id IN (SELECT id FROM public.courses WHERE is_published = true)
  OR has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins and managers can manage course modules"
ON public.course_modules FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Authenticated users can view quiz questions for assigned courses"
ON public.quiz_questions FOR SELECT
USING (
  module_id IN (
    SELECT cm.id FROM public.course_modules cm
    JOIN public.courses c ON cm.course_id = c.id
    WHERE c.is_published = true
  )
  OR has_role(auth.uid(), 'admin') 
  OR has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins and managers can manage quiz questions"
ON public.quiz_questions FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- =============================================================================
-- RLS POLICIES - ASSIGNMENTS
-- =============================================================================

CREATE POLICY "Authenticated users can view course assignments"
ON public.course_assignments FOR SELECT
USING (true);

CREATE POLICY "Admins and managers can manage course assignments"
ON public.course_assignments FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Users can view their own course assignments"
ON public.user_course_assignments FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can manage user assignments"
ON public.user_course_assignments FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Users can update their own assignment progress"
ON public.user_course_assignments FOR UPDATE
USING (user_id = auth.uid());

-- =============================================================================
-- RLS POLICIES - PROGRESS & ATTEMPTS
-- =============================================================================

CREATE POLICY "Users can view their own module completions"
ON public.module_completions FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Users can create their own module completions"
ON public.module_completions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own quiz attempts"
ON public.quiz_attempts FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Users can create their own quiz attempts"
ON public.quiz_attempts FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own quiz attempts"
ON public.quiz_attempts FOR UPDATE
USING (user_id = auth.uid());

-- =============================================================================
-- RLS POLICIES - NOTIFICATIONS
-- =============================================================================

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Admins and managers can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager') OR user_id = auth.uid());

-- =============================================================================
-- RLS POLICIES - AUDIT LOGS (immutable, admins only read)
-- =============================================================================

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- =============================================================================
-- STORAGE POLICIES
-- =============================================================================

-- Employee documents bucket (private)
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'employee-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'employee-documents' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'manager')
  )
);

CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'employee-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'employee-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Course content bucket (public read, admin write)
CREATE POLICY "Anyone can view course content"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-content');

CREATE POLICY "Admins and managers can upload course content"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'course-content' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')));

CREATE POLICY "Admins and managers can update course content"
ON storage.objects FOR UPDATE
USING (bucket_id = 'course-content' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')));

CREATE POLICY "Admins and managers can delete course content"
ON storage.objects FOR DELETE
USING (bucket_id = 'course-content' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')));

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

CREATE TRIGGER update_document_types_updated_at
  BEFORE UPDATE ON public.document_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_rules_updated_at
  BEFORE UPDATE ON public.compliance_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_documents_updated_at
  BEFORE UPDATE ON public.employee_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_modules_updated_at
  BEFORE UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quiz_questions_updated_at
  BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_assignments_updated_at
  BEFORE UPDATE ON public.course_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_course_assignments_updated_at
  BEFORE UPDATE ON public.user_course_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- SEED DATA - DEFAULT DOCUMENT TYPES
-- =============================================================================

INSERT INTO public.document_types (name, description, validity_months, is_required, display_order) VALUES
('Police Check', 'National Police Certificate', 36, true, 1),
('NDIS Worker Screening', 'NDIS Worker Screening Check clearance', 60, true, 2),
('Working with Children Check', 'WWCC clearance', 60, true, 3),
('First Aid Certificate', 'First Aid and CPR certification', 12, true, 4),
('CPR Certificate', 'CPR certification (if separate from First Aid)', 12, false, 5),
('Driver License', 'Current driver license', NULL, false, 6),
('Qualification Certificate', 'Relevant qualification (Cert III/IV, Diploma)', NULL, false, 7),
('Visa/Work Rights', 'Visa or work rights documentation', NULL, false, 8),
('COVID-19 Vaccination', 'COVID-19 vaccination certificate', NULL, false, 9),
('Manual Handling Certificate', 'Manual handling training certificate', 24, false, 10),
('Medication Administration', 'Medication administration training', 24, false, 11)
ON CONFLICT DO NOTHING;