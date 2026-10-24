import axios, { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { LoginResponse } from './session';
import api, { getTokens, saveSession } from './http-client';

// The interceptors run for real; only the network is replaced by `adapter`, which answers with
// `respond`. jsdom has no Web Locks API, so the refresh runs without the cross-tab lock.

type Reply = { status: number; data?: unknown } | 'network-error';
let respond: (config: InternalAxiosRequestConfig) => Reply;
let requests: InternalAxiosRequestConfig[];

const adapter: AxiosAdapter = async (config) => {
  requests.push(config);
  // Let concurrent requests interleave, as real responses would
  await new Promise((resolve) => setTimeout(resolve, 0));
  const reply = respond(config);
  if (reply === 'network-error') throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
  const response = { status: reply.status, data: reply.data ?? {}, statusText: '', headers: {}, config } as AxiosResponse;
  if (reply.status >= 400) throw new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, response);
  return response;
};

const isRefresh = (config: InternalAxiosRequestConfig) => config.url?.endsWith('/auth/refresh-token') ?? false;
const refreshCalls = () => requests.filter(isRefresh);
const bearer = (config: InternalAxiosRequestConfig) => String(config.headers?.Authorization ?? '');

const session = (accessToken: string, refreshToken: string): LoginResponse => ({
  accessToken,
  refreshToken,
  expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
  email: 'mona@example.com',
  fullName: 'Mona Ali',
  role: 'Patient',
});

/** The API: accepts only `new-access`, and refreshes `old-refresh` into a new session */
const backend = (config: InternalAxiosRequestConfig): Reply => {
  if (isRefresh(config)) return { status: 200, data: session('new-access', 'new-refresh') };
  return bearer(config) === 'Bearer new-access' ? { status: 200, data: 'ok' } : { status: 401 };
};

let logouts: number;
const onLogout = () => logouts++;

beforeEach(() => {
  api.defaults.adapter = adapter;
  axios.defaults.adapter = adapter; // the refresh call goes through plain axios
  requests = [];
  respond = backend;
  logouts = 0;
  window.addEventListener('auth:logout', onLogout);
  saveSession(session('old-access', 'old-refresh'));
});

afterEach(() => {
  window.removeEventListener('auth:logout', onLogout);
});

describe('token refresh', () => {
  it('refreshes once for concurrent 401s and retries every request with the new token', async () => {
    const results = await Promise.all([api.get('/a'), api.get('/b'), api.get('/c')]);

    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(refreshCalls()).toHaveLength(1);
    expect(JSON.parse(refreshCalls()[0].data)).toEqual({ refreshToken: 'old-refresh' });
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
    expect(getTokens()).toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    expect(logouts).toBe(0);
  });

  it("reuses a token another tab already refreshed instead of resending the rotated one", async () => {
    // Another tab refreshed: localStorage moved on, this tab's memory still holds the old tokens
    localStorage.setItem('accessToken', 'new-access');
    localStorage.setItem('refreshToken', 'new-refresh');

    const res = await api.get('/a');

    expect(res.status).toBe(200);
    expect(refreshCalls()).toHaveLength(0);
    expect(bearer(requests[requests.length - 1])).toBe('Bearer new-access');
  });

  it('ends the session when the API rejects the refresh token', async () => {
    respond = (config) => (isRefresh(config) ? { status: 401, data: { title: 'Auth.InvalidRefreshToken' } } : { status: 401 });

    await expect(Promise.all([api.get('/a'), api.get('/b')])).rejects.toBeInstanceOf(AxiosError);

    expect(refreshCalls()).toHaveLength(1);
    expect(getTokens()).toEqual({ accessToken: null, refreshToken: null });
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('userRole')).toBeNull();
    expect(logouts).toBeGreaterThan(0);
  });

  it('keeps the session when the refresh fails on the network or with a 5xx', async () => {
    for (const failure of ['network-error', { status: 503 }] as const) {
      respond = (config) => (isRefresh(config) ? failure : { status: 401 });
      await expect(api.get('/a')).rejects.toBeInstanceOf(AxiosError);
      expect(localStorage.getItem('refreshToken')).toBe('old-refresh');
    }
    expect(logouts).toBe(0);
  });

  it('ends the session instead of looping when the new token is rejected too', async () => {
    respond = (config) => (isRefresh(config) ? backend(config) : { status: 401 });

    await expect(api.get('/a')).rejects.toBeInstanceOf(AxiosError);

    expect(refreshCalls()).toHaveLength(1);
    expect(getTokens().refreshToken).toBeNull();
    expect(logouts).toBe(1);
  });

  it('does not refresh for errors other than 401', async () => {
    respond = () => ({ status: 403 });
    await expect(api.get('/a')).rejects.toBeInstanceOf(AxiosError);
    expect(refreshCalls()).toHaveLength(0);
    expect(logouts).toBe(0);
  });
});

describe('cross-tab sync', () => {
  it('ends this tab’s session when another tab signs out', () => {
    localStorage.removeItem('refreshToken');
    window.dispatchEvent(new StorageEvent('storage', { key: 'refreshToken', newValue: null, storageArea: localStorage }));

    expect(getTokens()).toEqual({ accessToken: null, refreshToken: null });
    expect(logouts).toBe(1);
  });

  it('picks up tokens another tab stored', () => {
    localStorage.setItem('accessToken', 'other-access');
    localStorage.setItem('refreshToken', 'other-refresh');
    window.dispatchEvent(new StorageEvent('storage', { key: 'refreshToken', newValue: 'other-refresh', storageArea: localStorage }));

    expect(getTokens()).toEqual({ accessToken: 'other-access', refreshToken: 'other-refresh' });
    expect(logouts).toBe(0);
  });
});
