-- Create award_classifications table for pay rates and conditions
CREATE TABLE public.award_classifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  base_hourly_rate NUMERIC(10,2) NOT NULL,
  saturday_multiplier NUMERIC(4,2) DEFAULT 1.5,
  sunday_multiplier NUMERIC(4,2) DEFAULT 2.0,
  public_holiday_multiplier NUMERIC(4,2) DEFAULT 2.5,
  evening_multiplier NUMERIC(4,2) DEFAULT 1.15,
  night_multiplier NUMERIC(4,2) DEFAULT 1.25,
  overtime_multiplier NUMERIC(4,2) DEFAULT 1.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.award_classifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for award_classifications (authenticated users can CRUD)
CREATE POLICY "Authenticated users can view award classifications" 
ON public.award_classifications FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create award classifications" 
ON public.award_classifications FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update award classifications" 
ON public.award_classifications FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete award classifications" 
ON public.award_classifications FOR DELETE 
TO authenticated
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_award_classifications_updated_at
BEFORE UPDATE ON public.award_classifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();