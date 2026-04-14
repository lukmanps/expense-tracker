import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  icon: z.string().min(1, 'Icon is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color hex'),
  type: z.enum(['expense', 'income']).default('expense'),
});

export const updateCategorySchema = createCategorySchema.partial();
