import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { LoginResponse, RefreshTokenRequest } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Token management
let accessToken: string | null = null;
let refreshTokenValue: string | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Initialize from localStorage so token survives navigation/refresh
const storedAccess = localStorage.getItem('accessToken');
const storedRefresh = localStorage.getItem('refreshToken');
if (storedAccess) accessToken = storedAccess;
if (storedRefresh) refreshTokenValue = storedRefresh;

export const setTokens = (tokens: { accessToken: string; refreshToken: string }) => {
  accessToken = tokens.accessToken;
  refreshTokenValue = tokens.refreshToken;
};

export const clearTokens = () => {
  accessToken = null;
  refreshTokenValue = null;
};

export const getTokens = () => ({
  accessToken,
  refreshToken: refreshTokenValue,
});

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Request interceptor - add auth header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Avoid infinite loops
    if (originalRequest._retry) {
      clearTokens();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(error);
    }

    if (!refreshTokenValue) {
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        addRefreshSubscriber((token: string) => {
          originalRequest.headers!.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const response = await axios.post<LoginResponse>(
        `${API_BASE_URL}/api/auth/refresh-token`,
        { refreshToken: refreshTokenValue } as RefreshTokenRequest
      );

      const newAccessToken = response.data.accessToken;
      const newRefreshToken = response.data.refreshToken;

      accessToken = newAccessToken;
      refreshTokenValue = newRefreshToken;

      // Persist to localStorage
      localStorage.setItem('refreshToken', newRefreshToken);
      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('expiresAt', response.data.expiresAt);
      localStorage.setItem('userRole', response.data.role);
      localStorage.setItem('userName', response.data.fullName);
      localStorage.setItem('userEmail', response.data.email);

      onTokenRefreshed(newAccessToken);
      originalRequest.headers!.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      clearTokens();
      localStorage.clear();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
