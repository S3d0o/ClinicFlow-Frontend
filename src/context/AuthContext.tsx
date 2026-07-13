import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserRole, LoginResponse, UserProfile } from '@/types';
import { authApi, profileApi, setTokens, clearTokens } from '@/api';

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  user: UserProfile | null;
  userName: string;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    user: null,
    userName: '',
    isLoading: true,
  });

  const initAuth = useCallback(async () => {
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedRole = localStorage.getItem('userRole') as UserRole | null;
    const storedName = localStorage.getItem('userName') || '';

    if (storedAccessToken && storedRefreshToken && storedRole) {
      setTokens({ accessToken: storedAccessToken, refreshToken: storedRefreshToken });
      try {
        const profileRes = await profileApi.getMyProfile();
        setState({
          isAuthenticated: true,
          role: storedRole,
          user: profileRes.data,
          userName: storedName,
          isLoading: false,
        });
      } catch {
        clearTokens();
        localStorage.clear();
        setState({ isAuthenticated: false, role: null, user: null, userName: '', isLoading: false });
      }
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    const handleLogout = () => {
      setState({ isAuthenticated: false, role: null, user: null, userName: '', isLoading: false });
      navigate('/login');
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [navigate]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const data: LoginResponse = res.data;

    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('expiresAt', data.expiresAt);
    localStorage.setItem('userRole', data.role);
    localStorage.setItem('userName', data.fullName);
    localStorage.setItem('userEmail', data.email);

    const profileRes = await profileApi.getMyProfile();
    setState({
      isAuthenticated: true,
      role: data.role,
      user: profileRes.data,
      userName: data.fullName,
      isLoading: false,
    });
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
    clearTokens();
    localStorage.clear();
    setState({ isAuthenticated: false, role: null, user: null, userName: '', isLoading: false });
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

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
