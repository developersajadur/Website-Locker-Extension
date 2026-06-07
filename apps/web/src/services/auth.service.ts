import api from '@/lib/api';
import type { User, ApiResponse } from '@/types';

export const authApi = {
  register: (email: string, password: string) =>
    api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>(
      '/auth/register',
      { email, password },
    ),

  login: (email: string, password: string) =>
    api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>(
      '/auth/login',
      { email, password },
    ),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    api.post<ApiResponse>('/auth/logout', { refreshToken }),

  getProfile: () => api.get<ApiResponse<{ user: User }>>('/auth/profile'),

  updateProfile: (data: { email?: string; currentPassword?: string; newPassword?: string }) =>
    api.put<ApiResponse<{ user: User }>>('/auth/profile', data),

  deleteAccount: () => api.delete<ApiResponse>('/auth/account'),
};
