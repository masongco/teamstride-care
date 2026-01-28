/**
 * Payroll Export Service
 * Handles pay periods, mappings, exports, and validation
 */

import { supabase } from '@/integrations/supabase/client';
import { auditService } from '@/services/auditService';
import type {
  PayPeriod,
  PayrollMapping,
  PayrollExport,
  PayrollProvider,
  TimesheetForExport,
  ExportValidationResult,
  ValidationError,
  ValidationWarning,
  CreatePayPeriodInput,
  CreatePayrollMappingInput,
  GenerateExportInput,
  PayrollExportSummary,
} from '@/types/payroll';
import type { Json } from '@/integrations/supabase/types';

class PayrollExportService {
  // =====================================================
  // Pay Periods
  // =====================================================

  async getPayPeriods(organisationId: string): Promise<PayPeriod[]> {
    const { data, error } = await supabase
      .from('pay_periods')
      .select('*')
      .eq('organisation_id', organisationId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return (data || []) as PayPeriod[];
  }

  async createPayPeriod(
    organisationId: string,
    input: CreatePayPeriodInput
  ): Promise<PayPeriod> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('pay_periods')
      .insert({
        organisation_id: organisationId,
        start_date: input.start_date,
        end_date: input.end_date,
        created_by_user_id: user.id,
        created_by_name: user.user_metadata?.display_name || user.email,
        created_by_email: user.email,
      })
      .select()
      .single();

    if (error) throw error;

    await auditService.log({
      action: 'pay_period.create',
      entityType: 'pay_period',
      entityId: data.id,
      organisationId,
      afterState: { start_date: input.start_date, end_date: input.end_date },
    });

    return data as PayPeriod;
  }

  async updatePayPeriodStatus(
    payPeriodId: string,
    status: 'open' | 'exported' | 'closed'
  ): Promise<PayPeriod> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const updates: Record<string, unknown> = { status };
    if (status === 'closed') {
      updates.closed_at = new Date().toISOString();
      updates.closed_by_user_id = user?.id;
    }

    const { data, error } = await supabase
      .from('pay_periods')
      .update(updates)
      .eq('id', payPeriodId)
      .select()
      .single();

    if (error) throw error;

    await auditService.log({
      action: status === 'closed' ? 'pay_period.close' : 'pay_period.update',
      entityType: 'pay_period',
      entityId: payPeriodId,
      organisationId: data.organisation_id,
      afterState: { status },
    });

