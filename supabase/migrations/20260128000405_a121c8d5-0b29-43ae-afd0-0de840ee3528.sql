-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Everyone can view sidebar settings" ON public.sidebar_settings;

-- Create a new policy that requires authentication
CREATE POLICY "Authenticated users can view sidebar settings"
ON public.sidebar_settings
FOR SELECT
TO authenticated
USING (true);