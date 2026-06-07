import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { userRepository } from '../repositories/user.repository';
import { AppError, type JwtPayload } from '../types';
import type { RegisterInput, LoginInput } from '../validators/auth.validator';

/** Generate a short-lived access token */
function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/** Generate a long-lived refresh token */
function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/** Calculate expiry Date from a duration string like "7d" */
function getExpiryDate(duration: string): Date {
  const now = Date.now();
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) throw new AppError('Invalid token duration format', 500);

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return new Date(now + value * multipliers[unit]);
}

export const authService = {
  async register(input: RegisterInput) {
    // Prevent duplicate registrations
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);
    const user = await userRepository.create({ email: input.email, passwordHash });

    const payload: JwtPayload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await userRepository.saveRefreshToken(
      user.id,
      refreshToken,
      getExpiryDate(env.JWT_REFRESH_EXPIRES_IN),
    );

    return { user, accessToken, refreshToken };
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      // Use generic message to prevent user enumeration
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const payload: JwtPayload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await userRepository.saveRefreshToken(
      user.id,
      refreshToken,
      getExpiryDate(env.JWT_REFRESH_EXPIRES_IN),
    );

    return {
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
      accessToken,
      refreshToken,
    };
  },

  async refresh(token: string) {
    const stored = await userRepository.findRefreshToken(token);
    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Rotate refresh token — delete old, issue new one
    await userRepository.deleteRefreshToken(token);

    const payload: JwtPayload = { userId: stored.userId, email: stored.user.email };
    const accessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    await userRepository.saveRefreshToken(
      stored.userId,
      newRefreshToken,
      getExpiryDate(env.JWT_REFRESH_EXPIRES_IN),
    );

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken: string) {
    // Best-effort deletion — ignore if token doesn't exist
    try {
      await userRepository.deleteRefreshToken(refreshToken);
    } catch {
      // Token already deleted or not found — that's fine
    }
  },

  /**
   * Verify a user's password without issuing new tokens.
   * Used by the browser extension unlock flow.
   */
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    return bcrypt.compare(password, user.passwordHash);
  },

  async updateProfile(
    userId: string,
    data: { email?: string; currentPassword?: string; newPassword?: string },
  ) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    if (data.currentPassword && data.newPassword) {
      const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
      if (!valid) throw new AppError('Current password is incorrect', 400);
      const passwordHash = await bcrypt.hash(data.newPassword, env.BCRYPT_SALT_ROUNDS);
      return userRepository.update(userId, { email: data.email, passwordHash });
    }

    return userRepository.update(userId, { email: data.email });
  },

  async deleteAccount(userId: string) {
    await userRepository.deleteAllRefreshTokens(userId);
    await userRepository.delete(userId);
  },
};
