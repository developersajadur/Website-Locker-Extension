import prisma from '../config/prisma';
import type { RegisterInput } from '../validators/auth.validator';

export const userRepository = {
  /**
   * Find user by email — used for login and checking duplicates
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  /**
   * Find user by ID — used for token validation
   */
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  /**
   * Create a new user with a pre-hashed password
   */
  async create(data: { email: string; passwordHash: string }) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });
  },

  /**
   * Update user fields (email or passwordHash)
   */
  async update(id: string, data: Partial<{ email: string; passwordHash: string }>) {
    return prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, createdAt: true, updatedAt: true },
    });
  },

  /**
   * Delete user and cascade delete all sites/tokens via Prisma relations
   */
  async delete(id: string) {
    return prisma.user.delete({ where: { id } });
  },

  // ── Refresh Token management ─────────────────────────────────────────────

  async saveRefreshToken(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  },

  async findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  },

  async deleteRefreshToken(token: string) {
    return prisma.refreshToken.delete({ where: { token } });
  },

  /**
   * Invalidate all refresh tokens for a user on logout
   */
  async deleteAllRefreshTokens(userId: string) {
    return prisma.refreshToken.deleteMany({ where: { userId } });
  },
};
