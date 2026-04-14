import { z } from 'zod';

export const createTransactionSchema = z.object({
  type: z.enum(['to_pay', 'to_receive']),
  name: z.string().min(1, 'Name is required').max(100),
  amount: z.number().positive('Amount must be positive'),
  categoryId: z.string().min(1).optional().nullable(),
  dueDate: z.string().transform((s) => new Date(s)).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['to_pay', 'to_receive']).optional(),
  status: z.enum(['pending', 'completed']).optional(),
  search: z.string().optional(),
});
