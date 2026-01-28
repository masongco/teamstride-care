import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type OrgDocument = Database['public']['Tables']['org_documents']['Row'];
type OrgDocumentInsert = Database['public']['Tables']['org_documents']['Insert'];
type OrgDocumentUpdate = Database['public']['Tables']['org_documents']['Update'];
type DocumentDistribution = Database['public']['Tables']['document_distributions']['Row'];
type DistributionInsert = Database['public']['Tables']['document_distributions']['Insert'];
type DistributionUpdate = Database['public']['Tables']['document_distributions']['Update'];

export function useOrgDocuments() {
  const [documents, setDocuments] = useState<OrgDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('org_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching org documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = async (
    file: File,
    metadata: Omit<OrgDocumentInsert, 'file_url' | 'file_name' | 'file_size' | 'mime_type'>
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      const userEmail = userData?.user?.email;

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('org-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('org-documents')
        .getPublicUrl(filePath);

      // Create document record
      const { data, error } = await supabase
        .from('org_documents')
        .insert({
          ...metadata,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: userId,
          uploaded_by_name: userEmail,
        })
        .select()
        .single();

      if (error) throw error;

      setDocuments(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });
      return data;
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateDocument = async (id: string, updates: OrgDocumentUpdate) => {
    try {
      const { data, error } = await supabase
        .from('org_documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setDocuments(prev => prev.map(doc => doc.id === id ? data : doc));
      toast({
        title: 'Success',
        description: 'Document updated successfully',
      });
      return data;
    } catch (error: any) {
      console.error('Error updating document:', error);
      toast({
        title: 'Error',
        description: 'Failed to update document',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from('org_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    documents,
    loading,
    refetch: fetchDocuments,
    uploadDocument,
    updateDocument,
    deleteDocument,
  };
}

export function useDocumentDistributions(documentId?: string) {
  const [distributions, setDistributions] = useState<DocumentDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDistributions = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('document_distributions')
        .select('*')
        .order('created_at', { ascending: false });

      if (documentId) {
        query = query.eq('org_document_id', documentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDistributions(data || []);
    } catch (error: any) {
      console.error('Error fetching distributions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load distributions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [documentId, toast]);

  useEffect(() => {
    fetchDistributions();
  }, [fetchDistributions]);

  const createDistribution = async (distribution: DistributionInsert) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('document_distributions')
        .insert({
          ...distribution,
          sent_by: userData?.user?.id,
          sent_by_name: userData?.user?.email,
          sent_at: new Date().toISOString(),
          status: 'sent',
        })
        .select()
        .single();

      if (error) throw error;

      setDistributions(prev => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Document distributed successfully',
      });
      return data;
    } catch (error: any) {
      console.error('Error creating distribution:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to distribute document',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateDistribution = async (id: string, updates: DistributionUpdate) => {
    try {
      const { data, error } = await supabase
        .from('document_distributions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setDistributions(prev => prev.map(d => d.id === id ? data : d));
      return data;
    } catch (error: any) {
      console.error('Error updating distribution:', error);
      toast({
        title: 'Error',
        description: 'Failed to update distribution',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    distributions,
    loading,
    refetch: fetchDistributions,
    createDistribution,
    updateDistribution,
  };
}
