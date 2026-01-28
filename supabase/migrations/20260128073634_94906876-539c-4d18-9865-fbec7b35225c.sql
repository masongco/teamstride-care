-- Create enum for review types
CREATE TYPE public.review_type AS ENUM ('performance', 'annual', 'probation');

-- Create enum for review status
CREATE TYPE public.review_status AS ENUM ('draft', 'in_progress', 'pending_approval', 'completed');

-- Create enum for feedback type (for 360 feedback)
CREATE TYPE public.feedback_type AS ENUM ('self', 'manager', 'peer', 'direct_report');

-- Supervisions table - tracks supervisor-employee relationships
CREATE TABLE public.supervisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supervisor_name TEXT NOT NULL,
  supervisor_email TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  employee_email TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Supervision sessions - individual 1-on-1 meetings
CREATE TABLE public.supervision_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supervision_id UUID NOT NULL REFERENCES public.supervisions(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  duration_minutes INTEGER,
  location TEXT,
  topics_discussed TEXT,
  action_items TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  next_session_date DATE,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Competencies - define the competency framework
CREATE TABLE public.competencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Performance reviews - main review records
CREATE TABLE public.performance_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_name TEXT NOT NULL,
  employee_email TEXT NOT NULL,
  employee_position TEXT,
  employee_department TEXT,
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT NOT NULL,
  review_type review_type NOT NULL DEFAULT 'performance',
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  status review_status NOT NULL DEFAULT 'draft',
  overall_rating NUMERIC(3,2),
  overall_feedback TEXT,
  strengths TEXT,
  areas_for_improvement TEXT,
  development_plan TEXT,
  employee_comments TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Goals - linked to performance reviews
CREATE TABLE public.review_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.performance_reviews(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'deferred')),
  manager_notes TEXT,
  employee_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Competency ratings - for each competency in a review
CREATE TABLE public.competency_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.performance_reviews(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
  rating NUMERIC(3,2) CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, competency_id)
);

-- 360 Feedback - peer/self/manager feedback for reviews
CREATE TABLE public.review_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.performance_reviews(id) ON DELETE CASCADE,
  feedback_type feedback_type NOT NULL,
  responder_name TEXT NOT NULL,
  responder_email TEXT NOT NULL,
  relationship_to_employee TEXT,
  overall_rating NUMERIC(3,2),
  strengths TEXT,
  areas_for_improvement TEXT,
  additional_comments TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.supervisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervision_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_feedback ENABLE ROW LEVEL SECURITY;

-- Supervisions policies
CREATE POLICY "Admins and managers can view all supervisions" 
ON public.supervisions FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Employees can view their own supervisions" 
ON public.supervisions FOR SELECT 
USING (employee_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
    OR supervisor_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text);

CREATE POLICY "Admins and managers can manage supervisions" 
ON public.supervisions FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Supervision sessions policies
CREATE POLICY "Admins and managers can view all sessions" 
ON public.supervision_sessions FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Participants can view their sessions" 
ON public.supervision_sessions FOR SELECT 
USING (supervision_id IN (
  SELECT id FROM public.supervisions 
  WHERE employee_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
     OR supervisor_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
));

CREATE POLICY "Admins and managers can manage sessions" 
ON public.supervision_sessions FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Competencies policies (viewable by all, managed by admins/managers)
CREATE POLICY "Authenticated users can view competencies" 
ON public.competencies FOR SELECT 
USING (true);

CREATE POLICY "Admins and managers can manage competencies" 
ON public.competencies FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Performance reviews policies
CREATE POLICY "Admins and managers can view all reviews" 
ON public.performance_reviews FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Employees can view their own reviews" 
ON public.performance_reviews FOR SELECT 
USING (employee_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text);

CREATE POLICY "Reviewers can view reviews they created" 
ON public.performance_reviews FOR SELECT 
USING (reviewer_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text);

CREATE POLICY "Admins and managers can manage reviews" 
ON public.performance_reviews FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Review goals policies
CREATE POLICY "Admins and managers can view all goals" 
ON public.review_goals FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Employees can view their own goals" 
ON public.review_goals FOR SELECT 
USING (review_id IN (
  SELECT id FROM public.performance_reviews 
  WHERE employee_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
));

CREATE POLICY "Admins and managers can manage goals" 
ON public.review_goals FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Competency ratings policies
CREATE POLICY "Admins and managers can view all ratings" 
ON public.competency_ratings FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Employees can view their own ratings" 
ON public.competency_ratings FOR SELECT 
USING (review_id IN (
  SELECT id FROM public.performance_reviews 
  WHERE employee_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
));

CREATE POLICY "Admins and managers can manage ratings" 
ON public.competency_ratings FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Review feedback policies (360 feedback)
CREATE POLICY "Admins and managers can view all feedback" 
ON public.review_feedback FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Employees can view non-anonymous feedback for their reviews" 
ON public.review_feedback FOR SELECT 
USING (
  is_anonymous = false AND 
  review_id IN (
    SELECT id FROM public.performance_reviews 
    WHERE employee_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
  )
);

CREATE POLICY "Responders can view and manage their own feedback" 
ON public.review_feedback FOR ALL 
USING (responder_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text);

CREATE POLICY "Admins and managers can manage feedback" 
ON public.review_feedback FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Create triggers for updated_at
CREATE TRIGGER update_supervisions_updated_at
BEFORE UPDATE ON public.supervisions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supervision_sessions_updated_at
BEFORE UPDATE ON public.supervision_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_competencies_updated_at
BEFORE UPDATE ON public.competencies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_reviews_updated_at
BEFORE UPDATE ON public.performance_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_review_goals_updated_at
BEFORE UPDATE ON public.review_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_competency_ratings_updated_at
BEFORE UPDATE ON public.competency_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_review_feedback_updated_at
BEFORE UPDATE ON public.review_feedback
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default competencies for disability/community support work
INSERT INTO public.competencies (name, description, category, display_order) VALUES
('Person-Centred Support', 'Demonstrates commitment to individualized care and respecting participant choices', 'Core Skills', 1),
('Communication', 'Effectively communicates with participants, families, and team members', 'Core Skills', 2),
('Safety & Risk Management', 'Identifies and manages risks while maintaining participant safety', 'Core Skills', 3),
('Documentation & Reporting', 'Maintains accurate records and reports incidents appropriately', 'Compliance', 4),
('NDIS Knowledge', 'Understands NDIS guidelines, participant plans, and funding requirements', 'Compliance', 5),
('Professional Boundaries', 'Maintains appropriate boundaries while building rapport', 'Professional', 6),
('Teamwork & Collaboration', 'Works effectively with colleagues and other service providers', 'Professional', 7),
('Initiative & Problem Solving', 'Takes initiative and finds creative solutions to challenges', 'Growth', 8),
('Cultural Sensitivity', 'Respects and responds to diverse cultural backgrounds', 'Core Skills', 9),
('Time Management', 'Manages time effectively and arrives punctually for shifts', 'Professional', 10);