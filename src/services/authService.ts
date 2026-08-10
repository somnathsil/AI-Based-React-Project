import apiClient from './api';
import { ApiResponse, LoginCredentials, User, AuthTokens } from '@/types';

export const authService = {
  /**
   * User login endpoint call
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    return apiClient.post('/auth/login', credentials);
  },

  /**
   * Logout user session
   */
  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post('/auth/logout');
  },

  /**
   * Fetch currently authenticated user profile
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get('/auth/me');
  },

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
    return apiClient.post('/auth/refresh', { refreshToken });
  },
};
