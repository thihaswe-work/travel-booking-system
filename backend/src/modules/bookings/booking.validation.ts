import { z } from 'zod';

const passengerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  documentType: z.string().max(50).optional(),
  documentNumber: z.string().max(50).optional(),
  seatClass: z.string().max(20).optional(),
});

const bookingItemSchema = z.object({
  itemType: z.enum(['flight', 'hotel', 'tour']),
  itemId: z.string(),
  quantity: z.number().int().positive(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  passengers: z.array(passengerSchema).optional(),
});

export const createBookingSchema = z.object({
  bookingType: z.enum(['flight', 'hotel', 'tour', 'package']),
  items: z.array(bookingItemSchema).min(1),
  paymentMethod: z.enum(['card', 'cash_on_arrival']),
  notes: z.string().optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
});

export const cancelBookingSchema = z.object({
  reason: z.string().optional(),
});
