import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { auditService } from '@/services/auditService';
import { toast } from '@/hooks/use-toast';
import type { TimesheetDB, CreateTimesheetInput } from '@/types/database';

/**
 * Hook for managing timesheets with Supabase persistence.
 * Replaces mock data with real database operations.
 * All mutations are audit-logged.
 */
export function useSupabaseTimesheets(organisationId?: string) {
  const queryClient = useQueryClient();

  // Get current organisation
  const { data: defaultOrg } = useQuery({
    queryKey: ['default-organisation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organisations')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !organisationId,
  });

  const orgId = organisationId || defaultOrg?.id;

  // Fetch all timesheets
  const { 
    data: timesheets = [], 
    isLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: ['timesheets', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await supabase
        .from('timesheets')
        .select('*')
        .eq('organisation_id', orgId)
        .order('date', { ascending: false });
      
      if (error) {
        console.error('[useSupabaseTimesheets] Failed to fetch timesheets:', error);
        throw error;
      }
      
      return (data || []) as TimesheetDB[];
    },
    enabled: !!orgId,
  });

  // Create timesheet mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateTimesheetInput) => {
      // Calculate total hours if clock_out is provided
      let totalHours = input.total_hours;
      if (input.clock_in && input.clock_out && !totalHours) {
        const [inHours, inMins] = input.clock_in.split(':').map(Number);
        const [outHours, outMins] = input.clock_out.split(':').map(Number);
        const inMinutes = inHours * 60 + inMins;
        const outMinutes = outHours * 60 + outMins;
        const breakMins = input.break_minutes || 0;
        totalHours = Math.max(0, (outMinutes - inMinutes - breakMins) / 60);
      }

      const { data, error } = await supabase
        .from('timesheets')
        .insert({
          ...input,
          total_hours: totalHours,
          break_minutes: input.break_minutes || 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as TimesheetDB;
    },
    onSuccess: async (newTimesheet) => {
      queryClient.invalidateQueries({ queryKey: ['timesheets', orgId] });
      
      await auditService.logTimesheetAction(
        'create',
        newTimesheet.id,
        orgId,
        undefined,
        newTimesheet as unknown as Record<string, unknown>
      );
      
      toast({
        title: 'Timesheet Created',
        description: 'Timesheet entry has been recorded.',
      });
    },
    onError: (error) => {
      console.error('[useSupabaseTimesheets] Create failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to create timesheet. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Update timesheet mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TimesheetDB> }) => {
      const { data: beforeState } = await supabase
        .from('timesheets')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('timesheets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { timesheet: data as TimesheetDB, beforeState };
    },
    onSuccess: async ({ timesheet, beforeState }) => {
      queryClient.invalidateQueries({ queryKey: ['timesheets', orgId] });
      
      await auditService.logTimesheetAction(
        'update',
        timesheet.id,
        orgId,
        beforeState as unknown as Record<string, unknown>,
        timesheet as unknown as Record<string, unknown>
      );
      
      toast({
        title: 'Timesheet Updated',
        description: 'Timesheet entry has been updated.',
      });
    },
    onError: (error) => {
      console.error('[useSupabaseTimesheets] Update failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to update timesheet. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Approve timesheet mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: beforeState } = await supabase
        .from('timesheets')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('timesheets')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { timesheet: data as TimesheetDB, beforeState };
    },
    onSuccess: async ({ timesheet, beforeState }) => {
      queryClient.invalidateQueries({ queryKey: ['timesheets', orgId] });
      
      await auditService.logTimesheetAction(
        'approve',
        timesheet.id,
        orgId,
        { status: beforeState?.status },
        { status: 'approved', approved_at: timesheet.approved_at }
      );
      
      toast({
        title: 'Timesheet Approved',
        description: 'The timesheet has been approved.',
      });
    },
    onError: (error) => {
      console.error('[useSupabaseTimesheets] Approve failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve timesheet. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Reject timesheet mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: beforeState } = await supabase
        .from('timesheets')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('timesheets')
        .update({ status: 'rejected' })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { timesheet: data as TimesheetDB, beforeState };
    },
    onSuccess: async ({ timesheet, beforeState }) => {
      queryClient.invalidateQueries({ queryKey: ['timesheets', orgId] });
      
      await auditService.logTimesheetAction(
        'reject',
        timesheet.id,
        orgId,
        { status: beforeState?.status },
        { status: 'rejected' }
      );
      
      toast({
        title: 'Timesheet Rejected',
        description: 'The timesheet has been rejected.',
      });
    },
    onError: (error) => {
      console.error('[useSupabaseTimesheets] Reject failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject timesheet. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete timesheet mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: beforeState } = await supabase
        .from('timesheets')
        .select('*')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('timesheets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, beforeState };
    },
    onSuccess: async ({ id, beforeState }) => {
      queryClient.invalidateQueries({ queryKey: ['timesheets', orgId] });
      
      await auditService.logTimesheetAction(
        'delete',
        id,
        orgId,
        beforeState as unknown as Record<string, unknown>,
        undefined
      );
      
      toast({
        title: 'Timesheet Deleted',
        description: 'The timesheet has been deleted.',
      });
    },
    onError: (error) => {
      console.error('[useSupabaseTimesheets] Delete failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete timesheet. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Get timesheets for a specific employee
  const getTimesheetsForEmployee = (employeeId: string) => {
    return timesheets.filter(t => t.employee_id === employeeId);
  };

  // Get pending timesheets
  const pendingTimesheets = timesheets.filter(t => t.status === 'pending');

  return {
    // Data
    timesheets,
    pendingTimesheets,
    getTimesheetsForEmployee,
    organisationId: orgId,
    
    // Status
    isLoading,
    error,
    
    // Actions
    createTimesheet: createMutation.mutateAsync,
    updateTimesheet: (id: string, updates: Partial<TimesheetDB>) =>
      updateMutation.mutateAsync({ id, updates }),
    approveTimesheet: approveMutation.mutateAsync,
    rejectTimesheet: rejectMutation.mutateAsync,
    deleteTimesheet: deleteMutation.mutateAsync,
    refetch,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
