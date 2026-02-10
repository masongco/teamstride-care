import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Define a TypeScript interface for the Organisation shape.
export interface Organisation {
  id: string;
  legal_name: string;
  trading_name?: string;
  timezone?: string;
}

// Hook implementation
export function useOrganisationsManagement(organisationId?: string) {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const logAuthContext = async (label: string) => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.warn(`[orgs][${label}] getSession error`, error);
        return;
      }
      console.log(`[orgs][${label}] session`, {
        hasSession: !!session,
        uid: session?.user?.id,
        email: session?.user?.email,
        role: session?.user?.role,
      });
    } catch (e) {
      console.warn(`[orgs][${label}] getSession threw`, e);
    }
  };

  // Fetch organisations from the database on mount
  const fetchOrganisations = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('organisations')
      .select('*')
      .order('created_at', { ascending: true });

    if (organisationId) {
      query = query.eq('id', organisationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching organisations:', error);
    } else {
      setOrganisations(data || []);
    }

    setLoading(false);
  }, [organisationId]);

  useEffect(() => {
    fetchOrganisations();
  }, [fetchOrganisations]);

  // Add a new organisation
  const addOrganisation = async (org: Omit<Organisation, 'id'>) => {
    await logAuthContext('addOrganisation');
    console.log('[orgs][addOrganisation] payload', org);

    const { data, error } = await supabase
      .from('organisations')
      .insert(org)
      .select('*')
      .single();

    if (error) {
      console.error('Error adding organisation (verbose):', {
        code: (error as any)?.code,
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
      });
      console.error('Error adding organisation:', error);
      return { success: false, error };
    }

    setOrganisations((prev) => [...prev, data]);
    return { success: true, data };
  };

  // Update an existing organisation by id
  const updateOrganisation = async (id: string, updates: Omit<Organisation, 'id'>) => {
    const { data, error } = await supabase
      .from('organisations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating organisation:', error);
      return { success: false, error };
    }

    setOrganisations((prev) =>
      prev.map((org) => (org.id === id ? data : org))
    );

    return { success: true, data };
  };

  // Delete an organisation by id
  const deleteOrganisation = async (id: string) => {
    const { error } = await supabase
      .from('organisations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting organisation:', error);
      return { success: false, error };
    }

    setOrganisations((prev) => prev.filter((org) => org.id !== id));
    return { success: true };
  };

  return {
    organisations,
    loading,
    addOrganisation,
    updateOrganisation,
    deleteOrganisation,
  };
}
