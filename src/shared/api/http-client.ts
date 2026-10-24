import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { LoginResponse, RefreshTokenRequest } from './session';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

// A hung backend should end in an error the page can show, not an endless spinner
const REQUEST_TIMEOUT_MS = 20_000;

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: REQUEST_TIMEOUT_MS,
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

// Keep this tab's in-memory tokens in step with sign-ins, refreshes and sign-outs in other tabs
window.addEventListener('storage', (e) => {
  if (e.storageArea !== localStorage) return;
  if (e.key === null || (e.key === 'refreshToken' && e.newValue === null)) {
    // Signed out elsewhere. Only end the session if this tab still thinks it has one.
    if (refreshTokenValue) endSession();
    return;
  }
  if (e.key === 'accessToken' || e.key === 'refreshToken') {
    const access = localStorage.getItem('accessToken');
    const refresh = localStorage.getItem('refreshToken');
    if (access && refresh) setTokens({ accessToken: access, refreshToken: refresh });
  }
});

const REFRESH_LOCK = 'clinicflow:refresh-token';
// Margin before expiry under which a stored access token is treated as already expired
const EXPIRY_MARGIN_MS = 10_000;

/**
 * Runs `fn` while holding a lock shared by every tab of the app. Refresh tokens are single-use and
 * reusing a rotated one can revoke all of the user's sessions (API contract §2.3), so two tabs must
 * never refresh at the same time. Browsers without the Web Locks API run `fn` directly.
 */
const withRefreshLock = async <T>(fn: () => Promise<T>): Promise<T> =>
  typeof navigator !== 'undefined' && navigator.locks
    ? await navigator.locks.request(REFRESH_LOCK, fn)
    : fn();

/** The user signed out in another tab while this one was waiting to refresh. */
class SessionEndedElsewhereError extends Error {}

/**
 * Returns a valid access token. `rejectedToken` is the access token the failed request sent: if
 * another tab has stored a newer one that hasn't expired, it is reused instead of refreshing again.
 * localStorage always holds the newest refresh token, so an already-rotated one is never resent.
 */
const refreshSession = (rejectedToken: string | null) =>
  withRefreshLock(async () => {
    const storedRefresh = localStorage.getItem('refreshToken');
    const storedAccess = localStorage.getItem('accessToken');
    if (!storedRefresh || !storedAccess) throw new SessionEndedElsewhereError();

    setTokens({ accessToken: storedAccess, refreshToken: storedRefresh });
    const expiresAt = Date.parse(localStorage.getItem('expiresAt') ?? '');
    if (storedAccess !== rejectedToken && expiresAt - EXPIRY_MARGIN_MS > Date.now()) {
      return storedAccess;
    }

    const response = await axios.post<LoginResponse>(
      `${API_BASE_URL}/api/auth/refresh-token`,
      { refreshToken: storedRefresh } as RefreshTokenRequest,
      { timeout: REQUEST_TIMEOUT_MS }
    );
    saveSession(response.data);
    return response.data.accessToken;
  });

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
      const sentHeader = originalRequest.headers?.Authorization;
      const rejectedToken = typeof sentHeader === 'string' ? sentHeader.replace(/^Bearer /, '') : null;
      const token = await refreshSession(rejectedToken);
      onTokenRefreshed(token);
      originalRequest.headers!.Authorization = `Bearer ${token}`;

      return api(originalRequest);
    } catch (refreshError) {
      onRefreshFailed(refreshError);
      // Only a rejected refresh token (or a sign-out in another tab) ends the session (API contract
      // §2.3). Network errors and 5xx keep the tokens so a later request can retry.
      const status = axios.isAxiosError(refreshError) ? refreshError.response?.status : undefined;
      if (
        refreshError instanceof SessionEndedElsewhereError ||
        (status !== undefined && status >= 400 && status < 500)
      ) {
        endSession();
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
