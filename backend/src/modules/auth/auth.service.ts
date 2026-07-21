import { UserRole } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { createAuditLog } from '../../utils/auditLogger';
import { excludeSensitive } from '../../utils/user';

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export async function register(data: RegisterInput) {
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
      ...(data.role && { role: data.role as UserRole }),
    },
  });

  const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role, trustLevel: user.trustLevel, approvedItemsCount: user.approvedItemsCount });
  const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role, trustLevel: user.trustLevel, approvedItemsCount: user.approvedItemsCount });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  createAuditLog({
    userId: user.id,
    action: 'create',
    entity: 'user',
    entityId: user.id,
    newValue: { email: data.email, role: data.role || 'customer' },
  });

  return { user: excludeSensitive(user), accessToken, refreshToken };
}

export async function login(data: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new AppError('Account has been deactivated. Contact support.', 401, 'ACCOUNT_INACTIVE');
  }

  const isPasswordValid = await comparePassword(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role, trustLevel: user.trustLevel, approvedItemsCount: user.approvedItemsCount });
  const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role, trustLevel: user.trustLevel, approvedItemsCount: user.approvedItemsCount });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  createAuditLog({
    userId: user.id,
    action: 'login',
    entity: 'user',
    entityId: user.id,
  });

  return { user: excludeSensitive(user), accessToken, refreshToken };
}

export async function logout(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });

  createAuditLog({
    userId,
    action: 'logout',
    entity: 'user',
    entityId: userId,
  });
}

export async function refreshTokens(token: string) {
  let decoded: { id: string; email: string; role: string; trustLevel?: string; approvedItemsCount?: number };
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  if (!user.isActive) {
    throw new AppError('Account has been deactivated', 401, 'ACCOUNT_INACTIVE');
  }

  if (user.refreshToken !== token) {
    throw new AppError('Refresh token has been revoked', 401, 'TOKEN_REVOKED');
  }

  const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role, trustLevel: user.trustLevel, approvedItemsCount: user.approvedItemsCount });
  const refreshToken = generateRefreshToken({ id: user.id, email: user.email, role: user.role, trustLevel: user.trustLevel, approvedItemsCount: user.approvedItemsCount });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return { accessToken, refreshToken };
}
