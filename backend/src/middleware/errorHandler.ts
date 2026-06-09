import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import multer from 'multer';
import { AppError } from '../utils/AppError';
import logger from '../config/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error('Error caught by global handler', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));

    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    let message = 'Database error occurred';
    let statusCode = 400;
    let code = 'DATABASE_ERROR';

    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ');
      message = `Unique constraint violation on ${target || 'field'}`;
      code = 'UNIQUE_VIOLATION';
    } else if (err.code === 'P2025') {
      message = 'Record not found';
      statusCode = 404;
      code = 'NOT_FOUND';
    } else if (err.code === 'P2003') {
      message = 'Foreign key constraint failed';
      code = 'FOREIGN_KEY_VIOLATION';
    }

    res.status(statusCode).json({
      success: false,
      error: { message, code },
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'File too large',
      LIMIT_FILE_COUNT: 'Too many files',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field',
    };
    res.status(400).json({
      success: false,
      error: {
        message: messages[err.code] || err.message,
        code: 'UPLOAD_ERROR',
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid data provided',
        code: 'VALIDATION_ERROR',
      },
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
}
