import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import type { UserRole, LoginResponse, UserProfile } from '@/types';
import { authApi, profileApi, setTokens, saveSession, clearSession } from '@/api';
import { AuthContext, type AuthState } from '@/context/auth-context';

const signedOut: AuthState = { isAuthenticated: false, role: null, user: null, userName: '', isLoading: false };

/** The session saved by `saveSession()`, if a complete one is stored */
const readStoredSession = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const role = localStorage.getItem('userRole') as UserRole | null;
  if (!accessToken || !refreshToken || !role) return null;
  return { accessToken, refreshToken, role, userName: localStorage.getItem('userName') || '' };
};

/**
 * Checks the stored session against the API and returns the auth state it gives, or null when no
 * session is stored. Only a 4xx clears the session; network errors and 5xx keep it.
 */
const restoreSession = async (): Promise<AuthState | null> => {
  const stored = readStoredSession();
  if (!stored) return null;

  setTokens({ accessToken: stored.accessToken, refreshToken: stored.refreshToken });
  try {
    const profileRes = await profileApi.getMyProfile();
    return { isAuthenticated: true, role: stored.role, user: profileRes.data, userName: stored.userName, isLoading: false };
  } catch (error) {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    if (status !== undefined && status >= 400 && status < 500) {
      clearSession();
      return signedOut;
    }
    // Server unreachable or 5xx: keep the session; the profile loads on a later request.
    return { isAuthenticated: true, role: stored.role, user: null, userName: stored.userName, isLoading: false };
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  // Only a stored session needs restoring; without one the user is signed out from the first render
  const [state, setState] = useState<AuthState>(() => ({ ...signedOut, isLoading: readStoredSession() !== null }));

  useEffect(() => {
    let active = true;
    restoreSession().then((next) => {
      if (active && next) setState(next);
    });
    return () => {
      active = false;
    };
  }, []);

  // Follow a sign-in made in another tab (sign-outs arrive as `auth:logout` from the API layer)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if ((e.key === 'userRole' || e.key === 'userEmail') && e.newValue) {
        restoreSession().then((next) => {
          if (next) setState(next);
        });
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      setState(signedOut);
      navigate('/login');
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [navigate]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const data: LoginResponse = res.data;

    saveSession(data);

    let user: UserProfile | null = null;
    try {
      user = (await profileApi.getMyProfile()).data;
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (status !== undefined && status >= 400 && status < 500) {
        // The account can't be used: don't leave a half-signed-in session behind
        clearSession();
        throw error;
      }
      // Server hiccup: the sign-in itself worked, so continue; the profile loads on a later request
    }
    setState({
      isAuthenticated: true,
      role: data.role,
      user,
      userName: data.fullName,
      isLoading: false,
    });
    return data.role;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await authApi.logout({ refreshToken });
      } catch {
        // ignore
      }
    }
    clearSession();
    setState(signedOut);
    navigate('/');
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await profileApi.getMyProfile();
      setState((s) => ({ ...s, user: res.data }));
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(() => ({ ...state, login, logout, refreshUser }), [state, login, logout, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
