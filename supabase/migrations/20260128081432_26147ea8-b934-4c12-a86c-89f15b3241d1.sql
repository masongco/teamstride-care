-- Create employee_goals table for personal development tracking
CREATE TABLE public.employee_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'professional',
  target_date DATE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  milestones JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.employee_goals ENABLE ROW LEVEL SECURITY;

-- Employees can view their own goals
CREATE POLICY "Employees can view their own goals"
ON public.employee_goals
FOR SELECT
USING (user_id = auth.uid());

-- Employees can create their own goals
CREATE POLICY "Employees can create their own goals"
ON public.employee_goals
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Employees can update their own goals
CREATE POLICY "Employees can update their own goals"
ON public.employee_goals
FOR UPDATE
USING (user_id = auth.uid());

-- Employees can delete their own goals
CREATE POLICY "Employees can delete their own goals"
ON public.employee_goals
FOR DELETE
USING (user_id = auth.uid());

-- Admins and managers can view all goals
CREATE POLICY "Admins and managers can view all goals"
ON public.employee_goals
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_employee_goals_updated_at
BEFORE UPDATE ON public.employee_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();