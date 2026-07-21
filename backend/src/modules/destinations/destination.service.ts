import prisma from '../../config/database';
import { getPagination, getPaginationMeta } from '../../utils/pagination';
import { AppError } from '../../utils/AppError';
import { Prisma } from '@prisma/client';

interface ListFilters {
  country?: string;
  isActive?: boolean;
  search?: string;
}

export async function list(
  filters: ListFilters,
  query: { page?: string; limit?: string; sort_by?: string; sort_order?: string },
) {
  const { skip, take, page, limit } = getPagination(query);

  const where: Prisma.DestinationWhereInput = {};

  if (filters.country) {
    where.country = { contains: filters.country, mode: 'insensitive' };
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { country: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const sortField = query.sort_by || 'createdAt';
  const sortDir = query.sort_order === 'asc' ? 'asc' : 'desc';

  function buildOrderBy(): Prisma.DestinationOrderByWithRelationInput {
    switch (sortField) {
      case 'name':
        return { name: sortDir };
      case 'country':
        return { country: sortDir };
      default:
        return { createdAt: sortDir };
    }
  }

  const [data, total] = await Promise.all([
    prisma.destination.findMany({ where, orderBy: buildOrderBy(), skip, take }),
    prisma.destination.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(total, page, limit) };
}

export async function getById(id: string) {
  const destination = await prisma.destination.findUnique({
    where: { id },
    include: {
      _count: {
        select: { flights: true, hotels: true, tours: true },
      },
    },
  });

  if (!destination) {
    throw new AppError('Destination not found', 404, 'NOT_FOUND');
  }

  return destination;
}

export async function create(data: { name: string; country: string; description?: string; imageUrl?: string }) {
  return prisma.destination.create({ data });
}

export async function update(
  id: string,
  data: { name?: string; country?: string; description?: string; imageUrl?: string },
) {
  const existing = await prisma.destination.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Destination not found', 404, 'NOT_FOUND');
  }

  return prisma.destination.update({ where: { id }, data });
}

export async function softDelete(id: string) {
  const existing = await prisma.destination.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Destination not found', 404, 'NOT_FOUND');
  }

  return prisma.destination.update({ where: { id }, data: { isActive: false } });
}
