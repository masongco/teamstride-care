/**
 * Audit Pack Types
 * Types for the Audit Pack & Regulator Export system
 */

export type AuditPackType = 
  | 'employee_compliance'
  | 'organisation_compliance'
  | 'hr_incidents'
  | 'payroll_verification';

export type AuditPackStatus = 
  | 'pending'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'expired';

export interface AuditPack {
  id: string;
  organisation_id: string;
  pack_type: AuditPackType;
  status: AuditPackStatus;
  employee_id: string | null;
  date_range_start: string | null;
  date_range_end: string | null;
  include_restricted_content: boolean;
  include_attachments: boolean;
  generated_by: string;
  generated_by_name: string | null;
  generated_by_email: string | null;
  file_urls: string[];
  summary: AuditPackSummary;
  error_message: string | null;
  retention_days: number;
  expires_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditPackSummary {
  totalRecords?: number;
  certifications?: number;
  overrides?: number;
  auditEntries?: number;
  cases?: number;
  timesheets?: number;
  employees?: number;
  [key: string]: number | string | undefined;
}

export interface CreateAuditPackInput {
  pack_type: AuditPackType;
  employee_id?: string | null;
  date_range_start?: string | null;
  date_range_end?: string | null;
  include_restricted_content?: boolean;
  include_attachments?: boolean;
}

export interface AuditPackPreview {
  pack_type: AuditPackType;
  scope: string;
  dateRange: string;
  estimatedRecords: {
    employees?: number;
    certifications?: number;
    overrides?: number;
    auditLogs?: number;
    cases?: number;
    timesheets?: number;
  };
}

export const AUDIT_PACK_LABELS: Record<AuditPackType, string> = {
  employee_compliance: 'Employee Compliance Audit Pack',
  organisation_compliance: 'Organisation Compliance Overview',
  hr_incidents: 'HR Incidents & Disciplinary Pack',
  payroll_verification: 'Payroll & Timesheet Verification',
};

export const AUDIT_PACK_DESCRIPTIONS: Record<AuditPackType, string> = {
  employee_compliance: 'Complete compliance history for a selected employee including certifications, overrides, and audit trail.',
  organisation_compliance: 'Organisation-wide compliance snapshot including all employees, certifications, and enforcement events.',
  hr_incidents: 'HR case register with findings, outcomes, disciplinary actions, and full audit trail.',
  payroll_verification: 'Timesheet verification including approvals, edits, and pay rate history.',
};
