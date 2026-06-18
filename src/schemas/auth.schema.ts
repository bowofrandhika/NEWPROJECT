import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

export const updatePasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  role: z.enum(['SUPER_USER', 'ADMIN', 'SPV', 'MANDOR', 'DRYER_OPERATOR', 'PACKING_OPERATOR']),
  photo_url: z.string().optional(),
  plant_code: z.string().max(20).optional(),
  department: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  is_active: z.boolean().default(true)
});

export const changePasswordSchema = z.object({
  new_password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string().min(6, 'Password must be at least 6 characters')
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"]
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;
export type UserFormData = z.infer<typeof userSchema>;
