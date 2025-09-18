import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getBackendService, setClientJWT } from "@/react-app/lib/backend";
import type { BackendUser } from "@/react-app/lib/backend/types";

type AuthUser = BackendUser | null;

interface AuthContextValue {
  user: AuthUser;
  isPending: boolean;
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getJwt: () => Promise<string | null>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function createBackendService() {
  try {
    return getBackendService();
  } catch (error) {
    console.error('Failed to initialize backend service:', error);
    // Return null to allow rendering without crashing; auth will be disabled
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [backend] = useState(createBackendService());
  const [user, setUser] = useState<AuthUser>(null);
  const [isPending, setIsPending] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    if (!backend) {
      setUser(null);
      setIsPending(false);
      setAuthError('Backend service unavailable');
      return;
    }
    
    try {
      setAuthError(null);
      const current = await backend.auth.getCurrentUser();
      
      // Ensure DB/Storage calls carry an Authorization header
      if (current) {
        try {
          const jwt = await backend.auth.createJWT();
          setClientJWT(jwt.jwt || null);
        } catch (jwtError) {
          console.warn('JWT creation failed:', jwtError);
          // Don't fail the entire auth flow for JWT issues
        }
      }
      
      setUser(current);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      console.error('Auth refresh error:', errorMessage);
      setAuthError(errorMessage);
      setUser(null);
      setClientJWT(null);
    } finally {
      setIsPending(false);
    }
  }, [backend]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const loginWithGoogle = useCallback(async () => {
    if (!backend) return;
    const successUrl = window.location.origin + "/auth/callback";
    const failureUrl = window.location.origin + "/login";
    // This redirects the browser to the provider, then back
    await backend.auth.loginWithGoogle(successUrl, failureUrl);
  }, [backend]);

  const loginWithEmailPassword = useCallback(async (email: string, password: string) => {
    if (!backend) {
      throw new Error('Authentication service not available');
    }
    
    setAuthError(null);
    
    try {
      await backend.auth.loginWithEmailPassword(email, password);
      await refreshUser();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthError(errorMessage);
      
      // Provide user-friendly error messages
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('auth/network-request-failed')) {
        userFriendlyMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (errorMessage.includes('auth/invalid-email')) {
        userFriendlyMessage = 'Please enter a valid email address.';
      } else if (errorMessage.includes('auth/user-not-found')) {
        userFriendlyMessage = 'No account found with this email address.';
      } else if (errorMessage.includes('auth/wrong-password')) {
        userFriendlyMessage = 'Incorrect password. Please try again.';
      } else if (errorMessage.includes('auth/too-many-requests')) {
        userFriendlyMessage = 'Too many failed attempts. Please try again later.';
      }
      
      throw new Error(userFriendlyMessage);
    }
  }, [backend, refreshUser]);

  const logout = useCallback(async () => {
    if (!backend) return;
    try {
      await backend.auth.logout();
    } finally {
      setUser(null);
      setClientJWT(null);
    }
  }, [backend]);

  const getJwt = useCallback(async (): Promise<string | null> => {
    if (!backend) return null;
    try {
      const jwt = await backend.auth.createJWT();
      return jwt.jwt || null;
    } catch {
      return null;
    }
  }, [backend]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isPending,
    authError,
    loginWithGoogle,
    loginWithEmailPassword,
    logout,
    refreshUser,
    getJwt,
    clearAuthError,
  }), [user, isPending, authError, loginWithGoogle, loginWithEmailPassword, logout, refreshUser, getJwt, clearAuthError]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


