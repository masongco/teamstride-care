import { supabase } from '@/integrations/supabase/client';

export type AuditAction = 
  | 'employee.create'
  | 'employee.update' 
  | 'employee.status_change'
  | 'employee.delete'
  | 'certification.create'
  | 'certification.update'
  | 'certification.delete'
  | 'certification.approve'
  | 'certification.reject'
  | 'timesheet.create'
  | 'timesheet.update'
  | 'timesheet.delete'
  | 'timesheet.approve'
  | 'timesheet.reject'
  | 'timesheet.export'
  | 'timesheet.lock'
  | 'timesheet.unlock'
  | 'leave.create'
  | 'leave.update'
  | 'leave.approve'
  | 'leave.reject'
  | 'role.assign'
  | 'role.remove'
  | 'document.upload'
  | 'document.approve'
  | 'document.reject'
  | 'contract.create'
  | 'contract.sign'
  | 'contract.void'
  | 'admin.override'
  | 'pay_period.create'
  | 'pay_period.update'
  | 'pay_period.close'
  | 'payroll_export.generate'
  | 'payroll_export.void';

export type EntityType = 
  | 'employee'
  | 'certification'
  | 'timesheet'
  | 'leave_request'
  | 'document'
  | 'contract'
  | 'role'
  | 'setting'
  | 'pay_period'
  | 'payroll_export';

interface AuditLogEntry {
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  organisationId?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
}

/**
 * Central audit logging service.
 * Records all sensitive actions for compliance and audit defensibility.
 * Audit logs are immutable once written.
 */
class AuditService {
  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    // Get profile for display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .maybeSingle();
    
    return {
      id: user.id,
      email: user.email,
      name: profile?.display_name || user.email,
    };
  }

  /**
   * Logs an action to the audit trail.
   * This function never throws - failures are logged to console.
   */
  async log(entry: AuditLogEntry): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      
      const insertData = {
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        organisation_id: entry.organisationId || null,
        user_id: user?.id || null,
        user_email: user?.email || null,
        user_name: user?.name || null,
        old_values: entry.beforeState ? JSON.parse(JSON.stringify(entry.beforeState)) : null,
        new_values: entry.afterState ? JSON.parse(JSON.stringify(entry.afterState)) : null,
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(insertData);

      if (error) {
        console.error('[AuditService] Failed to write audit log:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[AuditService] Unexpected error writing audit log:', err);
      return false;
    }
  }

  /**
   * Convenience method for employee-related actions
   */
  async logEmployeeAction(
    action: 'create' | 'update' | 'status_change' | 'delete',
    employeeId: string,
    organisationId?: string,
    beforeState?: Record<string, unknown>,
    afterState?: Record<string, unknown>
  ): Promise<boolean> {
    return this.log({
      action: `employee.${action}` as AuditAction,
      entityType: 'employee',
      entityId: employeeId,
      organisationId,
      beforeState,
      afterState,
    });
  }

  /**
   * Convenience method for certification-related actions
   */
  async logCertificationAction(
    action: 'create' | 'update' | 'delete' | 'approve' | 'reject',
    certificationId: string,
    organisationId?: string,
    beforeState?: Record<string, unknown>,
    afterState?: Record<string, unknown>
  ): Promise<boolean> {
    return this.log({
      action: `certification.${action}` as AuditAction,
      entityType: 'certification',
      entityId: certificationId,
      organisationId,
      beforeState,
      afterState,
    });
  }

  /**
   * Convenience method for timesheet-related actions
   */
  async logTimesheetAction(
    action: 'create' | 'update' | 'delete' | 'approve' | 'reject',
    timesheetId: string,
    organisationId?: string,
    beforeState?: Record<string, unknown>,
    afterState?: Record<string, unknown>
  ): Promise<boolean> {
    return this.log({
      action: `timesheet.${action}` as AuditAction,
      entityType: 'timesheet',
      entityId: timesheetId,
      organisationId,
      beforeState,
      afterState,
    });
  }

  /**
   * Convenience method for leave-related actions
   */
  async logLeaveAction(
    action: 'create' | 'update' | 'approve' | 'reject',
    leaveId: string,
    organisationId?: string,
    beforeState?: Record<string, unknown>,
    afterState?: Record<string, unknown>
  ): Promise<boolean> {
    return this.log({
      action: `leave.${action}` as AuditAction,
      entityType: 'leave_request',
      entityId: leaveId,
      organisationId,
      beforeState,
      afterState,
    });
  }
}

// Export singleton instance
export const auditService = new AuditService();
