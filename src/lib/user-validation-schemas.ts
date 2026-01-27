import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .trim(),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password must be less than 72 characters'),
  display_name: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .trim(),
  role: z.enum(['admin', 'manager', 'employee'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
