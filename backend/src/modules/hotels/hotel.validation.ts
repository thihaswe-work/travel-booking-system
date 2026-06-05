import { z } from 'zod';

const roomSchema = z.object({
  roomType: z.string().min(1).max(100),
  pricePerNight: z.number().positive(),
  maxGuests: z.number().int().positive(),
  totalRooms: z.number().int().min(0),
  availableRooms: z.number().int().min(0),
  amenities: z.any().optional(),
});

export const createHotelSchema = z.object({
  destinationId: z.string().uuid(),
  name: z.string().min(1).max(255),
  address: z.string().optional(),
  starRating: z.number().int().min(1).max(5),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  rooms: z.array(roomSchema).optional(),
});

export const updateHotelSchema = z.object({
  destinationId: z.string().uuid().optional(),
  name: z.string().min(1).max(255).optional(),
  address: z.string().optional(),
  starRating: z.number().int().min(1).max(5).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  rooms: z.array(roomSchema).optional(),
});

export const listHotelsQuerySchema = z.object({
  destination_id: z.string().optional(),
  check_in: z.string().optional(),
  check_out: z.string().optional(),
  guests: z.string().optional(),
  min_rating: z.string().optional(),
  max_price: z.string().optional(),
  sort: z.enum(['rating', 'price', 'name']).optional().default('name'),
  page: z.string().optional(),
  limit: z.string().optional(),
});
