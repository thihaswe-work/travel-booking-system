import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';
import { generateApiKey } from '../../utils/apiKey';

export const apiKeyService = {
  async create(data: { name: string; expiresAt?: string }, userId: string) {
    const { plainKey, keyHash, keyPrefix } = generateApiKey();
    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        name: data.name,
        keyHash,
        keyPrefix,
        ...(data.expiresAt ? { expiresAt: new Date(data.expiresAt) } : {}),
      },
    });
    return { ...apiKey, plainKey };
  },

  async list(userId: string) {
    return prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  },

  async update(id: string, userId: string, data: { name?: string; isActive?: boolean }) {
    const existing = await prisma.apiKey.findUnique({ where: { id } });
    if (!existing) throw new AppError('API key not found', 404, 'NOT_FOUND');
    if (existing.userId !== userId) throw new AppError('Access denied', 403, 'FORBIDDEN');

    return prisma.apiKey.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  },

  async revoke(id: string, userId: string) {
    const existing = await prisma.apiKey.findUnique({ where: { id } });
    if (!existing) throw new AppError('API key not found', 404, 'NOT_FOUND');
    if (existing.userId !== userId) throw new AppError('Access denied', 403, 'FORBIDDEN');

    return prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });
  },
};
