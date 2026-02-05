import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { leaveService } from '@/services/leaveService';
import { useToast } from '@/hooks/use-toast';
import type { LeaveApprovalPayload, LeaveAdjustmentPayload } from '@/types/leave';

export function useLeave(
  organisationId?: string,
  options?: { skipFallback?: boolean },
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get organisation ID if not provided
  const shouldUseFallback = !organisationId && !options?.skipFallback;
  const { data: orgData } = useQuery({
    queryKey: ['organisation'],
    queryFn: async () => {
      const { data } = await supabase
        .from('organisations')
        .select('id')
        .limit(1)
        .single();
      return data;
    },
    enabled: shouldUseFallback,
  });

  const effectiveOrgId = organisationId || orgData?.id;

  // Leave Types
  const {
    data: leaveTypes = [],
    isLoading: leaveTypesLoading,
  } = useQuery({
    queryKey: ['leaveTypes', effectiveOrgId],
    queryFn: () => leaveService.getLeaveTypes(effectiveOrgId!),
    enabled: !!effectiveOrgId,
  });

  // Leave Requests
  const {
    data: leaveRequests = [],
    isLoading: requestsLoading,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['leaveRequests', effectiveOrgId],
    queryFn: () => leaveService.getLeaveRequests(effectiveOrgId!),
    enabled: !!effectiveOrgId,
  });

  // Leave Balances
  const {
    data: leaveBalances = [],
    isLoading: balancesLoading,
    refetch: refetchBalances,
  } = useQuery({
    queryKey: ['leaveBalances', effectiveOrgId],
    queryFn: () => leaveService.getOrganisationBalances(effectiveOrgId!),
    enabled: !!effectiveOrgId,
  });

  // Leave Adjustments
  const {
    data: adjustments = [],
    isLoading: adjustmentsLoading,
  } = useQuery({
    queryKey: ['leaveAdjustments', effectiveOrgId],
    queryFn: () => leaveService.getAdjustments(effectiveOrgId!),
    enabled: !!effectiveOrgId,
  });

  // Create Leave Request
  const createRequestMutation = useMutation({
    mutationFn: async (params: {
      employeeId: string;
      leaveTypeId: string;
      startDate: string;
      endDate: string;
      hours: number;
      reason?: string;
    }) => {
      if (!effectiveOrgId) throw new Error('No organisation ID');
      return leaveService.createLeaveRequest(
        effectiveOrgId,
        params.employeeId,
        params.leaveTypeId,
        params.startDate,
        params.endDate,
        params.hours,
        params.reason
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      toast({
        title: 'Leave request submitted',
        description: 'Your request is pending approval.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to submit request',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Process Leave Decision (approve/reject/cancel)
  const processDecisionMutation = useMutation({
    mutationFn: async (payload: LeaveApprovalPayload) => {
      if (!effectiveOrgId) throw new Error('No organisation ID');
      return leaveService.processLeaveDecision(payload, effectiveOrgId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] });
      
      const actionLabels = {
        approved: 'approved',
        rejected: 'rejected',
        cancelled: 'cancelled',
      };
      
      toast({
        title: `Leave request ${actionLabels[data.status as keyof typeof actionLabels]}`,
        description: data.status === 'approved' 
          ? 'Balance has been deducted.' 
          : data.status === 'cancelled' 
            ? 'Balance has been restored.' 
            : undefined,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to process request',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create Adjustment
  const createAdjustmentMutation = useMutation({
    mutationFn: async (payload: LeaveAdjustmentPayload) => {
      if (!effectiveOrgId) throw new Error('No organisation ID');
      return leaveService.createAdjustment(payload, effectiveOrgId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] });
      queryClient.invalidateQueries({ queryKey: ['leaveAdjustments'] });
      toast({
        title: 'Balance adjusted',
        description: 'The adjustment has been recorded.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to adjust balance',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Run Accruals
  const runAccrualsMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveOrgId) throw new Error('No organisation ID');
      return leaveService.runAccruals(effectiveOrgId);
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['leaveBalances'] });
      toast({
        title: 'Accruals processed',
        description: `${count} balance(s) updated.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Accrual failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Computed stats
  const stats = {
    pending: leaveRequests.filter(r => r.status === 'pending').length,
    approved: leaveRequests.filter(r => r.status === 'approved').length,
    rejected: leaveRequests.filter(r => r.status === 'rejected').length,
    cancelled: leaveRequests.filter(r => r.status === 'cancelled').length,
  };

  // Get balances for specific employee
  const getEmployeeBalances = (employeeId: string) => {
    return leaveBalances.filter(b => b.employee_id === employeeId);
  };

  // Get requests by status
  const getRequestsByStatus = (status: string) => {
    if (status === 'all') return leaveRequests;
    return leaveRequests.filter(r => r.status === status);
  };

  return {
    // Data
    leaveTypes,
    leaveRequests,
    leaveBalances,
    adjustments,
    stats,
    organisationId: effectiveOrgId,

    // Loading states
    isLoading: leaveTypesLoading || requestsLoading || balancesLoading,
    leaveTypesLoading,
    requestsLoading,
    balancesLoading,
    adjustmentsLoading,

    // Helpers
    getEmployeeBalances,
    getRequestsByStatus,

    // Mutations
    createRequest: createRequestMutation.mutate,
    processDecision: processDecisionMutation.mutate,
    createAdjustment: createAdjustmentMutation.mutate,
    runAccruals: runAccrualsMutation.mutate,

    // Mutation states
    isCreatingRequest: createRequestMutation.isPending,
    isProcessingDecision: processDecisionMutation.isPending,
    isCreatingAdjustment: createAdjustmentMutation.isPending,
    isRunningAccruals: runAccrualsMutation.isPending,

    // Refetch
    refetchRequests,
    refetchBalances,
  };
}

export function useEmployeeLeave(employeeId: string) {
  const { toast } = useToast();

  const {
    data: balances = [],
    isLoading: balancesLoading,
  } = useQuery({
    queryKey: ['employeeBalances', employeeId],
    queryFn: () => leaveService.getEmployeeBalances(employeeId),
    enabled: !!employeeId,
  });

  return {
    balances,
    isLoading: balancesLoading,
  };
}
