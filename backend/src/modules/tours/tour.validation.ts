import { z } from 'zod';

export const createTourSchema = z.object({
  destinationId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  durationDays: z.number().int().positive(),
  pricePerPerson: z.number().positive(),
  maxCapacity: z.number().int().positive(),
  availableSlots: z.number().int().min(0),
  includes: z.any().optional(),
  itinerary: z.any().optional(),
});

export const updateTourSchema = z.object({
  destinationId: z.string().uuid().optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  durationDays: z.number().int().positive().optional(),
  pricePerPerson: z.number().positive().optional(),
  maxCapacity: z.number().int().positive().optional(),
  availableSlots: z.number().int().min(0).optional(),
  includes: z.any().optional(),
  itinerary: z.any().optional(),
});

export const listToursQuerySchema = z.object({
  destination_id: z.string().optional(),
  min_price: z.string().optional(),
  max_price: z.string().optional(),
  min_duration: z.string().optional(),
  max_duration: z.string().optional(),
  sort: z.enum(['price', 'duration', 'name']).optional().default('name'),
  page: z.string().optional(),
  limit: z.string().optional(),
});
