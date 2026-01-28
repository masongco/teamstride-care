/**
 * Hook for managing payroll exports
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { payrollExportService } from '@/services/payrollExportService';
import { toast } from '@/hooks/use-toast';
import type {
  PayPeriod,
  PayrollMapping,
  PayrollExport,
  PayrollProvider,
  CreatePayPeriodInput,
  CreatePayrollMappingInput,
  ExportValidationResult,
  TimesheetForExport,
} from '@/types/payroll';

export function usePayrollExport(organisationId?: string) {
  const queryClient = useQueryClient();

  // Get default organisation if not provided
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

  // =====================================================
  // Pay Periods
  // =====================================================

  const {
    data: payPeriods = [],
    isLoading: isLoadingPayPeriods,
  } = useQuery({
    queryKey: ['pay-periods', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return payrollExportService.getPayPeriods(orgId);
    },
    enabled: !!orgId,
  });

  const createPayPeriodMutation = useMutation({
    mutationFn: async (input: CreatePayPeriodInput) => {
      if (!orgId) throw new Error('Organisation not found');
      return payrollExportService.createPayPeriod(orgId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pay-periods', orgId] });
      toast({
        title: 'Pay Period Created',
        description: 'The pay period has been created successfully.',
      });
    },
    onError: (error) => {
      console.error('[usePayrollExport] Create pay period failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to create pay period. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const closePayPeriodMutation = useMutation({
    mutationFn: async (payPeriodId: string) => {
      return payrollExportService.updatePayPeriodStatus(payPeriodId, 'closed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pay-periods', orgId] });
      toast({
        title: 'Pay Period Closed',
        description: 'The pay period has been closed.',
      });
    },
    onError: (error) => {
      console.error('[usePayrollExport] Close pay period failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to close pay period.',
        variant: 'destructive',
      });
    },
  });

  // =====================================================
  // Payroll Mappings
  // =====================================================

  const {
    data: mappings = [],
    isLoading: isLoadingMappings,
  } = useQuery({
    queryKey: ['payroll-mappings', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return payrollExportService.getMappings(orgId);
    },
    enabled: !!orgId,
  });

  const createMappingMutation = useMutation({
    mutationFn: async (input: CreatePayrollMappingInput) => {
      if (!orgId) throw new Error('Organisation not found');
      return payrollExportService.createMapping(orgId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-mappings', orgId] });
      toast({
        title: 'Mapping Created',
        description: 'Payroll mapping has been created.',
      });
    },
    onError: (error) => {
      console.error('[usePayrollExport] Create mapping failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to create mapping.',
        variant: 'destructive',
      });
    },
  });

  const updateMappingMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreatePayrollMappingInput> }) => {
      return payrollExportService.updateMapping(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-mappings', orgId] });
      toast({
        title: 'Mapping Updated',
        description: 'Payroll mapping has been updated.',
      });
    },
    onError: (error) => {
      console.error('[usePayrollExport] Update mapping failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to update mapping.',
        variant: 'destructive',
      });
    },
  });

  const deleteMappingMutation = useMutation({
    mutationFn: async (id: string) => {
      return payrollExportService.deleteMapping(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-mappings', orgId] });
      toast({
        title: 'Mapping Deleted',
        description: 'Payroll mapping has been removed.',
      });
    },
    onError: (error) => {
      console.error('[usePayrollExport] Delete mapping failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete mapping.',
        variant: 'destructive',
      });
    },
  });

  // =====================================================
  // Validation
  // =====================================================

  const validateExportMutation = useMutation({
    mutationFn: async (payPeriodId: string) => {
      if (!orgId) throw new Error('Organisation not found');
      return payrollExportService.validateExport(orgId, payPeriodId, mappings);
    },
  });

  // =====================================================
  // Exports
  // =====================================================

  const {
    data: exports = [],
    isLoading: isLoadingExports,
  } = useQuery({
    queryKey: ['payroll-exports', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return payrollExportService.getExports(orgId);
    },
    enabled: !!orgId,
  });

  const generateExportMutation = useMutation({
    mutationFn: async ({
      payPeriodId,
      provider,
      timesheets,
    }: {
      payPeriodId: string;
      provider: PayrollProvider;
      timesheets: TimesheetForExport[];
    }) => {
      if (!orgId) throw new Error('Organisation not found');
      return payrollExportService.generateExport(
        orgId,
        {
          pay_period_id: payPeriodId,
          provider,
          timesheet_ids: timesheets.map(t => t.id),
        },
        mappings,
        timesheets
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-exports', orgId] });
      queryClient.invalidateQueries({ queryKey: ['pay-periods', orgId] });
      queryClient.invalidateQueries({ queryKey: ['timesheets', orgId] });
      toast({
        title: 'Export Generated',
        description: 'Payroll export has been generated successfully.',
      });
    },
    onError: (error) => {
      console.error('[usePayrollExport] Generate export failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate export.',
        variant: 'destructive',
      });
    },
  });

  const voidExportMutation = useMutation({
    mutationFn: async ({ exportId, reason }: { exportId: string; reason: string }) => {
      return payrollExportService.voidExport(exportId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-exports', orgId] });
      toast({
        title: 'Export Voided',
        description: 'The export has been voided.',
      });
    },
    onError: (error) => {
      console.error('[usePayrollExport] Void export failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to void export.',
        variant: 'destructive',
      });
    },
  });

  const getDownloadUrlMutation = useMutation({
    mutationFn: async (filePath: string) => {
      return payrollExportService.getDownloadUrl(filePath);
    },
    onError: (error) => {
      console.error('[usePayrollExport] Get download URL failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to get download link.',
        variant: 'destructive',
      });
    },
  });

  // =====================================================
  // Timesheet Unlock
  // =====================================================

  const unlockTimesheetMutation = useMutation({
    mutationFn: async ({ timesheetId, reason }: { timesheetId: string; reason: string }) => {
      return payrollExportService.unlockTimesheet(timesheetId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets', orgId] });
      toast({
        title: 'Timesheet Unlocked',
        description: 'The timesheet has been unlocked for editing.',
      });
    },
    onError: (error) => {
      console.error('[usePayrollExport] Unlock timesheet failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to unlock timesheet.',
        variant: 'destructive',
      });
    },
  });

  // =====================================================
  // Helpers
  // =====================================================

  const openPayPeriods = payPeriods.filter(p => p.status === 'open');
  const exportedPayPeriods = payPeriods.filter(p => p.status === 'exported');
  const closedPayPeriods = payPeriods.filter(p => p.status === 'closed');

  const activeExports = exports.filter(e => e.status === 'generated');
  const voidedExports = exports.filter(e => e.status === 'voided');

  return {
    // Data
    payPeriods,
    openPayPeriods,
    exportedPayPeriods,
    closedPayPeriods,
    mappings,
    exports,
    activeExports,
    voidedExports,
    organisationId: orgId,

    // Loading states
    isLoading: isLoadingPayPeriods || isLoadingMappings || isLoadingExports,
    isLoadingPayPeriods,
    isLoadingMappings,
    isLoadingExports,

    // Pay Period Actions
    createPayPeriod: createPayPeriodMutation.mutateAsync,
    closePayPeriod: closePayPeriodMutation.mutateAsync,
    isCreatingPayPeriod: createPayPeriodMutation.isPending,

    // Mapping Actions
    createMapping: createMappingMutation.mutateAsync,
    updateMapping: (id: string, updates: Partial<CreatePayrollMappingInput>) =>
      updateMappingMutation.mutateAsync({ id, updates }),
    deleteMapping: deleteMappingMutation.mutateAsync,
    isCreatingMapping: createMappingMutation.isPending,

    // Validation
    validateExport: validateExportMutation.mutateAsync,
    isValidating: validateExportMutation.isPending,
    validationResult: validateExportMutation.data,

    // Export Actions
    generateExport: generateExportMutation.mutateAsync,
    voidExport: (exportId: string, reason: string) =>
      voidExportMutation.mutateAsync({ exportId, reason }),
    getDownloadUrl: getDownloadUrlMutation.mutateAsync,
    isGenerating: generateExportMutation.isPending,
    isVoiding: voidExportMutation.isPending,
    isDownloading: getDownloadUrlMutation.isPending,

    // Timesheet Actions
    unlockTimesheet: (timesheetId: string, reason: string) =>
      unlockTimesheetMutation.mutateAsync({ timesheetId, reason }),
    isUnlocking: unlockTimesheetMutation.isPending,
  };
}