    return data as PayPeriod;
  }

  // =====================================================
  // Payroll Mappings
  // =====================================================

  async getMappings(organisationId: string): Promise<PayrollMapping[]> {
    const { data, error } = await supabase
      .from('payroll_mappings')
      .select('*')
      .eq('organisation_id', organisationId)
      .order('shift_type');

    if (error) throw error;
    return (data || []) as PayrollMapping[];
  }

  async createMapping(
    organisationId: string,
    input: CreatePayrollMappingInput
  ): Promise<PayrollMapping> {
    const { data, error } = await supabase
      .from('payroll_mappings')
      .insert({
        organisation_id: organisationId,
        shift_type: input.shift_type,
        earning_code: input.earning_code,
        description: input.description || null,
        multiplier: input.multiplier || 1.0,
        applies_when: (input.applies_when as Json) || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as PayrollMapping;
  }

  async updateMapping(
    mappingId: string,
    updates: Partial<CreatePayrollMappingInput>
  ): Promise<PayrollMapping> {
    const updateData: Record<string, unknown> = {};
    if (updates.shift_type !== undefined) updateData.shift_type = updates.shift_type;
    if (updates.earning_code !== undefined) updateData.earning_code = updates.earning_code;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.multiplier !== undefined) updateData.multiplier = updates.multiplier;
    if (updates.applies_when !== undefined) updateData.applies_when = updates.applies_when as Json;

    const { data, error } = await supabase
      .from('payroll_mappings')
      .update(updateData)
      .eq('id', mappingId)
      .select()
      .single();

    if (error) throw error;
    return data as PayrollMapping;
  }

  async deleteMapping(mappingId: string): Promise<void> {
    const { error } = await supabase
      .from('payroll_mappings')
      .delete()
      .eq('id', mappingId);

    if (error) throw error;
  }

  // =====================================================
  // Export Validation
  // =====================================================

  async validateExport(
    organisationId: string,
    payPeriodId: string,
    mappings: PayrollMapping[]
  ): Promise<ExportValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Get pay period
    const { data: payPeriod, error: ppError } = await supabase
      .from('pay_periods')
      .select('*')
      .eq('id', payPeriodId)
      .single();

    if (ppError || !payPeriod) {
      errors.push({
        type: 'invalid_dates',
        message: 'Pay period not found',
      });
      return { isValid: false, errors, warnings, timesheets: [] };
    }

    // Get approved timesheets in date range
    const { data: timesheets, error: tsError } = await supabase
      .from('timesheets')
      .select(`
        id,
        employee_id,
        date,
        clock_in,
        clock_out,
        break_minutes,
        total_hours,
        status,
        notes,
        is_locked,
        exported_at
      `)
      .eq('organisation_id', organisationId)
      .gte('date', payPeriod.start_date)
      .lte('date', payPeriod.end_date)
      .order('date');

    if (tsError) throw tsError;

    // Get employee details
    const employeeIds = [...new Set((timesheets || []).map(t => t.employee_id))];
    const { data: employees } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email')
      .in('id', employeeIds);

    const employeeMap = new Map(
      (employees || []).map(e => [e.id, { name: `${e.first_name} ${e.last_name}`, email: e.email }])
    );

    // Build mapping lookup
    const mappingLookup = new Map(mappings.map(m => [m.shift_type, m.earning_code]));

    // Validate each timesheet
    const validatedTimesheets: TimesheetForExport[] = [];
    const seenEmployeeDates = new Map<string, string[]>();

    for (const ts of timesheets || []) {
      const emp = employeeMap.get(ts.employee_id);
      const employeeName = emp?.name || 'Unknown';
      const employeeEmail = emp?.email;

      // Check if approved
      if (ts.status !== 'approved') {
        errors.push({
          type: 'unapproved',
          message: `Timesheet for ${employeeName} on ${ts.date} is not approved (status: ${ts.status})`,
          employeeId: ts.employee_id,
          employeeName,
        });
        continue;
      }

      // Check if already exported
      if (ts.is_locked && ts.exported_at) {
        warnings.push({
          type: 'duplicate',
          message: `Timesheet for ${employeeName} on ${ts.date} was already exported`,
          employeeId: ts.employee_id,
          employeeName,
          date: ts.date,
        });
        continue;
      }

      // Check for employee identifier
      if (!employeeEmail) {
        errors.push({
          type: 'missing_identifier',
          message: `Employee ${employeeName} has no email address for payroll export`,
          employeeId: ts.employee_id,
          employeeName,
        });
      }

      // Check for shift type mapping (default to 'standard')
      const shiftType = 'standard'; // Could be enhanced to detect shift type
      if (!mappingLookup.has(shiftType)) {
        errors.push({
          type: 'missing_mapping',
          message: `No payroll mapping found for shift type: ${shiftType}`,
          shiftType,
        });
      }

      // Check for duplicates on same day
      const key = `${ts.employee_id}-${ts.date}`;
      if (!seenEmployeeDates.has(key)) {
        seenEmployeeDates.set(key, []);
      }
      const existing = seenEmployeeDates.get(key)!;
      if (existing.length > 0) {
        warnings.push({
          type: 'overlap',
          message: `Multiple timesheets for ${employeeName} on ${ts.date}`,
          employeeId: ts.employee_id,
          employeeName,
          date: ts.date,
        });
      }
      existing.push(ts.id);

      // Check for long shifts (>12 hours)
      if (ts.total_hours && ts.total_hours > 12) {
        warnings.push({
          type: 'long_shift',
          message: `Long shift (${ts.total_hours.toFixed(1)}h) for ${employeeName} on ${ts.date}`,
          employeeId: ts.employee_id,
          employeeName,
          date: ts.date,
        });
      }

      validatedTimesheets.push({
        id: ts.id,
        employee_id: ts.employee_id,
        employee_name: employeeName,
        employee_email: employeeEmail,
        date: ts.date,
        clock_in: ts.clock_in,
        clock_out: ts.clock_out,
        break_minutes: ts.break_minutes || 0,
        total_hours: ts.total_hours,
        status: ts.status,
        notes: ts.notes,
        shift_type: shiftType,
        is_locked: ts.is_locked || false,
        exported_at: ts.exported_at,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      timesheets: validatedTimesheets,
    };
  }

  // =====================================================
  // Payroll Exports
  // =====================================================

  async getExports(organisationId: string): Promise<PayrollExport[]> {
    const { data, error } = await supabase
      .from('payroll_exports')
      .select(`
        *,
        pay_period:pay_periods(*)
      `)
      .eq('organisation_id', organisationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(d => ({
      ...d,
      file_urls: (d.file_urls || []) as string[],
      totals_summary: this.parseTotalsSummary(d.totals_summary),
    })) as PayrollExport[];
  }

  private parseTotalsSummary(summary: Json | null): PayrollExportSummary {
    if (!summary || typeof summary !== 'object' || Array.isArray(summary)) {
      return { totalHours: 0, employeesCount: 0, linesCount: 0 };
    }
    const obj = summary as Record<string, unknown>;
    return {
      totalHours: typeof obj.totalHours === 'number' ? obj.totalHours : 0,
      employeesCount: typeof obj.employeesCount === 'number' ? obj.employeesCount : 0,
      linesCount: typeof obj.linesCount === 'number' ? obj.linesCount : 0,
      totalEarnings: typeof obj.totalEarnings === 'number' ? obj.totalEarnings : undefined,
    };
  }

  async generateExport(
    organisationId: string,
    input: GenerateExportInput,
    mappings: PayrollMapping[],
    timesheets: TimesheetForExport[]
  ): Promise<PayrollExport> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Generate CSV content
    const csvContent = this.generateCSVContent(input.provider, timesheets, mappings);
    
    // Upload to storage
    const fileName = `export_${input.pay_period_id}_${input.provider}_${Date.now()}.csv`;
    const filePath = `${organisationId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('payroll-exports')
      .upload(filePath, new Blob([csvContent], { type: 'text/csv' }));

    if (uploadError) throw uploadError;

    // Calculate summary
    const summary: PayrollExportSummary = {
      totalHours: timesheets.reduce((sum, t) => sum + (t.total_hours || 0), 0),
      employeesCount: new Set(timesheets.map(t => t.employee_id)).size,
      linesCount: timesheets.length,
    };

    // Create export record
    const { data: exportRecord, error: exportError } = await supabase
      .from('payroll_exports')
      .insert({
        organisation_id: organisationId,
        pay_period_id: input.pay_period_id,
        provider: input.provider,
        file_urls: [filePath] as Json,
        totals_summary: summary as unknown as Json,
        created_by_user_id: user.id,
        created_by_name: user.user_metadata?.display_name || user.email,
        created_by_email: user.email,
      })
      .select()
      .single();

    if (exportError) throw exportError;

    // Lock timesheets
    const timesheetIds = timesheets.map(t => t.id);
    await supabase.rpc('lock_timesheets_for_export', {
      _timesheet_ids: timesheetIds,
      _pay_period_id: input.pay_period_id,
    });

    // Update pay period status
    await this.updatePayPeriodStatus(input.pay_period_id, 'exported');

    // Audit log
    await auditService.log({
      action: 'payroll_export.generate',
      entityType: 'payroll_export',
      entityId: exportRecord.id,
      organisationId,
      afterState: {
        provider: input.provider,
        timesheets_count: timesheetIds.length,
        total_hours: summary.totalHours,
        employees_count: summary.employeesCount,
      },
    });

    return {
      ...exportRecord,
      file_urls: (exportRecord.file_urls || []) as string[],
      totals_summary: summary,
    } as PayrollExport;
  }

  private generateCSVContent(
    provider: PayrollProvider,
    timesheets: TimesheetForExport[],
    mappings: PayrollMapping[]
  ): string {
    const mappingLookup = new Map(mappings.map(m => [m.shift_type, m.earning_code]));

    switch (provider) {
      case 'generic_csv':
        return this.generateGenericCSV(timesheets, mappingLookup);
      case 'keypay':
        return this.generateKeyPayCSV(timesheets, mappingLookup);
      case 'xero':
        return this.generateXeroCSV(timesheets, mappingLookup);
      case 'myob':
        return this.generateMYOBCSV(timesheets, mappingLookup);
      default:
        return this.generateGenericCSV(timesheets, mappingLookup);
    }
  }

  private escapeCSV(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private generateGenericCSV(
    timesheets: TimesheetForExport[],
    mappingLookup: Map<string, string>
  ): string {
    const headers = [
      'employee_email',
      'employee_name',
      'date',
      'start_time',
      'end_time',
      'break_minutes',
      'hours',
      'earning_code',
      'cost_center',
      'notes',
    ];

    const rows = timesheets.map(ts => [
      this.escapeCSV(ts.employee_email),
      this.escapeCSV(ts.employee_name),
      this.escapeCSV(ts.date),
      this.escapeCSV(ts.clock_in),
      this.escapeCSV(ts.clock_out),
      this.escapeCSV(ts.break_minutes),
      this.escapeCSV(ts.total_hours?.toFixed(2)),
      this.escapeCSV(mappingLookup.get(ts.shift_type || 'standard') || 'ORD'),
      '', // cost_center
      this.escapeCSV(ts.notes),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  private generateKeyPayCSV(
    timesheets: TimesheetForExport[],
    mappingLookup: Map<string, string>
  ): string {
    const headers = [
      'Employee Email',
      'Location',
      'Date',
      'Earnings Category',
      'Units',
      'Notes',
    ];

    const rows = timesheets.map(ts => [
      this.escapeCSV(ts.employee_email),
      '', // Location
      this.escapeCSV(ts.date),
      this.escapeCSV(mappingLookup.get(ts.shift_type || 'standard') || 'Ordinary Hours'),
      this.escapeCSV(ts.total_hours?.toFixed(2)),
      this.escapeCSV(ts.notes),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  private generateXeroCSV(
    timesheets: TimesheetForExport[],
    mappingLookup: Map<string, string>
  ): string {
    const headers = [
      'Employee Email',
      'Earnings Rate Code',
      'Units',
      'Date',
    ];

    const rows = timesheets.map(ts => [
      this.escapeCSV(ts.employee_email),
      this.escapeCSV(mappingLookup.get(ts.shift_type || 'standard') || 'ORD'),
      this.escapeCSV(ts.total_hours?.toFixed(2)),
      this.escapeCSV(ts.date),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  private generateMYOBCSV(
    timesheets: TimesheetForExport[],
    mappingLookup: Map<string, string>
  ): string {
    const headers = [
      'Employee Email',
      'Payroll Category',
      'Units',
      'Date',
    ];

    const rows = timesheets.map(ts => [
      this.escapeCSV(ts.employee_email),
      this.escapeCSV(mappingLookup.get(ts.shift_type || 'standard') || 'Base Hourly'),
      this.escapeCSV(ts.total_hours?.toFixed(2)),
      this.escapeCSV(ts.date),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  // =====================================================
  // Export Download & Void
  // =====================================================

  async getDownloadUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('payroll-exports')
      .createSignedUrl(filePath, 3600); // 1 hour

    if (error) throw error;
    return data.signedUrl;
  }

  async voidExport(exportId: string, reason: string): Promise<PayrollExport> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('payroll_exports')
      .update({
        status: 'voided',
        voided_at: new Date().toISOString(),
        voided_by_user_id: user.id,
        voided_by_name: user.user_metadata?.display_name || user.email,
        voided_reason: reason,
      })
      .eq('id', exportId)
      .select()
      .single();

    if (error) throw error;

    await auditService.log({
      action: 'payroll_export.void',
      entityType: 'payroll_export',
      entityId: exportId,
      organisationId: data.organisation_id,
      afterState: { reason, voided_at: data.voided_at },
    });

    return {
      ...data,
      file_urls: (data.file_urls || []) as string[],
      totals_summary: this.parseTotalsSummary(data.totals_summary),
    } as PayrollExport;
  }

  // =====================================================
  // Timesheet Unlock
  // =====================================================

  async unlockTimesheet(timesheetId: string, reason: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('unlock_timesheet', {
      _timesheet_id: timesheetId,
      _user_id: user.id,
      _user_name: user.user_metadata?.display_name || user.email,
      _user_email: user.email,
      _reason: reason,
    });

    if (error) throw error;

    await auditService.log({
      action: 'timesheet.unlock',
      entityType: 'timesheet',
      entityId: timesheetId,
      afterState: { reason, unlocked_at: new Date().toISOString() },
    });

    return data as boolean;
  }
}

export const payrollExportService = new PayrollExportService();
