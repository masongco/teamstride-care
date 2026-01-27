import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contract, Signature, ContractAuditLog } from '@/types/contracts';
import { toast } from '@/hooks/use-toast';

export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts((data || []) as Contract[]);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch contracts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createContract = async (contract: Omit<Contract, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('contracts')
        .insert({
          ...contract,
          status: 'pending_signature',
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log creation
      await logAuditEvent((data as Contract).id, 'created', 'Contract created and sent for signature');

      setContracts(prev => [data as Contract, ...prev]);
      
      toast({
        title: 'Contract Created',
        description: 'Contract has been created and sent for signature',
      });

      return data as Contract;
    } catch (error) {
      console.error('Error creating contract:', error);
      toast({
        title: 'Error',
        description: 'Failed to create contract',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signContract = async (
    contractId: string, 
    signatureData: string, 
    signatureType: 'drawn' | 'typed',
    signerName: string,
    signerEmail: string
  ) => {
    try {
      // Create signature record
      const { error: sigError } = await supabase
        .from('signatures')
        .insert({
          contract_id: contractId,
          signer_name: signerName,
          signer_email: signerEmail,
          signature_data: signatureData,
          signature_type: signatureType,
          user_agent: navigator.userAgent,
        });

      if (sigError) throw sigError;

      // Update contract status
      const { error: contractError } = await supabase
        .from('contracts')
        .update({
          status: 'signed',
          signed_at: new Date().toISOString(),
        })
        .eq('id', contractId);

      if (contractError) throw contractError;

      // Log signing event
      await logAuditEvent(contractId, 'signed', 'Contract signed by employee', {
        signer_name: signerName,
        signature_type: signatureType,
      });

      // Refresh contracts
      await fetchContracts();

      toast({
        title: 'Contract Signed',
        description: 'The contract has been successfully signed',
      });
    } catch (error) {
      console.error('Error signing contract:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign contract',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const getSignature = async (contractId: string): Promise<Signature | null> => {
    try {
      const { data, error } = await supabase
        .from('signatures')
        .select('*')
        .eq('contract_id', contractId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as Signature | null;
    } catch (error) {
      console.error('Error fetching signature:', error);
      return null;
    }
  };

  const getAuditLogs = async (contractId: string): Promise<ContractAuditLog[]> => {
    try {
      const { data, error } = await supabase
        .from('contract_audit_log')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ContractAuditLog[];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  };

  const logAuditEvent = async (
    contractId: string, 
    action: string, 
    description?: string,
    details?: Record<string, string | number | boolean>
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const logDetails = details || (description ? { description } : null);
      
      await supabase.from('contract_audit_log').insert([{
        contract_id: contractId,
        action,
        actor_email: userData.user?.email,
        actor_name: userData.user?.user_metadata?.full_name,
        details: logDetails as Record<string, string | number | boolean> | null,
        user_agent: navigator.userAgent,
      }]);
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  return {
    contracts,
    isLoading,
    createContract,
    signContract,
    getSignature,
    getAuditLogs,
    logAuditEvent,
    refetch: fetchContracts,
  };
}
