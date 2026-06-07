import prisma from "../config/prisma";


export const siteRepository = {
  /**
   * Get all locked sites for a user
   */
  async findByUserId(userId: string) {
    return prisma.site.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Create a new locked site entry
   */
  async create(data: { userId: string; url: string; label?: string }) {
    return prisma.site.create({ data });
  },

  /**
   * Find a specific site by ID, verifying user ownership
   */
  async findByIdAndUserId(id: string, userId: string) {
    return prisma.site.findFirst({ where: { id, userId } });
  },

  /**
   * Delete a site, checking ownership to prevent unauthorized deletion
   */
  async deleteByIdAndUserId(id: string, userId: string) {
    return prisma.site.deleteMany({ where: { id, userId } });
  },

  /**
   * Check if a URL is already locked by this user
   */
  async findByUrlAndUserId(url: string, userId: string) {
    return prisma.site.findUnique({ where: { userId_url: { userId, url } } });
  },
};
