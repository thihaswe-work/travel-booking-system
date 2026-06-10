import prisma from '../../config/database';
import { getPagination, getPaginationMeta } from '../../utils/pagination';
import { AppError } from '../../utils/AppError';
import { Prisma, SeatClass } from '@prisma/client';

interface ListFilters {
  departureCity?: string;
  arrivalCity?: string;
  date?: string;
  departureTime?: string;
  arrivalTime?: string;
  seatClass?: string;
  minPrice?: number;
  maxPrice?: number;
  destinationId?: string;
  sort?: string;
}

const flightInclude = {
  destination: true,
  seats: { orderBy: { price: 'asc' as const } },
};

const seatSome = (filters: ListFilters): Prisma.FlightSeatListRelationFilter | undefined => {
  const hasSeatFilter = filters.seatClass || filters.minPrice !== undefined || filters.maxPrice !== undefined;
  if (!hasSeatFilter) return undefined;

  const seatWhere: Prisma.FlightSeatWhereInput = {};
  if (filters.seatClass) {
    seatWhere.seatClass = filters.seatClass as SeatClass;
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    seatWhere.price = {};
    if (filters.minPrice !== undefined) seatWhere.price.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) seatWhere.price.lte = filters.maxPrice;
  }
  return { some: seatWhere };
};

