import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import validateRequest from '../shared/middleware/validateRequest';
import { authenticate } from '../shared/middleware/auth.middleware';
import { authRateLimit } from '../shared/middleware/rateLimit.middleware';
import { AuthValidation } from '../validators/auth.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and authorization operations
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Must contain at least one uppercase letter and one number
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Validation error or Email already in use
 */
router.post(
  '/register',
  authRateLimit,
  validateRequest(AuthValidation.RegisterSchema),
  authController.register,
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login to an account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  authRateLimit,
  validateRequest(AuthValidation.LoginSchema),
  authController.login,
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Invalid refresh token
 */
router.post(
  '/refresh',
  authRateLimit,
  validateRequest(AuthValidation.RefreshTokenSchema),
  authController.refresh,
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout and invalidate refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post(
  '/logout',
  validateRequest(AuthValidation.RefreshTokenSchema),
  authController.logout,
);

/**
 * @swagger
 * /auth/verify-password:
 *   post:
 *     summary: Verify user password for browser extension 
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password verified
 *       401:
 *         description: Incorrect password
 */
router.post(
  '/verify-password',
  authenticate,
  validateRequest(AuthValidation.VerifyPasswordSchema),
  authController.verifyPassword,
);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

/**
 * @swagger
 * /auth/account:
 *   delete:
 *     summary: Delete user account
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 */
router.delete('/account', authenticate, authController.deleteAccount);

export const AuthRoutes = router;
