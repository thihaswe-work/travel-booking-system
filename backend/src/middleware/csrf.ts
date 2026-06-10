import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AppError } from '../utils/AppError';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function setCsrfCookie(res: Response, token: string): void {
  res.cookie('csrf_token', token, {
    httpOnly: false,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 86400 * 1000,
  });
}

export function clearCsrfCookie(res: Response): void {
  res.clearCookie('csrf_token', {
    httpOnly: false,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.includes(req.method)) {
    next();
    return;
  }

  const headerToken = req.headers['x-csrf-token'] as string | undefined;
  const cookieToken = req.cookies?.csrf_token as string | undefined;

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    next(new AppError('CSRF token validation failed', 403, 'CSRF_FAILED'));
    return;
  }

  next();
}
