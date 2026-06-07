import { Router } from 'express';
import { siteController } from '../controllers/site.controller';
import validateRequest from '../shared/middleware/validateRequest';
import { authenticate } from '../shared/middleware/auth.middleware';
import { SiteValidation } from '../validators/site.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Sites
 *   description: Locked website management
 */

// All site routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /sites:
 *   get:
 *     summary: Retrieve all user locked sites
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sites retrieved successfully
 *   post:
 *     summary: Lock a new website
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 example: facebook.com
 *               label:
 *                 type: string
 *     responses:
 *       201:
 *         description: Site locked successfully
 *       409:
 *         description: Site is already locked
 */
router.get('/', siteController.getSites);
router.post(
  '/',
  validateRequest(SiteValidation.CreateSiteSchema),
  siteController.addSite,
);

/**
 * @swagger
 * /sites/{id}:
 *   delete:
 *     summary: Remove a site from locked list
 *     tags: [Sites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The site ID
 *     responses:
 *       200:
 *         description: Site removed from locked list
 *       404:
 *         description: Site not found
 */
router.delete('/:id', siteController.deleteSite);

export const SiteRoutes = router;
