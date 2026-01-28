-- Create enum for org document categories
CREATE TYPE public.org_document_category AS ENUM ('contract_template', 'handbook', 'policy', 'procedure', 'training', 'other');

-- Create enum for document distribution status
CREATE TYPE public.distribution_status AS ENUM ('pending', 'sent', 'viewed', 'downloaded', 'acknowledged', 'signed');

-- Create organizational documents table (the library)
CREATE TABLE public.org_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category org_document_category NOT NULL DEFAULT 'other',
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  requires_signature BOOLEAN DEFAULT false,
  requires_acknowledgment BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document distributions table (tracks who received what)
CREATE TABLE public.document_distributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_document_id UUID NOT NULL REFERENCES public.org_documents(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  status distribution_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_by UUID REFERENCES auth.users(id),
  sent_by_name TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE,
  downloaded_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_data TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_document_id, recipient_user_id)
);

-- Enable RLS
ALTER TABLE public.org_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_distributions ENABLE ROW LEVEL SECURITY;

-- Policies for org_documents
CREATE POLICY "Admins and managers can manage org documents"
  ON public.org_documents FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Employees can view active org documents assigned to them"
  ON public.org_documents FOR SELECT
  USING (
    is_active = true AND (
      has_role(auth.uid(), 'admin') OR 
      has_role(auth.uid(), 'manager') OR
      id IN (
        SELECT org_document_id FROM public.document_distributions 
        WHERE recipient_user_id = auth.uid()
      )
    )
  );

-- Policies for document_distributions
CREATE POLICY "Admins and managers can manage distributions"
  ON public.document_distributions FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Employees can view their own distributions"
  ON public.document_distributions FOR SELECT
  USING (recipient_user_id = auth.uid());

CREATE POLICY "Employees can update their own distributions"
  ON public.document_distributions FOR UPDATE
  USING (recipient_user_id = auth.uid());

-- Create triggers for updated_at
CREATE TRIGGER update_org_documents_updated_at
  BEFORE UPDATE ON public.org_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_distributions_updated_at
  BEFORE UPDATE ON public.document_distributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for org documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('org-documents', 'org-documents', false);

-- Storage policies for org-documents bucket
CREATE POLICY "Admins and managers can upload org documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'org-documents' AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Admins and managers can update org documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'org-documents' AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Admins and managers can delete org documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'org-documents' AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  );

CREATE POLICY "Users can view org documents they have access to"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'org-documents' AND
    (
      has_role(auth.uid(), 'admin') OR 
      has_role(auth.uid(), 'manager') OR
      EXISTS (
        SELECT 1 FROM public.document_distributions dd
        WHERE dd.recipient_user_id = auth.uid()
      )
    )
  );