import { siteRepository } from '../repositories/site.repository';
import { AppError } from '../types';
import type { CreateSiteInput } from '../validators/site.validator';

export const siteService = {
  async getSites(userId: string) {
    return siteRepository.findByUserId(userId);
  },

  async addSite(userId: string, input: CreateSiteInput) {
    // Check for duplicates before inserting
    const existing = await siteRepository.findByUrlAndUserId(input.url, userId);
    if (existing) {
      throw new AppError(`"${input.url}" is already in your locked list`, 409, 'SITE_EXISTS');
    }

    return siteRepository.create({ userId, url: input.url, label: input.label });
  },

  async deleteSite(userId: string, siteId: string) {
    const site = await siteRepository.findByIdAndUserId(siteId, userId);
    if (!site) {
      // Return 404 whether it doesn't exist or belongs to another user
      throw new AppError('Site not found', 404, 'SITE_NOT_FOUND');
    }

    await siteRepository.deleteByIdAndUserId(siteId, userId);
  },
};
