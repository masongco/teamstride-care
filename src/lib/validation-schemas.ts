import { z } from 'zod';

// Employee validation schema
export const employeeSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .trim(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .trim(),
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .trim(),
  phone: z.string()
    .max(20, 'Phone must be less than 20 characters')
    .regex(/^[0-9\s\-\+\(\)]*$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  position: z.string()
    .min(1, 'Position is required')
    .max(100, 'Position must be less than 100 characters')
    .trim(),
  department: z.string()
    .max(100, 'Department must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  employmentType: z.enum(['casual', 'part_time', 'full_time', 'contractor']),
  payRate: z.string()
    .regex(/^(\d+(\.\d{0,2})?)?$/, 'Please enter a valid pay rate')
    .refine((val) => {
      if (!val) return true;
      const num = parseFloat(val);
      return num >= 0 && num <= 9999.99;
    }, 'Pay rate must be between 0 and 9999.99')
    .optional()
    .or(z.literal('')),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

// Contract validation schema
export const contractSchema = z.object({
  title: z.string()
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  employee_name: z.string()
    .min(1, 'Employee name is required')
    .max(100, 'Employee name must be less than 100 characters')
    .trim(),
  employee_email: z.string()
    .min(1, 'Employee email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .trim(),
  position: z.string()
    .min(1, 'Position is required')
    .max(100, 'Position must be less than 100 characters')
    .trim(),
  department: z.string()
    .max(100, 'Department must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  start_date: z.string()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Please enter a valid date')
    .optional()
    .or(z.literal('')),
  pay_rate: z.string()
    .regex(/^(\d+(\.\d{0,2})?)?$/, 'Please enter a valid pay rate')
    .refine((val) => {
      if (!val) return true;
      const num = parseFloat(val);
      return num >= 0 && num <= 9999.99;
    }, 'Pay rate must be between 0 and 9999.99')
    .optional()
    .or(z.literal('')),
  employment_type: z.enum(['casual', 'part_time', 'full_time', 'contractor']),
  content: z.string()
    .min(10, 'Contract content must be at least 10 characters')
    .max(50000, 'Contract content must be less than 50000 characters'),
});

export type ContractFormData = z.infer<typeof contractSchema>;
