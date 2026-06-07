import type { Request, Response } from 'express';
import { siteService } from '../services/site.service';
import type { CreateSiteInput } from '../validators/site.validator';
import type { AuthRequest } from '../types';
import catchAsync from '../shared/helpers/catchAsync';
import sendResponse from '../shared/helpers/sendResponse';

export const siteController = {
  getSites: catchAsync(async (req: Request, res: Response) => {
    const { userId } = (req as AuthRequest).user;
    const sites = await siteService.getSites(userId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Sites retrieved successfully',
      data: { sites },
    });
  }),

  addSite: catchAsync(async (req: Request, res: Response) => {
    const { userId } = (req as AuthRequest).user;
    const input = req.body as CreateSiteInput;
    const site = await siteService.addSite(userId, input);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Site locked successfully',
      data: { site },
    });
  }),

  deleteSite: catchAsync(async (req: Request, res: Response) => {
    const { userId } = (req as AuthRequest).user;
    const { id } = req.params;

    await siteService.deleteSite(userId, id as string);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Site removed from locked list',
      data: null
    });
  }),
};
