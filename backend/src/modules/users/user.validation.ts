import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  preferences: z
    .object({
      currency: z.string().optional(),
      language: z.string().optional(),
      notifications: z.boolean().optional(),
    })
    .optional(),
});
