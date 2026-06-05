import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';
import { getPagination, getPaginationMeta } from '../../utils/pagination';

interface ListUserFilters {
  role?: string;
  isActive?: boolean;
  search?: string;
}

function excludePassword(user: { passwordHash: string; [key: string]: unknown }) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  return excludePassword(user);
}

export async function updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string; preferences?: Record<string, unknown> }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const updateData: Prisma.UserUpdateInput = {
    ...(data.firstName !== undefined && { firstName: data.firstName }),
    ...(data.lastName !== undefined && { lastName: data.lastName }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.preferences !== undefined && { preferences: data.preferences as Prisma.InputJsonValue }),
  };

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return excludePassword(updatedUser);
}

export async function getUserBookings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      bookings: {
        include: {
          details: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return user.bookings;
}

export async function listUsers(filters: ListUserFilters, query: { page?: string; limit?: string }) {
  const { skip, take, page, limit } = getPagination(query);

  const where: Record<string, unknown> = {};

  if (filters.role) {
    where.role = filters.role;
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  const usersWithoutPassword = users.map((u) => excludePassword(u));

  return { users: usersWithoutPassword, pagination: getPaginationMeta(total, page, limit) };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  return excludePassword(user);
}

export async function updateUser(userId: string, data: { firstName?: string; lastName?: string; phone?: string; preferences?: Record<string, unknown> }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const updateData: Prisma.UserUpdateInput = {
    ...(data.firstName !== undefined && { firstName: data.firstName }),
    ...(data.lastName !== undefined && { lastName: data.lastName }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.preferences !== undefined && { preferences: data.preferences as Prisma.InputJsonValue }),
  };

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return excludePassword(updatedUser);
}
