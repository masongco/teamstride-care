// Database-aligned types for employees, timesheets, and certifications
// These types match the Supabase schema exactly

export type EmploymentTypeDB = 'casual' | 'part_time' | 'full_time' | 'contractor';

export type EmployeeStatusDB =
  | 'active'
  | 'inactive'
  | 'onboarding'
  | 'offboarding'
  | 'terminated';

export type ComplianceStatusDB = 'compliant' | 'expiring' | 'expired' | 'pending';

export type TimesheetStatus = 'pending' | 'approved' | 'rejected';

export type LeaveType =
  | 'annual'
  | 'personal'
  | 'unpaid'
  | 'compassionate'
  | 'parental'
  | 'other';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface EmployeeDB {
  id: string;
  organisation_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  employment_type: EmploymentTypeDB;
  position: string | null;
  department: string | null;
  start_date: string | null;
  end_date: string | null;
  status: EmployeeStatusDB;
  compliance_status: ComplianceStatusDB;
  pay_rate: number | null;
  award_classification_id: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeCertificationDB {
  id: string;
  organisation_id: string;
  employee_id: string;
  name: string;
  type: string;
  issue_date: string | null;
  expiry_date: string | null;
  status: ComplianceStatusDB;
  document_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimesheetDB {
  id: string;
  organisation_id: string;
  employee_id: string;
  date: string;
  clock_in: string;
  clock_out: string | null;
  break_minutes: number;
  total_hours: number | null;
  status: TimesheetStatus;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequestDB {
  id: string;
  organisation_id: string;
  employee_id: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  hours: number;
  reason: string | null;
  status: LeaveStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

// Input types for creating/updating records
export interface CreateEmployeeInput {
  /**
   * organisation_id is OPTIONAL because the database (trigger/RLS)
   * should attach the current user's organisation automatically.
   * Platform admins may still pass it explicitly if needed.
   */
  organisation_id?: string;

  first_name: string;
  last_name: string;
  email: string;

  phone?: string;
  avatar_url?: string;

  employment_type: EmploymentTypeDB;
  position?: string;
  department?: string;

  start_date?: string;
  pay_rate?: number;

  award_classification_id?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

export interface UpdateEmployeeInput
  extends Partial<Omit<EmployeeDB, 'id' | 'organisation_id' | 'created_at' | 'updated_at'>> {}

export interface CreateTimesheetInput {
  organisation_id: string;
  employee_id: string;
  date: string;
  clock_in: string;
  clock_out?: string;
  break_minutes?: number;
  total_hours?: number;
  notes?: string;
}

export interface CreateCertificationInput {
  organisation_id: string;
  employee_id: string;
  name: string;
  type: string;
  issue_date?: string;
  expiry_date?: string;
  status?: ComplianceStatusDB;
  document_id?: string;
}