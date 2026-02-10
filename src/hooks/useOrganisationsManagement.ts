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

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('[orgs][addOrganisation] getSession error', sessionError);
      return { success: false, error: sessionError };
    }
    if (!session) {
      const err = new Error('No active session');
      console.error('[orgs][addOrganisation] no session');
      return { success: false, error: err };
    }

    const newOrgId = (globalThis.crypto && 'randomUUID' in globalThis.crypto)
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const { error: insertError } = await supabase
      .from('organisations')
      .insert({ id: newOrgId, ...org });

    if (insertError) {
      console.error('Error adding organisation (verbose):', {
        code: (insertError as any)?.code,
        message: (insertError as any)?.message,
        details: (insertError as any)?.details,
        hint: (insertError as any)?.hint,
      });
      console.error('Error adding organisation:', insertError);
      return { success: false, error: insertError };
    }

    // Attach the created org to the creator's profile so org-scoped SELECT policies will work.
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ organisation_id: newOrgId })
      .eq('user_id', session.user.id)
      .is('organisation_id', null);

    if (profileError) {
      console.error('[orgs][addOrganisation] failed to attach organisation_id to profile', profileError);
      // Still refetch to reflect the insert if possible, but surface the error.
      await fetchOrganisations();
      return { success: false, error: profileError };
    }

    await fetchOrganisations();
    return { success: true, data: { id: newOrgId, ...org } as Organisation };
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
