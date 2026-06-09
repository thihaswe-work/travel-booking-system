import { Prisma, UserRole } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';
import { getPagination, getPaginationMeta } from '../../utils/pagination';
import { hashPassword } from '../../utils/password';

interface ListUserFilters {
  role?: string;
  isActive?: boolean;
  search?: string;
}

function excludeSensitive(user: { passwordHash: string; refreshToken?: string | null; [key: string]: unknown }) {
  const { passwordHash, refreshToken, ...rest } = user;
  return rest;
}

export async function createByAdmin(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      ...(data.phone && { phone: data.phone }),
      role: data.role as UserRole,
    },
  });

  const { passwordHash, refreshToken, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  return excludeSensitive(user);
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

  return excludeSensitive(updatedUser);
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

  const usersWithoutPassword = users.map((u) => excludeSensitive(u));

  return { users: usersWithoutPassword, pagination: getPaginationMeta(total, page, limit) };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  return excludeSensitive(user);
}

export async function updateUser(userId: string, data: { firstName?: string; lastName?: string; phone?: string; preferences?: Record<string, unknown>; role?: string; isActive?: boolean }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const updateData: Prisma.UserUpdateInput = {
    ...(data.firstName !== undefined && { firstName: data.firstName }),
    ...(data.lastName !== undefined && { lastName: data.lastName }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.preferences !== undefined && { preferences: data.preferences as Prisma.InputJsonValue }),
    ...(data.role !== undefined && { role: data.role as UserRole }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
  };

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return excludeSensitive(updatedUser);
}
