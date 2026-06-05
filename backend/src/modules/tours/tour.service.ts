import prisma from '../../config/database';
import { getPagination, getPaginationMeta } from '../../utils/pagination';
import { AppError } from '../../utils/AppError';
import { Prisma } from '@prisma/client';

interface ListFilters {
  destinationId?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  search?: string;
  sort?: string;
}

export async function list(filters: ListFilters, query: { page?: string; limit?: string }) {
  const { skip, take, page, limit } = getPagination(query);

  const where: Prisma.TourWhereInput = { isActive: true };

  if (filters.destinationId) {
    where.destinationId = filters.destinationId;
  }

  if (filters.search) {
    where.name = { contains: filters.search, mode: 'insensitive' };
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.pricePerPerson = {};
    if (filters.minPrice !== undefined) where.pricePerPerson.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) where.pricePerPerson.lte = filters.maxPrice;
  }

  if (filters.minDuration !== undefined || filters.maxDuration !== undefined) {
    where.durationDays = {};
    if (filters.minDuration !== undefined) where.durationDays.gte = filters.minDuration;
    if (filters.maxDuration !== undefined) where.durationDays.lte = filters.maxDuration;
  }

  const sortField = filters.sort || 'name';
  const orderBy: Prisma.TourOrderByWithRelationInput =
    sortField === 'price' ? { pricePerPerson: 'asc' } :
    sortField === 'duration' ? { durationDays: 'asc' } :
    { name: 'asc' };

  const [data, total] = await Promise.all([
    prisma.tour.findMany({
      where,
      include: { destination: true },
      orderBy,
      skip,
      take,
    }),
    prisma.tour.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(total, page, limit) };
}

export async function getById(id: string) {
  const tour = await prisma.tour.findUnique({
    where: { id },
    include: { destination: true },
  });

  if (!tour) {
    throw new AppError('Tour not found', 404, 'NOT_FOUND');
  }

  return tour;
}

export async function create(data: Record<string, unknown>) {
  return prisma.tour.create({
    data: data as any,
    include: { destination: true },
  });
}

export async function update(id: string, data: Record<string, unknown>) {
  const existing = await prisma.tour.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Tour not found', 404, 'NOT_FOUND');
  }

  return prisma.tour.update({
    where: { id },
    data: data as any,
    include: { destination: true },
  });
}

export async function softDelete(id: string) {
  const existing = await prisma.tour.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Tour not found', 404, 'NOT_FOUND');
  }

  return prisma.tour.update({ where: { id }, data: { isActive: false } });
}
