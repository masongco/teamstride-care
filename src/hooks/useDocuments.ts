import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  DocumentType, 
  EmployeeDocument, 
  DocumentVersion, 
  DocumentReview,
  ComplianceRule,
  DocumentStatus 
} from '@/types/portal';

export function useDocumentTypes(
  _organisationId?: string,
  options?: { category?: string },
) {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDocumentTypes = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('document_types')
        .select('*')
        .eq('is_active', true);

      if (options?.category) {
        query = query.eq('category', options.category);
      }

      const { data, error } = await query.order('display_order', { ascending: true });

      if (error) throw error;
      setDocumentTypes(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching document types',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, options?.category]);

  const createDocumentType = async (docType: Omit<DocumentType, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('document_types')
        .insert(docType)
        .select()
        .single();

      if (error) throw error;
      setDocumentTypes(prev => [...prev, data].sort((a, b) => a.display_order - b.display_order));
      toast({ title: 'Document type created' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error creating document type',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateDocumentType = async (id: string, updates: Partial<DocumentType>) => {
    try {
      const { data, error } = await supabase
        .from('document_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setDocumentTypes(prev => 
        prev.map(dt => dt.id === id ? data : dt).sort((a, b) => a.display_order - b.display_order)
      );
      toast({ title: 'Document type updated' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error updating document type',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteDocumentType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('document_types')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      setDocumentTypes(prev => prev.filter(dt => dt.id !== id));
      toast({ title: 'Document type removed' });
      return true;
    } catch (error: any) {
      toast({
        title: 'Error removing document type',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchDocumentTypes();
  }, [fetchDocumentTypes]);

  return { documentTypes, loading, fetchDocumentTypes, createDocumentType, updateDocumentType, deleteDocumentType };
}

export function useEmployeeDocuments(userId?: string) {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('employee_documents')
        .select(`
          *,
          document_type:document_types(*)
        `)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching documents',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const uploadDocument = async (
    file: File,
    documentTypeId: string,
    issueDate?: string,
    expiryDate?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${documentTypeId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('employee-documents')
        .getPublicUrl(filePath);

      // Create document record
      const { data, error } = await supabase
        .from('employee_documents')
        .insert({
          user_id: user.id,
          document_type_id: documentTypeId,
          file_url: publicUrl,
          file_name: file.name,
          issue_date: issueDate || null,
          expiry_date: expiryDate || null,
          status: 'pending' as DocumentStatus,
        })
        .select(`*, document_type:document_types(*)`)
        .single();

      if (error) throw error;

      // Create initial version
      await supabase.from('document_versions').insert({
        document_id: data.id,
        version_number: 1,
        file_url: publicUrl,
        file_name: file.name,
        uploaded_by: user.id,
      });

      setDocuments(prev => [data, ...prev]);
      toast({ title: 'Document uploaded successfully' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error uploading document',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const replaceDocument = async (documentId: string, file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const existingDoc = documents.find(d => d.id === documentId);
      if (!existingDoc) throw new Error('Document not found');

      // Upload new file
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${existingDoc.document_type_id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('employee-documents')
        .getPublicUrl(filePath);

      const newVersion = existingDoc.current_version + 1;

      // Update document record
      const { data, error } = await supabase
        .from('employee_documents')
        .update({
          file_url: publicUrl,
          file_name: file.name,
          current_version: newVersion,
          status: 'pending' as DocumentStatus,
        })
        .eq('id', documentId)
        .select(`*, document_type:document_types(*)`)
        .single();

      if (error) throw error;

      // Create new version record
      await supabase.from('document_versions').insert({
        document_id: documentId,
        version_number: newVersion,
        file_url: publicUrl,
        file_name: file.name,
        uploaded_by: user.id,
      });

      setDocuments(prev => prev.map(d => d.id === documentId ? data : d));
      toast({ title: 'Document replaced successfully' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error replacing document',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('employee_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
      setDocuments(prev => prev.filter(d => d.id !== documentId));
      toast({ title: 'Document deleted' });
      return true;
    } catch (error: any) {
      toast({
        title: 'Error deleting document',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const reviewDocument = async (
    documentId: string, 
    action: 'approved' | 'rejected', 
    comments?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update document status
      const { data, error } = await supabase
        .from('employee_documents')
        .update({ status: action })
        .eq('id', documentId)
        .select(`*, document_type:document_types(*)`)
        .single();

      if (error) throw error;

      // Create review record
      await supabase.from('document_reviews').insert({
        document_id: documentId,
        reviewer_id: user.id,
        reviewer_name: user.user_metadata?.display_name || user.email || 'Unknown',
        reviewer_email: user.email || '',
        action,
        comments,
      });

      setDocuments(prev => prev.map(d => d.id === documentId ? data : d));
      toast({ title: `Document ${action}` });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error reviewing document',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return { 
    documents, 
    loading, 
    fetchDocuments, 
    uploadDocument, 
    replaceDocument, 
    deleteDocument,
    reviewDocument 
  };
}

export function useDocumentVersions(documentId?: string) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchVersions = useCallback(async () => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching document versions',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [documentId, toast]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  return { versions, loading, fetchVersions };
}

export function useDocumentReviews(documentId?: string) {
  const [reviews, setReviews] = useState<DocumentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReviews = useCallback(async () => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('document_reviews')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching document reviews',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [documentId, toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, loading, fetchReviews };
}

export function useComplianceRules(_organisationId?: string) {
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('compliance_rules')
        .select(`
          *,
          document_type:document_types(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching compliance rules',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createRule = async (rule: Omit<ComplianceRule, 'id' | 'created_at' | 'updated_at' | 'document_type'>) => {
    try {
      const { data, error } = await supabase
        .from('compliance_rules')
        .insert(rule)
        .select(`*, document_type:document_types(*)`)
        .single();

      if (error) throw error;
      setRules(prev => [data, ...prev]);
      toast({ title: 'Requirement created' });
      return data;
    } catch (error: any) {
      toast({
        title: 'Error creating compliance rule',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('compliance_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRules(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Requirement deleted' });
      return true;
    } catch (error: any) {
      toast({
        title: 'Error deleting compliance rule',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return { rules, loading, fetchRules, createRule, deleteRule };
}
