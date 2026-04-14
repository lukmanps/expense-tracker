import { z } from 'zod';

export const registerSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be at most 15 digits')
    .regex(/^\+?[0-9]+$/, 'Invalid phone number format'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  email: z.string().email('Invalid email').optional().nullable(),
});

export const loginSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[0-9]+$/, 'Invalid phone number format'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
});
