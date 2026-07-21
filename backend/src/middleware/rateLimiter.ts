import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

function cleanupStore(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

function getRateLimiter(windowMs: number, maxRequests: number) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    cleanupStore();

    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      next(
        new AppError(
          `Too many requests. Please try again after ${retryAfter} seconds.`,
          429,
          'RATE_LIMIT_EXCEEDED',
        ),
      );
      return;
    }

    entry.count++;
    next();
  };
}

export const generalLimiter = getRateLimiter(60 * 1000, 100);
export const authLimiter = getRateLimiter(15 * 60 * 1000, 20);
export const searchLimiter = getRateLimiter(60 * 1000, 30);
