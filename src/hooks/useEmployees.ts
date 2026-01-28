import { useState, useEffect } from 'react';
import { Employee } from '@/types/hrms';
import { mockEmployees } from '@/lib/mock-data';

const EMPLOYEES_STORAGE_KEY = 'hrms_employees';

// Initialize localStorage with mock data if empty or corrupted
const initializeEmployees = (): Employee[] => {
  const stored = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Validate that we have an array with employees
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Fall through to initialize with mock data
    }
  }
  // Initialize with mock data
  localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(mockEmployees));
  return mockEmployees;
};

const getStoredEmployees = (): Employee[] => {
  const stored = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Fall through
    }
  }
  // Re-initialize if data is missing or corrupted
  return initializeEmployees();
};

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>(() => initializeEmployees());

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
