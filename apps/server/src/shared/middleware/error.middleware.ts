import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../types';
import { env } from '../../config/env';

/**
 * Global error handler — must be the last middleware registered in app.ts.
 * Converts all error types to a standard JSON response format.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  // Known application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
    return;
  }

  // Prisma unique constraint violation (P2002)
  if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
    res.status(409).json({
      success: false,
      message: 'Resource already exists',
      code: 'DUPLICATE_ENTRY',
    });
    return;
  }

  // Unknown errors — log in development, hide internals in production
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(env.NODE_ENV === 'development' && { detail: String(err) }),
  });
}

/**
 * 404 handler — catches unmatched routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
}
