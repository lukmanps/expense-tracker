import { z } from 'zod';

export const createIncomeSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  source: z.string().min(1, 'Source is required').max(100),
  date: z.string().transform((s) => new Date(s)),
  notes: z.string().max(500).optional().nullable(),
});

export const updateIncomeSchema = createIncomeSchema.partial();

export const incomeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  source: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
});
