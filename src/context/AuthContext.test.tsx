import { act, render, screen } from '@testing-library/react';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { profileApi, saveSession } from '@/api';
import type { UserProfile } from '@/types';
import { AuthProvider } from './AuthContext';
import { useAuth } from './auth-context';

vi.mock('@/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api')>()),
  profileApi: { getMyProfile: vi.fn() },
}));

const getMyProfile = vi.mocked(profileApi.getMyProfile);

const profile = { id: 'u1', firstName: 'Mona', lastName: 'Ali', email: 'mona@example.com', role: 'Patient' } as UserProfile;

function httpError(status: number) {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  const response = { status, data: {}, statusText: '', headers: {}, config } as AxiosResponse;
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, response);
}

function storeSession() {
  saveSession({
    accessToken: 'access',
    refreshToken: 'refresh',
    expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    email: 'mona@example.com',
    fullName: 'Mona Ali',
    role: 'Patient',
  });
}

/** Prints the auth state so tests can read it */
function Probe() {
  const { isLoading, isAuthenticated, role, user, userName } = useAuth();
  if (isLoading) return <p>loading</p>;
  return <p>{isAuthenticated ? `signed in as ${role} ${userName}${user ? ' with profile' : ''}` : 'signed out'}</p>;
}

const renderAuth = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  getMyProfile.mockReset();
});

describe('AuthProvider session restore', () => {
  it('is signed out from the first render when no session is stored', () => {
    renderAuth();
    expect(screen.getByText('signed out')).toBeInTheDocument();
    expect(getMyProfile).not.toHaveBeenCalled();
  });

  it('restores a stored session with the profile', async () => {
    storeSession();
    getMyProfile.mockResolvedValue({ data: profile } as AxiosResponse<UserProfile>);
    renderAuth();

    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(await screen.findByText('signed in as Patient Mona Ali with profile')).toBeInTheDocument();
  });

  it('clears the session when the API rejects it (4xx)', async () => {
    storeSession();
    getMyProfile.mockRejectedValue(httpError(401));
    renderAuth();

    expect(await screen.findByText('signed out')).toBeInTheDocument();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('keeps the session when the server is down (5xx)', async () => {
    storeSession();
    getMyProfile.mockRejectedValue(httpError(503));
    renderAuth();

    expect(await screen.findByText('signed in as Patient Mona Ali')).toBeInTheDocument();
    expect(localStorage.getItem('refreshToken')).toBe('refresh');
  });

  it('follows a sign-in made in another tab', async () => {
    getMyProfile.mockResolvedValue({ data: profile } as AxiosResponse<UserProfile>);
    renderAuth();
    expect(screen.getByText('signed out')).toBeInTheDocument();

    storeSession();
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'userRole', newValue: 'Patient', storageArea: localStorage }));
    });

    expect(await screen.findByText('signed in as Patient Mona Ali with profile')).toBeInTheDocument();
  });
});
