import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, AuthContextValue } from '@/types';
import { authApi } from '@/services/auth.service';
import { tokenStorage } from '@/lib/api';

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Try to restore session from stored tokens on mount */
  useEffect(() => {
    const stored = tokenStorage.getAccess();
    if (stored) {
      setAccessToken(stored);
      // Verify the token is still valid by fetching profile
      authApi
        .getProfile()
        .then((res) => {
          if (res.data.data?.user) setUser(res.data.data.user);
        })
        .catch(() => {
          // Token expired or invalid — clear everything
          tokenStorage.clearTokens();
          setAccessToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { user, accessToken, refreshToken } = res.data.data!;
    tokenStorage.setTokens(accessToken, refreshToken);
    setAccessToken(accessToken);
    setUser(user);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res = await authApi.register(email, password);
    const { user, accessToken, refreshToken } = res.data.data!;
    tokenStorage.setTokens(accessToken, refreshToken);
    setAccessToken(accessToken);
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefresh();
    if (refreshToken) {
      authApi.logout(refreshToken).catch(() => {}); // Best-effort
    }
    tokenStorage.clearTokens();
    setAccessToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


