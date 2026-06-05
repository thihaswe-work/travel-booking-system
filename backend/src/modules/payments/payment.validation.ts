import { z } from 'zod';

export const processPaymentSchema = z.object({
  paymentMethod: z.enum(['card', 'cash_on_arrival']),
  cardLastFour: z.string().length(4).optional(),
  mockSuccess: z.boolean().default(true),
});
