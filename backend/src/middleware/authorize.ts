import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required.', 401, 'AUTH_REQUIRED'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        new AppError(
          `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`,
          403,
          'FORBIDDEN',
        ),
      );
      return;
    }

    next();
  };
}
