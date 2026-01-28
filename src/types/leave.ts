// Leave & Entitlements Types

export type AccrualFrequency = 'weekly' | 'fortnightly' | 'monthly' | 'annually';
export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveType {
  id: string;
  organisation_id: string;
  name: string;
  description: string | null;
  accrues: boolean;
  accrual_rate_hours: number;
  accrual_frequency: AccrualFrequency;
  max_balance_hours: number | null;
  paid: boolean;
  applicable_employment_types: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveBalance {
  id: string;
  organisation_id: string;
  employee_id: string;
  leave_type_id: string;
  balance_hours: number;
  last_accrual_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  leave_type?: LeaveType;
}

export interface LeaveRequest {
  id: string;
  organisation_id: string;
  employee_id: string;
  leave_type_id: string | null;
  type: string;
  start_date: string;
  end_date: string;
  hours: number;
  reason: string | null;
  status: LeaveRequestStatus;
  approved_by: string | null;
  approved_at: string | null;
  decided_by_user_id: string | null;
  decided_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  balance_deducted: boolean;
  override_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    employment_type: string;
    department: string | null;
  };
  leave_type?: LeaveType;
}

export interface LeaveAdjustment {
  id: string;
  organisation_id: string;
  employee_id: string;
  leave_type_id: string;
  adjustment_hours: number;
  reason: string;
  adjusted_by_user_id: string;
  adjusted_by_name: string | null;
  adjusted_by_email: string | null;
  created_at: string;
  // Joined data
  leave_type?: LeaveType;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface EmployeeLeaveOverview {
  employee_id: string;
  employee_name: string;
  balances: Array<{
    leave_type_id: string;
    leave_type_name: string;
    balance_hours: number;
    accrues: boolean;
    paid: boolean;
  }>;
}

export interface LeaveApprovalPayload {
  request_id: string;
  action: 'approve' | 'reject' | 'cancel';
  reason?: string;
  override_insufficient_balance?: boolean;
}

export interface LeaveAdjustmentPayload {
  employee_id: string;
  leave_type_id: string;
  adjustment_hours: number;
  reason: string;
}
