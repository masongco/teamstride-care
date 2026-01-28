/**
 * @deprecated This hook is deprecated. Use useSupabaseEmployees instead.
 * This file remains for backward compatibility only.
 * Employee data is now persisted in Supabase, not localStorage.
 */

import { useSupabaseEmployees } from './useSupabaseEmployees';
import type { Employee } from '@/types/hrms';
import type { EmployeeDB } from '@/types/database';

// Legacy storage key - no longer used, but kept for reference
export const EMPLOYEES_STORAGE_KEY = 'hrms_employees';

// Transform DB employee to legacy format
function dbToLegacyEmployee(emp: EmployeeDB): Employee {
  return {
    id: emp.id,
    firstName: emp.first_name,
    lastName: emp.last_name,
    email: emp.email,
    phone: emp.phone || '',
    avatar: emp.avatar_url || undefined,
    employmentType: emp.employment_type as Employee['employmentType'],
    position: emp.position || '',
    department: emp.department || '',
    startDate: emp.start_date || '',
    status: emp.status as Employee['status'],
    complianceStatus: emp.compliance_status as Employee['complianceStatus'],
    payRate: emp.pay_rate || 0,
    awardClassification: undefined,
    emergencyContact: emp.emergency_contact_name ? {
      name: emp.emergency_contact_name,
      phone: emp.emergency_contact_phone || '',
      relationship: emp.emergency_contact_relationship || '',
    } : undefined,
    documents: [],
    certifications: [],
  };
}

/**
 * @deprecated Use useSupabaseEmployees instead.
 * This hook provides backward compatibility for components still using the old interface.
 */
export function useEmployees() {
  const {
    employees: dbEmployees,
    activeEmployees: dbActiveEmployees,
    refetch,
    isLoading,
  } = useSupabaseEmployees();

  // Transform to legacy format
  const employees = dbEmployees.map(dbToLegacyEmployee);
  const activeEmployees = dbActiveEmployees.map(dbToLegacyEmployee);

  return {
    employees,
    activeEmployees,
    refetch,
    isLoading,
  };
}
