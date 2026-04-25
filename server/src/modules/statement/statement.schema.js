import { z } from 'zod';

export const confirmTransactionSchema = z.object({
  transactions: z.array(
    z.object({
      date: z.string().min(1, 'Date is required'),
      description: z.string().min(1, 'Description is required'),
      amount: z.number().positive('Amount must be positive'),
      categoryId: z.string().min(1, 'Category is required'),
      notes: z.string().max(500).optional().nullable(),
    })
  ).min(1, 'At least one transaction is required'),
});
