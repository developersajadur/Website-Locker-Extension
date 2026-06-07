import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError, AuthRequest, JwtPayload } from '../../types';
import { env } from '../../config/env';


/**
 * JWT auth middleware — verifies Bearer token and attaches user to request.
 * Throws 401 for missing/invalid tokens so controllers stay clean.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError('Authentication required', 401, 'NO_TOKEN'));
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    (req as AuthRequest).user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new AppError('Access token expired', 401, 'TOKEN_EXPIRED'));
    } else {
      next(new AppError('Invalid access token', 401, 'INVALID_TOKEN'));
    }
  }
}
