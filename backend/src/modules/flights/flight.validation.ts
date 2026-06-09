import { z } from 'zod';

const seatClassEnum = z.enum(['economy', 'business', 'first']);

const seatSchema = z.object({
  seatClass: seatClassEnum,
  price: z.number().positive(),
  availableSeats: z.number().int().min(0),
  totalSeats: z.number().int().min(0),
});

export const createFlightSchema = z.object({
  destinationId: z.string().uuid(),
  airline: z.string().min(1).max(255),
  flightNumber: z.string().min(1).max(50),
  departureCity: z.string().min(1).max(255),
  arrivalCity: z.string().min(1).max(255),
  departureTime: z.string(),
  arrivalTime: z.string(),
  durationMin: z.number().int().positive(),
  seats: z.array(seatSchema).min(1),
});

export const updateFlightSchema = z.object({
  destinationId: z.string().uuid().optional(),
  airline: z.string().min(1).max(255).optional(),
  flightNumber: z.string().min(1).max(50).optional(),
  departureCity: z.string().min(1).max(255).optional(),
  arrivalCity: z.string().min(1).max(255).optional(),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
  durationMin: z.number().int().positive().optional(),
  seats: z.array(seatSchema).optional(),
});

export const listFlightsQuerySchema = z.object({
  departure_city: z.string().optional(),
  arrival_city: z.string().optional(),
  date: z.string().optional(),
  seat_class: seatClassEnum.optional(),
  min_price: z.string().optional(),
  max_price: z.string().optional(),
  destination_id: z.string().optional(),
  sort: z.enum(['duration', 'departureTime']).optional().default('departureTime'),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const updateSeatsSchema = z.object({
  available_seats: z.number().int().min(0),
});
