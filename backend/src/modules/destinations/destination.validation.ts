import { z } from 'zod';

export const createDestinationSchema = z.object({
  name: z.string().min(1).max(255),
  country: z.string().min(1).max(255),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export const updateDestinationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  country: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export const listDestinationsQuerySchema = z.object({
  country: z.string().optional(),
  is_active: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  page: z.string().optional(),
  limit: z.string().optional(),
  sort_by: z.enum(['name', 'country', 'createdAt']).optional().default('createdAt'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
});
