import prisma from '../../config/database';
import { getPagination, getPaginationMeta } from '../../utils/pagination';
import { AppError } from '../../utils/AppError';
import { Prisma } from '@prisma/client';

interface ListFilters {
  departureCity?: string;
  arrivalCity?: string;
  date?: string;
  seatClass?: string;
  minPrice?: number;
  maxPrice?: number;
  destinationId?: string;
  sort?: string;
}

export async function list(filters: ListFilters, query: { page?: string; limit?: string }) {
  const { skip, take, page, limit } = getPagination(query);

  const where: Prisma.FlightWhereInput = { isActive: true };

  if (filters.departureCity) {
    where.departureCity = { contains: filters.departureCity, mode: 'insensitive' };
  }

  if (filters.arrivalCity) {
    where.arrivalCity = { contains: filters.arrivalCity, mode: 'insensitive' };
  }

  if (filters.date) {
    const dateStart = new Date(filters.date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(filters.date);
    dateEnd.setHours(23, 59, 59, 999);
    where.departureTime = { gte: dateStart, lte: dateEnd };
  }

  if (filters.seatClass) {
    where.seatClass = filters.seatClass as Prisma.EnumSeatClassFilter['equals'];
  }

  if (filters.destinationId) {
    where.destinationId = filters.destinationId;
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.basePrice = {};
    if (filters.minPrice !== undefined) where.basePrice.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) where.basePrice.lte = filters.maxPrice;
  }

  const sortField = filters.sort || 'departureTime';
  const orderBy: Prisma.FlightOrderByWithRelationInput =
    sortField === 'price' ? { basePrice: 'asc' } :
    sortField === 'duration' ? { durationMin: 'asc' } :
    { departureTime: 'asc' };

  const [data, total] = await Promise.all([
    prisma.flight.findMany({
      where,
      include: { destination: true },
      orderBy,
      skip,
      take,
    }),
    prisma.flight.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(total, page, limit) };
}

export async function getById(id: string) {
  const flight = await prisma.flight.findUnique({
    where: { id },
    include: { destination: true },
  });

  if (!flight) {
    throw new AppError('Flight not found', 404, 'NOT_FOUND');
  }

  return flight;
}

export async function create(data: {
  destinationId: string;
  airline: string;
  flightNumber: string;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  durationMin: number;
  seatClass?: string;
  basePrice: number;
  availableSeats: number;
}) {
  return prisma.flight.create({
    data: {
      ...data,
      seatClass: data.seatClass as 'economy' | 'business' | 'first',
      departureTime: new Date(data.departureTime),
      arrivalTime: new Date(data.arrivalTime),
    },
    include: { destination: true },
  });
}

export async function update(
  id: string,
  data: Partial<{
    destinationId: string;
    airline: string;
    flightNumber: string;
    departureCity: string;
    arrivalCity: string;
    departureTime: string;
    arrivalTime: string;
    durationMin: number;
    seatClass: string;
    basePrice: number;
    availableSeats: number;
  }>,
) {
  const existing = await prisma.flight.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Flight not found', 404, 'NOT_FOUND');
  }

  const updateData: Record<string, unknown> = { ...data };
  if (data.departureTime) updateData.departureTime = new Date(data.departureTime);
  if (data.arrivalTime) updateData.arrivalTime = new Date(data.arrivalTime);

  return prisma.flight.update({
    where: { id },
    data: updateData,
    include: { destination: true },
  });
}

export async function softDelete(id: string) {
  const existing = await prisma.flight.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Flight not found', 404, 'NOT_FOUND');
  }

  return prisma.flight.update({ where: { id }, data: { isActive: false } });
}

export async function updateSeats(id: string, availableSeats: number) {
  const existing = await prisma.flight.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Flight not found', 404, 'NOT_FOUND');
  }

  if (availableSeats < 0) {
    throw new AppError('Available seats cannot be negative', 400, 'INVALID_SEATS');
  }

  return prisma.flight.update({
    where: { id },
    data: { availableSeats },
    include: { destination: true },
  });
}
