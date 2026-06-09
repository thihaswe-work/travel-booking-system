import { z } from 'zod';

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(255),
  expiresAt: z.string().optional(),
});

export const updateApiKeySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  isActive: z.boolean().optional(),
});
