'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { post, get, getApiError } from './api';
import type { User, RegisterRequest, ApiResponse, AuthResponse } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAgent: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  isAuthenticated: false,
  isAdmin: false,
  isAgent: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const response = await get<ApiResponse<User>>('/users/me');
      setUser(response.data);
    } catch {
      setUser(null);
      localStorage.removeItem('accessToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
    localStorage.setItem('accessToken', response.data.accessToken);
    setUser(response.data.user);
  }, []);

  const register = useCallback(async (registerData: RegisterRequest) => {
    const response = await post<ApiResponse<AuthResponse>>('/auth/register', registerData);
    localStorage.setItem('accessToken', response.data.accessToken);
    setUser(response.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await post('/auth/logout');
    } catch {
      // ignore errors - we clear local state anyway
    }
    localStorage.removeItem('accessToken');
    setUser(null);
    router.push('/');
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isAgent: user?.role === 'travel_agent' || user?.role === 'admin',
    }),
    [user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { getApiError };
