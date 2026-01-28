/**
 * Payroll Export Types
 * Types for the Payroll Export Integration module
 */

export type PayPeriodStatus = 'open' | 'exported' | 'closed';
export type PayrollProvider = 'generic_csv' | 'keypay' | 'xero' | 'myob';
export type PayrollExportStatus = 'generated' | 'voided';

export interface PayPeriod {
  id: string;
  organisation_id: string;
  start_date: string;
  end_date: string;
  status: PayPeriodStatus;
  created_by_user_id: string;
  created_by_name: string | null;
  created_by_email: string | null;
  closed_at: string | null;
  closed_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollMapping {
  id: string;
  organisation_id: string;
  shift_type: string;
  earning_code: string;
  description: string | null;
  multiplier: number;
  applies_when: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayrollExport {
  id: string;
  organisation_id: string;
  pay_period_id: string;
  provider: PayrollProvider;
  file_urls: string[];
  totals_summary: PayrollExportSummary;
  created_by_user_id: string;
  created_by_name: string | null;
  created_by_email: string | null;
  status: PayrollExportStatus;
  voided_at: string | null;
  voided_by_user_id: string | null;
  voided_by_name: string | null;
  voided_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  pay_period?: PayPeriod;
}

export interface PayrollExportSummary {
  totalHours: number;
  employeesCount: number;
  linesCount: number;
  totalEarnings?: number;
}

export interface TimesheetForExport {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_email?: string;
  date: string;
  clock_in: string;
  clock_out: string | null;
  break_minutes: number;
  total_hours: number | null;
  status: string;
  notes: string | null;
  shift_type?: string;
  is_locked: boolean;
  exported_at: string | null;
}

export interface ExportValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  timesheets: TimesheetForExport[];
}

export interface ValidationError {
  type: 'missing_mapping' | 'missing_identifier' | 'unapproved' | 'already_exported' | 'invalid_dates';
  message: string;
  employeeId?: string;
  employeeName?: string;
  shiftType?: string;
}

export interface ValidationWarning {
  type: 'duplicate' | 'overlap' | 'long_shift';
  message: string;
  employeeId?: string;
  employeeName?: string;
  date?: string;
}

export interface CreatePayPeriodInput {
  start_date: string;
  end_date: string;
}

export interface CreatePayrollMappingInput {
  shift_type: string;
  earning_code: string;
  description?: string;
  multiplier?: number;
  applies_when?: Record<string, unknown>;
}

export interface GenerateExportInput {
  pay_period_id: string;
  provider: PayrollProvider;
  timesheet_ids: string[];
}

// CSV Column Schemas per Provider
export const PROVIDER_COLUMNS: Record<PayrollProvider, string[]> = {
  generic_csv: [
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
  ],
  keypay: [
    'employee_email',
    'location',
    'date',
    'earnings_category',
    'units',
    'notes',
  ],
  xero: [
    'employee_email',
    'earnings_rate_code',
    'units',
    'date',
  ],
  myob: [
    'employee_email',
    'payroll_category',
    'units',
    'date',
  ],
};

export const PROVIDER_LABELS: Record<PayrollProvider, string> = {
  generic_csv: 'Generic Payroll CSV',
  keypay: 'KeyPay Import',
  xero: 'Xero Payroll',
  myob: 'MYOB Payroll',
};

export const PROVIDER_DESCRIPTIONS: Record<PayrollProvider, string> = {
  generic_csv: 'Standard CSV format compatible with most payroll systems',
  keypay: 'KeyPay timesheet/earnings lines import format',
  xero: 'Xero Payroll earnings import format',
  myob: 'MYOB Payroll categories import format',
};