export async function list(filters: ListFilters, query: { page?: string; limit?: string }) {
  const { skip, take, page, limit } = getPagination(query);

  const where: Prisma.FlightWhereInput = { isActive: true };

  if (filters.departureCity) {
    where.departureCity = { contains: filters.departureCity, mode: 'insensitive' };
  }
  if (filters.arrivalCity) {
    where.arrivalCity = { contains: filters.arrivalCity, mode: 'insensitive' };
  }
  const timeRange = (period?: string): { gte: number; lte: number } | null => {
    if (!period) return null;
    return {
      morning: { gte: 6, lte: 11 },
      afternoon: { gte: 12, lte: 17 },
      evening: { gte: 18, lte: 23 },
      night: { gte: 0, lte: 5 },
    }[period] || null;
  };

  const depRange = timeRange(filters.departureTime);
  if (filters.date || depRange) {
    const depFilter: Prisma.DateTimeFilter = {};

    if (filters.date) {
      const d = new Date(filters.date);
      const startH = depRange?.gte ?? 0;
      const endH = depRange?.lte ?? 23;
      depFilter.gte = new Date(d.getFullYear(), d.getMonth(), d.getDate(), startH, 0, 0);
      depFilter.lte = new Date(d.getFullYear(), d.getMonth(), d.getDate(), endH, 59, 59);
    }
    where.departureTime = depFilter;
  }
  if (depRange && !filters.date) {
    // time-of-day without date: use raw SQL to match hour
    const ids = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM flights WHERE EXTRACT(HOUR FROM departure_time) >= ${depRange.gte} AND EXTRACT(HOUR FROM departure_time) <= ${depRange.lte}
    `;
    where.id = { in: ids.map(r => r.id) };
  }

  const arrRange = timeRange(filters.arrivalTime);
  if (arrRange && filters.date) {
    const d = new Date(filters.date);
    where.arrivalTime = {
      gte: new Date(d.getFullYear(), d.getMonth(), d.getDate(), arrRange.gte, 0, 0),
      lte: new Date(d.getFullYear(), d.getMonth(), d.getDate(), arrRange.lte, 59, 59),
    };
  }
  if (arrRange && !filters.date) {
    const ids = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM flights WHERE EXTRACT(HOUR FROM arrival_time) >= ${arrRange.gte} AND EXTRACT(HOUR FROM arrival_time) <= ${arrRange.lte}
    `;
    if (where.id) {
      const existing = where.id as { in: string[] };
      const timeIds = new Set(ids.map(r => r.id));
      existing.in = existing.in.filter(id => timeIds.has(id));
    } else {
      where.id = { in: ids.map(r => r.id) };
    }
  }

  if (filters.destinationId) {
    where.destinationId = filters.destinationId;
  }

  const seatsFilter = seatSome(filters);
  if (seatsFilter) where.seats = seatsFilter;

  const sortField = filters.sort || 'departureTime';
  const orderBy: Prisma.FlightOrderByWithRelationInput =
    sortField === 'duration' ? { durationMin: 'asc' } :
    { departureTime: 'asc' };

  const [data, total] = await Promise.all([
    prisma.flight.findMany({
      where,
      include: flightInclude,
      orderBy,
      skip,
      take,
    }),
    prisma.flight.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(total, page, limit) };
}

export async function adminList(
  filters: { departureCity?: string; arrivalCity?: string; seatClass?: string; destinationId?: string; sort?: string },
  query: { page?: string; limit?: string },
  user: { id: string; role: string },
) {
  const { skip, take, page, limit } = getPagination(query);

  const where: Prisma.FlightWhereInput = {};

  if (user.role !== 'admin') {
    where.createdById = user.id;
  }

  if (filters.departureCity) {
    where.departureCity = { contains: filters.departureCity, mode: 'insensitive' };
  }
  if (filters.arrivalCity) {
    where.arrivalCity = { contains: filters.arrivalCity, mode: 'insensitive' };
  }
  if (filters.seatClass) {
    where.seats = { some: { seatClass: filters.seatClass as SeatClass } };
  }
  if (filters.destinationId) {
    where.destinationId = filters.destinationId;
  }

  const sortField = filters.sort || 'departureTime';
  const orderBy: Prisma.FlightOrderByWithRelationInput =
    sortField === 'duration' ? { durationMin: 'asc' } :
    { departureTime: 'asc' };

  const [data, total] = await Promise.all([
    prisma.flight.findMany({
      where,
      include: flightInclude,
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
    include: flightInclude,
  });

  if (!flight) {
    throw new AppError('Flight not found', 404, 'NOT_FOUND');
  }

  return flight;
}

interface SeatInput {
  seatClass: 'economy' | 'business' | 'first';
  price: number;
  availableSeats: number;
  totalSeats: number;
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
  seats: SeatInput[];
  createdById?: string;
  isActive?: boolean;
}) {
  return prisma.flight.create({
    data: {
      destinationId: data.destinationId,
      airline: data.airline,
      flightNumber: data.flightNumber,
      departureCity: data.departureCity,
      arrivalCity: data.arrivalCity,
      departureTime: new Date(data.departureTime),
      arrivalTime: new Date(data.arrivalTime),
      durationMin: data.durationMin,
      createdById: data.createdById,
      isActive: data.isActive,
      seats: {
        create: data.seats.map((s) => ({
          seatClass: s.seatClass as SeatClass,
          price: s.price,
          availableSeats: s.availableSeats,
          totalSeats: s.totalSeats,
        })),
      },
    },
    include: flightInclude,
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
    seats: SeatInput[];
  }>,
) {
  const existing = await prisma.flight.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Flight not found', 404, 'NOT_FOUND');
  }

  const { seats, ...flightData } = data;
  const updateData: Record<string, unknown> = { ...flightData };
  if (data.departureTime) updateData.departureTime = new Date(data.departureTime);
  if (data.arrivalTime) updateData.arrivalTime = new Date(data.arrivalTime);

  if (seats) {
    await prisma.flightSeat.deleteMany({ where: { flightId: id } });
    await prisma.flightSeat.createMany({
      data: seats.map((s) => ({
        flightId: id,
        seatClass: s.seatClass as SeatClass,
        price: s.price,
        availableSeats: s.availableSeats,
        totalSeats: s.totalSeats,
      })),
    });
  }

  return prisma.flight.update({
    where: { id },
    data: updateData,
    include: flightInclude,
  });
}

export async function softDelete(id: string) {
  const existing = await prisma.flight.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Flight not found', 404, 'NOT_FOUND');
  }
  return prisma.flight.update({ where: { id }, data: { isActive: false } });
}

export async function deactivate(id: string, userId: string, userRole: string) {
  const existing = await prisma.flight.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Flight not found', 404, 'NOT_FOUND');
  }
  if (userRole !== 'admin' && existing.createdById !== userId) {
    throw new AppError('Not authorized to deactivate this flight', 403, 'FORBIDDEN');
  }
  return prisma.flight.update({
    where: { id },
    data: { isActive: false },
    include: flightInclude,
  });
}

export async function approve(id: string) {
  const existing = await prisma.flight.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Flight not found', 404, 'NOT_FOUND');
  }
  return prisma.flight.update({
    where: { id },
    data: { isActive: true },
    include: flightInclude,
  });
}

export async function updateSeats(flightId: string, seatClass: string, availableSeats: number) {
  const seat = await prisma.flightSeat.findUnique({
    where: { flightId_seatClass: { flightId, seatClass: seatClass as SeatClass } },
  });
  if (!seat) {
    throw new AppError('Seat class not found for this flight', 404, 'NOT_FOUND');
  }
  if (availableSeats < 0) {
    throw new AppError('Available seats cannot be negative', 400, 'INVALID_SEATS');
  }
  return prisma.flightSeat.update({
    where: { id: seat.id },
    data: { availableSeats },
  });
}
