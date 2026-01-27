-- Create table for sidebar visibility settings
CREATE TABLE public.sidebar_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text NOT NULL UNIQUE,
  module_label text NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sidebar_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can view sidebar settings (needed to render sidebar)
CREATE POLICY "Everyone can view sidebar settings"
ON public.sidebar_settings
FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify sidebar settings
CREATE POLICY "Admins can insert sidebar settings"
ON public.sidebar_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sidebar settings"
ON public.sidebar_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sidebar settings"
ON public.sidebar_settings
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_sidebar_settings_updated_at
BEFORE UPDATE ON public.sidebar_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default sidebar items
INSERT INTO public.sidebar_settings (module_key, module_label, is_visible, display_order) VALUES
  ('dashboard', 'Dashboard', true, 1),
  ('employees', 'Employees', true, 2),
  ('compliance', 'Compliance', true, 3),
  ('recruitment', 'Recruitment', true, 4),
  ('documents', 'Documents', true, 5),
  ('contracts', 'Contracts', true, 6),
  ('payroll', 'Payroll', true, 7),
  ('reports', 'Reports', true, 8);