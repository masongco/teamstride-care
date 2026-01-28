import { supabase } from '@/integrations/supabase/client';
import { auditService } from '@/services/auditService';
import type { 
  LeaveType, 
  LeaveBalance, 
  LeaveRequest, 
  LeaveAdjustment,
  LeaveApprovalPayload,
  LeaveAdjustmentPayload 
} from '@/types/leave';

/**
 * Leave & Entitlements Service
 * Handles leave types, balances, requests, and adjustments with full audit logging.
 */
class LeaveService {
  /**
   * Get leave types for an organisation
   */
  async getLeaveTypes(organisationId: string): Promise<LeaveType[]> {
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .eq('organisation_id', organisationId)
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('[LeaveService] Failed to fetch leave types:', error);
      throw error;
    }

    return (data || []) as LeaveType[];
  }

  /**
   * Get leave balances for an employee
   */
  async getEmployeeBalances(employeeId: string): Promise<LeaveBalance[]> {
    const { data, error } = await supabase
      .from('leave_balances')
      .select(`
        *,
        leave_type:leave_types(*)
      `)
      .eq('employee_id', employeeId);

    if (error) {
      console.error('[LeaveService] Failed to fetch employee balances:', error);
      throw error;
    }

    return (data || []) as unknown as LeaveBalance[];
  }

  /**
   * Get all leave balances for an organisation
   */
  async getOrganisationBalances(organisationId: string): Promise<LeaveBalance[]> {
    const { data, error } = await supabase
      .from('leave_balances')
      .select(`
        *,
        leave_type:leave_types(*)
      `)
      .eq('organisation_id', organisationId);

    if (error) {
      console.error('[LeaveService] Failed to fetch organisation balances:', error);
      throw error;
    }

    return (data || []) as unknown as LeaveBalance[];
  }

  /**
   * Get leave requests with filters
   */
  async getLeaveRequests(
    organisationId: string,
    options?: {
      status?: string;
      employeeId?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<LeaveRequest[]> {
    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        employee:employees(id, first_name, last_name, email, employment_type, department),
        leave_type:leave_types(*)
      `)
      .eq('organisation_id', organisationId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.employeeId) {
      query = query.eq('employee_id', options.employeeId);
    }
    if (options?.startDate) {
      query = query.gte('start_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('end_date', options.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[LeaveService] Failed to fetch leave requests:', error);
      throw error;
    }

    return (data || []) as unknown as LeaveRequest[];
  }

  /**
   * Create a new leave request
   */
  async createLeaveRequest(
    organisationId: string,
    employeeId: string,
    leaveTypeId: string,
    startDate: string,
    endDate: string,
    hours: number,
    reason?: string
  ): Promise<LeaveRequest> {
    // Get leave type name for legacy 'type' field
    const { data: leaveType } = await supabase
      .from('leave_types')
      .select('name')
      .eq('id', leaveTypeId)
      .single();

    const typeName = leaveType?.name?.toLowerCase().replace(/[^a-z]/g, '_') || 'other';

    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        organisation_id: organisationId,
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        type: typeName,
        start_date: startDate,
        end_date: endDate,
        hours,
        reason,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[LeaveService] Failed to create leave request:', error);
      throw error;
    }

    // Audit log
    await auditService.logLeaveAction('create', data.id, organisationId, undefined, {
      employee_id: employeeId,
      leave_type_id: leaveTypeId,
      start_date: startDate,
      end_date: endDate,
      hours,
    });

    return data as LeaveRequest;
  }

  /**
   * Process leave approval/rejection/cancellation
   */
  async processLeaveDecision(
    payload: LeaveApprovalPayload,
    organisationId: string
  ): Promise<LeaveRequest> {
    // Get current request state
    const { data: currentRequest, error: fetchError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', payload.request_id)
      .single();

    if (fetchError || !currentRequest) {
      throw new Error('Leave request not found');
    }

    const beforeState = { ...currentRequest };

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user?.id)
      .maybeSingle();

    const now = new Date().toISOString();

    if (payload.action === 'approve') {
      // Check balance unless override is specified
      if (!payload.override_insufficient_balance && currentRequest.leave_type_id) {
        const { data: hasBalance } = await supabase.rpc('check_leave_balance', {
          _employee_id: currentRequest.employee_id,
          _leave_type_id: currentRequest.leave_type_id,
          _hours_requested: currentRequest.hours,
        });

        if (!hasBalance) {
          throw new Error('Insufficient leave balance. Use override to approve anyway.');
        }
      }

      // Update request
      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          status: 'approved',
          approved_by: profile?.display_name || user?.email,
          approved_at: now,
          decided_by_user_id: user?.id,
          decided_at: now,
          balance_deducted: !!currentRequest.leave_type_id,
          override_reason: payload.override_insufficient_balance ? payload.reason : null,
        })
        .eq('id', payload.request_id)
        .select()
        .single();

      if (error) throw error;

      // Deduct balance if linked to leave type
      if (currentRequest.leave_type_id) {
        await supabase.rpc('deduct_leave_balance', {
          _employee_id: currentRequest.employee_id,
          _leave_type_id: currentRequest.leave_type_id,
          _hours: currentRequest.hours,
        });
      }

      // Audit log
      await auditService.logLeaveAction('approve', payload.request_id, organisationId, beforeState, {
        status: 'approved',
        approved_by: profile?.display_name,
        override_reason: payload.override_insufficient_balance ? payload.reason : null,
      });

      return data as LeaveRequest;

    } else if (payload.action === 'reject') {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          status: 'rejected',
          decided_by_user_id: user?.id,
          decided_at: now,
        })
        .eq('id', payload.request_id)
        .select()
        .single();

      if (error) throw error;

      // Audit log
      await auditService.logLeaveAction('reject', payload.request_id, organisationId, beforeState, {
        status: 'rejected',
        reason: payload.reason,
      });

      return data as LeaveRequest;

    } else if (payload.action === 'cancel') {
      // Restore balance if previously approved
      if (currentRequest.status === 'approved' && currentRequest.balance_deducted && currentRequest.leave_type_id) {
        await supabase.rpc('restore_leave_balance', {
          _employee_id: currentRequest.employee_id,
          _leave_type_id: currentRequest.leave_type_id,
          _hours: currentRequest.hours,
        });
      }

      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          status: 'cancelled',
          cancelled_at: now,
          cancellation_reason: payload.reason,
          balance_deducted: false,
        })
        .eq('id', payload.request_id)
        .select()
        .single();

      if (error) throw error;

      // Audit log
      await auditService.logLeaveAction('update', payload.request_id, organisationId, beforeState, {
        status: 'cancelled',
        cancellation_reason: payload.reason,
      });

      return data as LeaveRequest;
    }

    throw new Error('Invalid action');
  }

  /**
   * Create a manual balance adjustment (admin only)
   */
  async createAdjustment(
    payload: LeaveAdjustmentPayload,
    organisationId: string
  ): Promise<LeaveAdjustment> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user?.id)
      .maybeSingle();

    // Get current balance
    const { data: currentBalance } = await supabase
      .from('leave_balances')
      .select('balance_hours')
      .eq('employee_id', payload.employee_id)
      .eq('leave_type_id', payload.leave_type_id)
      .maybeSingle();

    const beforeState = {
      balance_hours: currentBalance?.balance_hours || 0,
    };

    // Create adjustment record
    const { data: adjustment, error: adjError } = await supabase
      .from('leave_adjustments')
      .insert({
        organisation_id: organisationId,
        employee_id: payload.employee_id,
        leave_type_id: payload.leave_type_id,
        adjustment_hours: payload.adjustment_hours,
        reason: payload.reason,
        adjusted_by_user_id: user?.id,
        adjusted_by_name: profile?.display_name || user?.email,
        adjusted_by_email: user?.email,
      })
      .select()
      .single();

    if (adjError) {
      console.error('[LeaveService] Failed to create adjustment:', adjError);
      throw adjError;
    }

    // Update balance
    if (currentBalance) {
      await supabase
        .from('leave_balances')
        .update({
          balance_hours: currentBalance.balance_hours + payload.adjustment_hours,
        })
        .eq('employee_id', payload.employee_id)
        .eq('leave_type_id', payload.leave_type_id);
    } else {
      // Create balance if doesn't exist
      await supabase
        .from('leave_balances')
        .insert({
          organisation_id: organisationId,
          employee_id: payload.employee_id,
          leave_type_id: payload.leave_type_id,
          balance_hours: payload.adjustment_hours,
        });
    }

    const afterState = {
      balance_hours: (currentBalance?.balance_hours || 0) + payload.adjustment_hours,
    };

    // Audit log
    await auditService.log({
      action: 'admin.override',
      entityType: 'leave_request',
      entityId: adjustment.id,
      organisationId,
      beforeState,
      afterState: {
        ...afterState,
        adjustment_hours: payload.adjustment_hours,
        reason: payload.reason,
      },
    });

    return adjustment as LeaveAdjustment;
  }

  /**
   * Get adjustment history for an employee or organisation
   */
  async getAdjustments(
    organisationId: string,
    employeeId?: string
  ): Promise<LeaveAdjustment[]> {
    let query = supabase
      .from('leave_adjustments')
      .select(`
        *,
        leave_type:leave_types(id, name),
        employee:employees(id, first_name, last_name)
      `)
      .eq('organisation_id', organisationId)
      .order('created_at', { ascending: false });

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[LeaveService] Failed to fetch adjustments:', error);
      throw error;
    }

    return (data || []) as unknown as LeaveAdjustment[];
  }

  /**
   * Run accruals for an organisation (typically called by scheduled job)
   */
  async runAccruals(organisationId: string): Promise<number> {
    const { data, error } = await supabase.rpc('run_leave_accruals', {
      _organisation_id: organisationId,
    });

    if (error) {
      console.error('[LeaveService] Failed to run accruals:', error);
      throw error;
    }

    return data as number;
  }

  /**
   * Initialize balances for a new employee
   */
  async initializeEmployeeBalances(
    organisationId: string,
    employeeId: string,
    employmentType: string
  ): Promise<void> {
    // Get applicable leave types
    const { data: leaveTypes } = await supabase
      .from('leave_types')
      .select('*')
      .eq('organisation_id', organisationId)
      .eq('is_active', true)
      .contains('applicable_employment_types', [employmentType]);

    if (!leaveTypes || leaveTypes.length === 0) return;

    // Create balance records
    const balances = leaveTypes.map(lt => ({
      organisation_id: organisationId,
      employee_id: employeeId,
      leave_type_id: lt.id,
      balance_hours: 0,
    }));

    await supabase
      .from('leave_balances')
      .upsert(balances, { onConflict: 'employee_id,leave_type_id' });
  }
}

export const leaveService = new LeaveService();
