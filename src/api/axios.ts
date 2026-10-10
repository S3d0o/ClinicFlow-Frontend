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

interface RefreshSubscriber {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}
let refreshSubscribers: RefreshSubscriber[] = [];

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

// Session data persisted in localStorage
const SESSION_KEYS = ['accessToken', 'refreshToken', 'expiresAt', 'userRole', 'userName', 'userEmail'] as const;

/** Store a login/refresh response in memory and localStorage. */
export const saveSession = (data: LoginResponse) => {
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('expiresAt', data.expiresAt);
  localStorage.setItem('userRole', data.role);
  localStorage.setItem('userName', data.fullName);
  localStorage.setItem('userEmail', data.email);
};

/** Forget the session in memory and remove only this app's keys from localStorage. */
export const clearSession = () => {
  clearTokens();
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
};

const endSession = () => {
  clearSession();
  window.dispatchEvent(new CustomEvent('auth:logout'));
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(({ resolve }) => resolve(token));
  refreshSubscribers = [];
};

const onRefreshFailed = (error: unknown) => {
  refreshSubscribers.forEach(({ reject }) => reject(error));
  refreshSubscribers = [];
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

    // Avoid infinite loops: the request already failed once with a fresh token
    if (originalRequest._retry) {
      endSession();
      return Promise.reject(error);
    }

    if (!refreshTokenValue) {
      endSession();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshSubscribers.push({
          resolve: (token: string) => {
            originalRequest.headers!.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const response = await axios.post<LoginResponse>(
        `${API_BASE_URL}/api/auth/refresh-token`,
        { refreshToken: refreshTokenValue } as RefreshTokenRequest
      );

      saveSession(response.data);
      onTokenRefreshed(response.data.accessToken);
      originalRequest.headers!.Authorization = `Bearer ${response.data.accessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      onRefreshFailed(refreshError);
      // Only a rejected refresh token ends the session (API contract §2.3).
      // Network errors and 5xx keep the tokens so a later request can retry.
      const status = axios.isAxiosError(refreshError) ? refreshError.response?.status : undefined;
      if (status !== undefined && status >= 400 && status < 500) {
        endSession();
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
