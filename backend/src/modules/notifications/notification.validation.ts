import { z } from 'zod';

export const markReadSchema = z.object({
  notificationId: z.string(),
});

export const markAllReadSchema = z.object({});
