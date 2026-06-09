import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { hashApiKey } from '../utils/apiKey';

export async function apiKeyAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    let rawKey: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      rawKey = authHeader.substring(7);
    }

    if (!rawKey) {
      rawKey = req.headers['x-api-key'] as string | undefined;
    }

    if (!rawKey) {
      throw new AppError('API key required. Provide via X-API-Key header or Bearer token.', 401, 'API_KEY_REQUIRED');
    }

    const keyHash = hashApiKey(rawKey);
    const apiKey = await prisma.apiKey.findUnique({ where: { keyHash }, include: { user: true } });

    if (!apiKey) {
      throw new AppError('Invalid API key.', 401, 'INVALID_API_KEY');
    }

    if (!apiKey.isActive) {
      throw new AppError('API key has been revoked.', 401, 'API_KEY_REVOKED');
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new AppError('API key has expired.', 401, 'API_KEY_EXPIRED');
    }

    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    req.user = {
      id: apiKey.user.id,
      email: apiKey.user.email,
      role: apiKey.user.role,
      trustLevel: apiKey.user.trustLevel,
      approvedItemsCount: apiKey.user.approvedItemsCount,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid API key.', 401, 'INVALID_API_KEY'));
    }
  }
}
