import { createContext, useContext } from 'react';
import type { UserRole, UserProfile } from '@/types';

// The context object and `useAuth` live here, and `AuthProvider` in AuthContext.tsx, so that
// file only exports components (react-refresh/only-export-components)

export interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  user: UserProfile | null;
  userName: string;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  /** Signs in and returns the user's role. */
  login: (email: string, password: string) => Promise<UserRole>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
