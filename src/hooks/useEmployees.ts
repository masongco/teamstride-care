import { useState, useEffect } from 'react';
import { Employee } from '@/types/hrms';
import { mockEmployees } from '@/lib/mock-data';

const EMPLOYEES_STORAGE_KEY = 'hrms_employees';

const getStoredEmployees = (): Employee[] => {
  const stored = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return mockEmployees;
    }
  }
  return mockEmployees;
};

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>(getStoredEmployees);

  // Listen for storage changes (in case employees are updated in another tab/component)
  useEffect(() => {
    const handleStorageChange = () => {
      setEmployees(getStoredEmployees());
    };

    // Also listen for custom events from the same tab
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('employees-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('employees-updated', handleStorageChange);
    };
  }, []);

  // Get only active employees
  const activeEmployees = employees.filter(e => e.status === 'active');

  return {
    employees,
    activeEmployees,
    refetch: () => setEmployees(getStoredEmployees()),
  };
}

// Export the storage key so it can be used consistently
export { EMPLOYEES_STORAGE_KEY };
