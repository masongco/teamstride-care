// HR Cases Module Types - Incidents, Misconduct & Disciplinary Management

export type HRCaseType = 'incident' | 'misconduct' | 'grievance' | 'performance' | 'complaint';
export type HRCaseSeverity = 'low' | 'medium' | 'high' | 'critical';
export type HRCaseStatus = 'new' | 'triaged' | 'investigating' | 'awaiting_response' | 'decision_made' | 'closed';
export type HRCaseReporterType = 'manager' | 'employee' | 'external' | 'anonymous';
export type HRCaseConfidentiality = 'standard' | 'restricted';
export type HRCaseSubstantiation = 'yes' | 'no' | 'partially';
export type HRActionType = 'verbal_warning' | 'written_warning' | 'final_warning' | 'training' | 'supervision' | 'termination' | 'no_action' | 'other';
export type HRActionStatus = 'planned' | 'active' | 'completed' | 'withdrawn';
export type HRAccessLevel = 'normal' | 'restricted';
export type HRNoteVisibility = 'standard' | 'restricted';

export interface HRCase {
  id: string;
  organisation_id: string;
  employee_id: string | null;
  case_number: string;
  case_type: HRCaseType;
  reported_by: HRCaseReporterType;
  reporter_name: string | null;
  reporter_contact: string | null;
  date_reported: string;
  summary: string;
  detailed_description: string | null;
  severity: HRCaseSeverity;
  safeguarding_flag: boolean;
  status: HRCaseStatus;
  assigned_investigator_user_id: string | null;
  confidentiality_level: HRCaseConfidentiality;
  created_by_user_id: string | null;
  closed_at: string | null;
  closure_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    position: string | null;
    department: string | null;
  } | null;
}

export interface HRCaseTriage {
  id: string;
  hr_case_id: string;
  initial_risk_assessment: string;
  immediate_actions_taken: string | null;
  escalation_required: boolean;
  escalated_to: string | null;
  triaged_by_user_id: string;
  triaged_at: string;
  created_at: string;
  updated_at: string;
}

export interface HRCaseEvidence {
  id: string;
  hr_case_id: string;
  file_url: string;
  file_name: string;
  description: string | null;
  uploaded_by_user_id: string;
  uploaded_by_name: string | null;
  access_level: HRAccessLevel;
  uploaded_at: string;
  created_at: string;
}

export interface HRCaseNote {
  id: string;
  hr_case_id: string;
  note_text: string;
  created_by_user_id: string;
  created_by_name: string | null;
  visibility: HRNoteVisibility;
  created_at: string;
}

export interface HRCaseFindings {
  id: string;
  hr_case_id: string;
  findings_summary: string;
  substantiated: HRCaseSubstantiation;
  contributing_factors: string | null;
  decision_maker_user_id: string;
  decision_maker_name: string | null;
  decision_date: string;
  created_at: string;
  updated_at: string;
}

export interface HRCaseAction {
  id: string;
  hr_case_id: string;
  action_type: HRActionType;
  description: string;
  effective_date: string;
  expiry_date: string | null;
  assigned_to_user_id: string | null;
  assigned_to_name: string | null;
  status: HRActionStatus;
  created_by_user_id: string;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

// Input types for creating/updating
export interface CreateHRCaseInput {
  organisation_id: string;
  employee_id?: string | null;
  case_type: HRCaseType;
  reported_by: HRCaseReporterType;
  reporter_name?: string;
  reporter_contact?: string;
  date_reported?: string;
  summary: string;
  detailed_description?: string;
  severity?: HRCaseSeverity;
  safeguarding_flag?: boolean;
  confidentiality_level?: HRCaseConfidentiality;
  assigned_investigator_user_id?: string;
}

export interface UpdateHRCaseInput {
  employee_id?: string | null;
  case_type?: HRCaseType;
  summary?: string;
  detailed_description?: string;
  severity?: HRCaseSeverity;
  safeguarding_flag?: boolean;
  status?: HRCaseStatus;
  assigned_investigator_user_id?: string | null;
  confidentiality_level?: HRCaseConfidentiality;
  closure_notes?: string;
}

export interface CreateTriageInput {
  hr_case_id: string;
  initial_risk_assessment: string;
  immediate_actions_taken?: string;
  escalation_required?: boolean;
  escalated_to?: string;
}

export interface CreateNoteInput {
  hr_case_id: string;
  note_text: string;
  visibility?: HRNoteVisibility;
}

export interface CreateFindingsInput {
  hr_case_id: string;
  findings_summary: string;
  substantiated: HRCaseSubstantiation;
  contributing_factors?: string;
}

export interface CreateActionInput {
  hr_case_id: string;
  action_type: HRActionType;
  description: string;
  effective_date: string;
  expiry_date?: string;
  assigned_to_user_id?: string;
  assigned_to_name?: string;
}

export interface UpdateActionInput {
  status?: HRActionStatus;
  description?: string;
  expiry_date?: string;
}

// Dashboard statistics
export interface HRCaseStats {
  total: number;
  byStatus: Record<HRCaseStatus, number>;
  byType: Record<HRCaseType, number>;
  bySeverity: Record<HRCaseSeverity, number>;
  openCases: number;
  closedCases: number;
  safeguardingCases: number;
  activeWarnings: number;
}

// Labels for display
export const CASE_TYPE_LABELS: Record<HRCaseType, string> = {
  incident: 'Incident',
  misconduct: 'Misconduct',
  grievance: 'Grievance',
  performance: 'Performance',
  complaint: 'Complaint',
};

export const CASE_SEVERITY_LABELS: Record<HRCaseSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const CASE_STATUS_LABELS: Record<HRCaseStatus, string> = {
  new: 'New',
  triaged: 'Triaged',
  investigating: 'Investigating',
  awaiting_response: 'Awaiting Response',
  decision_made: 'Decision Made',
  closed: 'Closed',
};

export const REPORTER_TYPE_LABELS: Record<HRCaseReporterType, string> = {
  manager: 'Manager',
  employee: 'Employee',
  external: 'External',
  anonymous: 'Anonymous',
};

export const ACTION_TYPE_LABELS: Record<HRActionType, string> = {
  verbal_warning: 'Verbal Warning',
  written_warning: 'Written Warning',
  final_warning: 'Final Warning',
  training: 'Training Required',
  supervision: 'Increased Supervision',
  termination: 'Termination',
  no_action: 'No Action',
  other: 'Other',
};

export const ACTION_STATUS_LABELS: Record<HRActionStatus, string> = {
  planned: 'Planned',
  active: 'Active',
  completed: 'Completed',
  withdrawn: 'Withdrawn',
};

export const SUBSTANTIATION_LABELS: Record<HRCaseSubstantiation, string> = {
  yes: 'Substantiated',
  no: 'Not Substantiated',
  partially: 'Partially Substantiated',
};
