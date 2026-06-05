import { z } from 'zod';

const seatClassEnum = z.enum(['economy', 'business', 'first']);

export const createFlightSchema = z.object({
  destinationId: z.string().uuid(),
  airline: z.string().min(1).max(255),
  flightNumber: z.string().min(1).max(50),
  departureCity: z.string().min(1).max(255),
  arrivalCity: z.string().min(1).max(255),
  departureTime: z.string().datetime(),
  arrivalTime: z.string().datetime(),
  durationMin: z.number().int().positive(),
  seatClass: seatClassEnum.default('economy'),
  basePrice: z.number().positive(),
  availableSeats: z.number().int().min(0),
});

export const updateFlightSchema = z.object({
  destinationId: z.string().uuid().optional(),
  airline: z.string().min(1).max(255).optional(),
  flightNumber: z.string().min(1).max(50).optional(),
  departureCity: z.string().min(1).max(255).optional(),
  arrivalCity: z.string().min(1).max(255).optional(),
  departureTime: z.string().datetime().optional(),
  arrivalTime: z.string().datetime().optional(),
  durationMin: z.number().int().positive().optional(),
  seatClass: seatClassEnum.optional(),
  basePrice: z.number().positive().optional(),
  availableSeats: z.number().int().min(0).optional(),
});

export const listFlightsQuerySchema = z.object({
  departure_city: z.string().optional(),
  arrival_city: z.string().optional(),
  date: z.string().optional(),
  seat_class: seatClassEnum.optional(),
  min_price: z.string().optional(),
  max_price: z.string().optional(),
  destination_id: z.string().optional(),
  sort: z.enum(['price', 'duration', 'departureTime']).optional().default('departureTime'),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const updateSeatsSchema = z.object({
  available_seats: z.number().int().min(0),
});
