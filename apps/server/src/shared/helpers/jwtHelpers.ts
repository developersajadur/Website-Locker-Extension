import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import AppError from './AppError';

const INTERNAL_SERVER_ERROR = 500;
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;

const createToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expiresIn: string | number | undefined,
): string => {
  if (!secret || typeof secret !== 'string') {
    throw new AppError(
      INTERNAL_SERVER_ERROR,
      'JWT Secret is missing or invalid',
    );
  }

  if (
    !expiresIn ||
    (typeof expiresIn !== 'string' && typeof expiresIn !== 'number')
  ) {
    throw new AppError(INTERNAL_SERVER_ERROR, 'JWT Expiry is invalid');
  }

  const signOptions: SignOptions = {
    expiresIn: expiresIn as SignOptions['expiresIn'],
    algorithm: 'HS256',
  };

  try {
    return jwt.sign(payload, secret, signOptions);
  } catch (error) {
    console.error('Error creating token:', error);
    throw new AppError(INTERNAL_SERVER_ERROR, 'Failed to create JWT');
  }
};

// Verify token
const verifyToken = (
  token: string,
  secret: Secret,
): Record<string, unknown> => {
  try {
    const decoded = jwt.verify(token, secret) as Record<string, unknown>;
    return decoded;
  } catch (error) {
    const err = error as Error;
    console.error('Token verification error:', err);
    if (err.name === 'JsonWebTokenError') {
      throw new AppError(UNAUTHORIZED, 'Invalid token signature');
    } else if (err.name === 'TokenExpiredError') {
      throw new AppError(UNAUTHORIZED, 'Token expired');
    }

    throw new AppError(UNAUTHORIZED, 'Unauthorized JWT');
  }
};

export const jwtHelpers = {
  createToken,
  verifyToken,
};
