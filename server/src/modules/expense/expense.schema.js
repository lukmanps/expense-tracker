import { z } from 'zod';

export const createExpenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  categoryId: z.string().min(1, 'Invalid category'),
  date: z.string().transform((s) => new Date(s)),
  notes: z.string().max(500).optional().nullable(),
  recurring: z.boolean().optional().default(false),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  recurring: z.coerce.boolean().optional(),
});
