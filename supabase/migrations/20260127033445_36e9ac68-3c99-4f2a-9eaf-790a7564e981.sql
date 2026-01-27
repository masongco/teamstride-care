-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create positions table
CREATE TABLE public.positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Policies for departments (authenticated users can CRUD)
CREATE POLICY "Authenticated users can view departments" 
ON public.departments FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create departments" 
ON public.departments FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update departments" 
ON public.departments FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete departments" 
ON public.departments FOR DELETE 
TO authenticated
USING (true);

-- Policies for positions (authenticated users can CRUD)
CREATE POLICY "Authenticated users can view positions" 
ON public.positions FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create positions" 
ON public.positions FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update positions" 
ON public.positions FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete positions" 
ON public.positions FOR DELETE 
TO authenticated
USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON public.departments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_positions_updated_at
BEFORE UPDATE ON public.positions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();