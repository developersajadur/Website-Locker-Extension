import type { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  VerifyPasswordInput,
} from '../validators/auth.validator';
import { AppError, type AuthRequest } from '../types';
import catchAsync from '../shared/helpers/catchAsync';
import sendResponse from '../shared/helpers/sendResponse';

export const authController = {
  register: catchAsync(async (req: Request, res: Response) => {
    const input = req.body as RegisterInput;
    const result = await authService.register(input);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Account created successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  }),

  login: catchAsync(async (req: Request, res: Response) => {
    const input = req.body as LoginInput;
    const result = await authService.login(input);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  }),

  refresh: catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as RefreshTokenInput;
    const result = await authService.refresh(refreshToken);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Token refreshed',
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  }),

  logout: catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as RefreshTokenInput;
    await authService.logout(refreshToken);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Logged out successfully',
      data: null
    });
  }),

  verifyPassword: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { password } = req.body as VerifyPasswordInput;
    const isValid = await authService.verifyPassword(authReq.user.userId, password);

    if (!isValid) {
      throw new AppError('Incorrect password', 401, 'INVALID_PASSWORD');
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Password verified',
      data: null
    });
  }),

  getProfile: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'User profile retrieved successfully',
      data: { user: authReq.user },
    });
  }),

  updateProfile: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { email, currentPassword, newPassword } = req.body as Record<string, string>;
    const user = await authService.updateProfile(authReq.user.userId, {
      email,
      currentPassword,
      newPassword,
    });
    
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Profile updated',
      data: { user },
    });
  }),

  deleteAccount: catchAsync(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    await authService.deleteAccount(authReq.user.userId);
    
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Account deleted successfully',
      data: null
    });
  }),
};
