// User Roles
export type UserRole = 'admin' | 'hr_manager' | 'coordinator' | 'supervisor' | 'employee' | 'payroll_officer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  employeeId?: string;
}

// Employee Types
export type EmploymentType = 'casual' | 'part_time' | 'full_time' | 'contractor';

export type ComplianceStatus = 'compliant' | 'expiring' | 'expired' | 'pending';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  employmentType: EmploymentType;
  position: string;
  department: string;
  startDate: string;
  status: 'active' | 'inactive' | 'onboarding' | 'offboarding';
  complianceStatus: ComplianceStatus;
  payRate: number;
  awardClassification?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  documents: Document[];
  certifications: Certification[];
}

export interface Certification {
  id: string;
  name: string;
  type: 'police_check' | 'ndis_screening' | 'first_aid' | 'cpr' | 'training' | 'other';
  issueDate: string;
  expiryDate: string;
  status: ComplianceStatus;
  documentId?: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'contract' | 'id' | 'certificate' | 'policy' | 'other';
  uploadedAt: string;
  signedAt?: string;
  url: string;
}

// Leave Types
export type LeaveType = 'annual' | 'personal' | 'unpaid' | 'compassionate' | 'parental' | 'other';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  hours: number;
  reason?: string;
  status: LeaveStatus;
  approvedBy?: string;
  createdAt: string;
}

export interface LeaveBalance {
  annual: number;
  personal: number;
  unpaid: number;
}

// Timesheet Types
export interface TimesheetEntry {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  breakMinutes: number;
  totalHours: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

// Dashboard Metrics
export interface DashboardMetrics {
  totalEmployees: number;
  activeToday: number;
  pendingLeaveRequests: number;
  complianceAlerts: number;
  expiringCertifications: Certification[];
  upcomingBirthdays: Employee[];
  recentHires: Employee[];
}
