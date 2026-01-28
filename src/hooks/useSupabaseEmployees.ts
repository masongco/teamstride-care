import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { auditService } from '@/services/auditService';
import { toast } from '@/hooks/use-toast';
import type { 
  EmployeeDB, 
  CreateEmployeeInput, 
  UpdateEmployeeInput,
  EmployeeCertificationDB,
  CreateCertificationInput 
} from '@/types/database';

// Legacy localStorage key - used only for one-time migration
const LEGACY_STORAGE_KEY = 'hrms_employees';

/**
 * Hook for managing employees with Supabase persistence.
 * Replaces localStorage-based useEmployees hook.
 * Includes one-time migration from localStorage.
 */
export function useSupabaseEmployees(organisationId?: string) {
  const queryClient = useQueryClient();
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'complete' | 'error'>('idle');

  // Get current organisation (default to first available if not specified)
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

  // Fetch employees from Supabase
  const { 
    data: employees = [], 
    isLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: ['employees', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('organisation_id', orgId)
        .order('last_name', { ascending: true });
      
      if (error) {
        console.error('[useSupabaseEmployees] Failed to fetch employees:', error);
        throw error;
      }
      
      return (data || []) as EmployeeDB[];
    },
    enabled: !!orgId,
  });

  // Fetch certifications for all employees
  const { data: certifications = [] } = useQuery({
    queryKey: ['employee-certifications', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await supabase
        .from('employee_certifications')
        .select('*')
        .eq('organisation_id', orgId)
        .order('expiry_date', { ascending: true });
      
      if (error) {
        console.error('[useSupabaseEmployees] Failed to fetch certifications:', error);
        throw error;
      }
      
      return (data || []) as EmployeeCertificationDB[];
    },
    enabled: !!orgId,
  });

  // Create employee mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateEmployeeInput) => {
      const { data, error } = await supabase
        .from('employees')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data as EmployeeDB;
    },
    onSuccess: async (newEmployee) => {
      queryClient.invalidateQueries({ queryKey: ['employees', orgId] });
      
      // Log to audit trail
      await auditService.logEmployeeAction(
        'create',
        newEmployee.id,
        orgId,
        undefined,
        newEmployee as unknown as Record<string, unknown>
      );
      
      toast({
        title: 'Employee Added',
        description: `${newEmployee.first_name} ${newEmployee.last_name} has been added to the system.`,
      });
    },
    onError: (error) => {
      console.error('[useSupabaseEmployees] Create failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to add employee. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Update employee mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateEmployeeInput }) => {
      // Get current state for audit log
      const { data: beforeState } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { employee: data as EmployeeDB, beforeState };
    },
    onSuccess: async ({ employee, beforeState }) => {
      queryClient.invalidateQueries({ queryKey: ['employees', orgId] });
      
      // Log to audit trail
      await auditService.logEmployeeAction(
        'update',
        employee.id,
        orgId,
        beforeState as unknown as Record<string, unknown>,
        employee as unknown as Record<string, unknown>
      );
      
      toast({
        title: 'Employee Updated',
        description: `${employee.first_name} ${employee.last_name}'s profile has been updated.`,
      });
    },
    onError: (error) => {
      console.error('[useSupabaseEmployees] Update failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to update employee. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Status change mutation (specific audit action)
  const changeStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EmployeeDB['status'] }) => {
      const { data: beforeState } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('employees')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { employee: data as EmployeeDB, beforeState };
    },
    onSuccess: async ({ employee, beforeState }) => {
      queryClient.invalidateQueries({ queryKey: ['employees', orgId] });
      
      // Log status change specifically
      await auditService.logEmployeeAction(
        'status_change',
        employee.id,
        orgId,
        { status: beforeState?.status },
        { status: employee.status }
      );
      
      const statusLabel = employee.status === 'inactive' ? 'deactivated' : 'reactivated';
      toast({
        title: `Employee ${statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}`,
        description: `${employee.first_name} ${employee.last_name} has been ${statusLabel}.`,
      });
    },
    onError: (error) => {
      console.error('[useSupabaseEmployees] Status change failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to change employee status. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Add certification mutation
  const addCertificationMutation = useMutation({
    mutationFn: async (input: CreateCertificationInput) => {
      const { data, error } = await supabase
        .from('employee_certifications')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data as EmployeeCertificationDB;
    },
    onSuccess: async (newCert) => {
      queryClient.invalidateQueries({ queryKey: ['employee-certifications', orgId] });
      
      await auditService.logCertificationAction(
        'create',
        newCert.id,
        orgId,
        undefined,
        newCert as unknown as Record<string, unknown>
      );
      
      toast({
        title: 'Certification Added',
        description: `${newCert.name} has been added.`,
      });
    },
    onError: (error) => {
      console.error('[useSupabaseEmployees] Add certification failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to add certification. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // One-time migration from localStorage
  const migrateFromLocalStorage = useCallback(async () => {
    if (!orgId) return;
    
    try {
      const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!stored) {
        setMigrationStatus('complete');
        return;
      }

      const legacyEmployees = JSON.parse(stored);
      if (!Array.isArray(legacyEmployees) || legacyEmployees.length === 0) {
        setMigrationStatus('complete');
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        return;
      }

      // Check if we already have employees in DB (migration already done)
      const { count } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('organisation_id', orgId);

      if (count && count > 0) {
        // Migration already done, clean up localStorage
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        setMigrationStatus('complete');
        console.log('[Migration] Employees already in database, clearing localStorage');
        return;
      }

      setMigrationStatus('migrating');
      console.log(`[Migration] Migrating ${legacyEmployees.length} employees from localStorage`);

      // Transform and insert employees
      const employeesToInsert = legacyEmployees.map((emp: Record<string, unknown>) => ({
        organisation_id: orgId,
        first_name: emp.firstName as string || 'Unknown',
        last_name: emp.lastName as string || 'Unknown',
        email: emp.email as string || `unknown-${Date.now()}@temp.local`,
        phone: emp.phone as string || null,
        avatar_url: emp.avatar as string || null,
        employment_type: (emp.employmentType as string || 'casual') as EmployeeDB['employment_type'],
        position: emp.position as string || null,
        department: emp.department as string || null,
        start_date: emp.startDate as string || null,
        status: (emp.status as string || 'active') as EmployeeDB['status'],
        compliance_status: (emp.complianceStatus as string || 'pending') as EmployeeDB['compliance_status'],
        pay_rate: emp.payRate as number || null,
        award_classification_id: null,
        emergency_contact_name: (emp.emergencyContact as Record<string, unknown>)?.name as string || null,
        emergency_contact_phone: (emp.emergencyContact as Record<string, unknown>)?.phone as string || null,
        emergency_contact_relationship: (emp.emergencyContact as Record<string, unknown>)?.relationship as string || null,
      }));

      const { error } = await supabase
        .from('employees')
        .insert(employeesToInsert);

      if (error) {
        console.error('[Migration] Failed to migrate employees:', error);
        setMigrationStatus('error');
        return;
      }

      // Clear localStorage after successful migration
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      setMigrationStatus('complete');
      
      // Refetch to show migrated data
      refetch();
      
      toast({
        title: 'Data Migration Complete',
        description: `${legacyEmployees.length} employees have been migrated to the database.`,
      });
      
      console.log('[Migration] Successfully migrated employees to Supabase');
    } catch (err) {
      console.error('[Migration] Unexpected error:', err);
      setMigrationStatus('error');
    }
  }, [orgId, refetch]);

  // Run migration on mount
  useEffect(() => {
    if (orgId && migrationStatus === 'idle') {
      migrateFromLocalStorage();
    }
  }, [orgId, migrationStatus, migrateFromLocalStorage]);

  // Helper to get certifications for a specific employee
  const getCertificationsForEmployee = useCallback((employeeId: string) => {
    return certifications.filter(c => c.employee_id === employeeId);
  }, [certifications]);

  // Get active employees only
  const activeEmployees = employees.filter(e => e.status === 'active');

  return {
    // Data
    employees,
    activeEmployees,
    certifications,
    getCertificationsForEmployee,
    organisationId: orgId,
    
    // Status
    isLoading,
    error,
    migrationStatus,
    
    // Actions
    createEmployee: createMutation.mutateAsync,
    updateEmployee: (id: string, updates: UpdateEmployeeInput) => 
      updateMutation.mutateAsync({ id, updates }),
    changeStatus: (id: string, status: EmployeeDB['status']) =>
      changeStatusMutation.mutateAsync({ id, status }),
    addCertification: addCertificationMutation.mutateAsync,
    refetch,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isChangingStatus: changeStatusMutation.isPending,
  };
}
