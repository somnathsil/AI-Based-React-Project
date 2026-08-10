import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiErrorResponse } from '@/types/api';

/**
 * Enterprise Axios Configuration
 * Includes request token authorization, response error formatting, and refresh flow foundation.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.aisaas.example.com/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Request Interceptor
 * Injects Authorization JWT bearer token into outgoing API calls if present.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Formats errors and handles authentication expiration (401).
 */
apiClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<ApiErrorResponse>) => {
    const formattedError: ApiErrorResponse = {
      success: false,
      message: error.response?.data?.message || error.message || 'An unexpected network error occurred.',
      errorCode: error.response?.data?.errorCode || error.code || 'UNKNOWN_ERROR',
      errors: error.response?.data?.errors,
      timestamp: new Date().toISOString(),
    };

    if (error.response?.status === 401) {
      // Clear token and trigger redirect to login if required
      localStorage.removeItem('access_token');
      // Window redirect can be dispatched via custom event or store action
    }

    return Promise.reject(formattedError);
  }
);

export default apiClient;
