// Shared TypeScript types across the server
import type { Request } from 'express';

/** JWT payload structure */
export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/** Express request augmented with authenticated user */
export interface AuthRequest extends Request {
  user: JwtPayload;
}

/** Standard API response envelope */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

/** Application-level error with HTTP status code */
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
