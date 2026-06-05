import prisma from '../../config/database';
import { getPagination, getPaginationMeta } from '../../utils/pagination';
import { AppError } from '../../utils/AppError';
import { Prisma } from '@prisma/client';

interface ListFilters {
  destinationId?: string;
  minRating?: number;
  maxPrice?: number;
  search?: string;
  sort?: string;
}

export async function list(filters: ListFilters, query: { page?: string; limit?: string }) {
  const { skip, take, page, limit } = getPagination(query);

  const where: Prisma.HotelWhereInput = { isActive: true };

  if (filters.destinationId) {
    where.destinationId = filters.destinationId;
  }

  if (filters.minRating) {
    where.starRating = { gte: filters.minRating };
  }

  if (filters.search) {
    where.name = { contains: filters.search, mode: 'insensitive' };
  }

  if (filters.maxPrice !== undefined) {
    where.rooms = {
      some: {
        isActive: true,
        pricePerNight: { lte: filters.maxPrice },
        availableRooms: { gt: 0 },
      },
    };
  }

  const sortField = filters.sort || 'name';
  const orderBy: Prisma.HotelOrderByWithRelationInput =
    sortField === 'rating' ? { starRating: 'desc' } :
    sortField === 'price' ? { starRating: 'desc' } :
    { name: 'asc' };

  const [data, total] = await Promise.all([
    prisma.hotel.findMany({
      where,
      include: {
        destination: true,
        rooms: {
          where: { isActive: true, availableRooms: { gt: 0 } },
          orderBy: { pricePerNight: 'asc' },
        },
      },
      orderBy,
      skip,
      take,
    }),
    prisma.hotel.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(total, page, limit) };
}

export async function getById(id: string) {
  const hotel = await prisma.hotel.findUnique({
    where: { id },
    include: {
      destination: true,
      rooms: {
        where: { isActive: true },
        orderBy: { pricePerNight: 'asc' },
      },
    },
  });

  if (!hotel) {
    throw new AppError('Hotel not found', 404, 'NOT_FOUND');
  }

  return hotel;
}

export async function create(data: {
  destinationId: string;
  name: string;
  address?: string;
  starRating: number;
  description?: string;
  imageUrl?: string;
  rooms?: Array<{
    roomType: string;
    pricePerNight: number;
    maxGuests: number;
    totalRooms: number;
    availableRooms: number;
    amenities?: unknown;
  }>;
}) {
  const { rooms, ...hotelData } = data;

  return prisma.hotel.create({
    data: {
      ...hotelData,
      rooms: rooms
        ? {
            create: rooms.map((r) => ({
              roomType: r.roomType,
              pricePerNight: r.pricePerNight,
              maxGuests: r.maxGuests,
              totalRooms: r.totalRooms,
              availableRooms: r.availableRooms,
              amenities: r.amenities as any,
            })),
          }
        : undefined,
    },
    include: {
      destination: true,
      rooms: {
        where: { isActive: true },
      },
    },
  });
}

export async function update(
  id: string,
  data: Partial<{
    destinationId: string;
    name: string;
    address: string;
    starRating: number;
    description: string;
    imageUrl: string;
  }>,
) {
  const existing = await prisma.hotel.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Hotel not found', 404, 'NOT_FOUND');
  }

  return prisma.hotel.update({
    where: { id },
    data,
    include: {
      destination: true,
      rooms: {
        where: { isActive: true },
      },
    },
  });
}

export async function softDelete(id: string) {
  const existing = await prisma.hotel.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Hotel not found', 404, 'NOT_FOUND');
  }

  await prisma.hotelRoom.updateMany({
    where: { hotelId: id },
    data: { isActive: false },
  });

  return prisma.hotel.update({ where: { id }, data: { isActive: false } });
}

export async function getRooms(hotelId: string) {
  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel) {
    throw new AppError('Hotel not found', 404, 'NOT_FOUND');
  }

  return prisma.hotelRoom.findMany({
    where: { hotelId, isActive: true },
    orderBy: { pricePerNight: 'asc' },
  });
}
