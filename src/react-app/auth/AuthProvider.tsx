import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getBackendService, setClientJWT } from "@/react-app/lib/backend";
import type { BackendUser } from "@/react-app/lib/backend/types";

type AuthUser = BackendUser | null;

interface AuthContextValue {
  user: AuthUser;
  isPending: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getJwt: () => Promise<string | null>;
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

  const refreshUser = useCallback(async () => {
    if (!backend) {
      setUser(null);
      setIsPending(false);
      return;
    }
    try {
      const current = await backend.auth.getCurrentUser();
      // Ensure DB/Storage calls carry an Authorization header
      try {
        const jwt = await backend.auth.createJWT();
        setClientJWT(jwt.jwt || null);
      } catch {
        // Ignore JWT creation errors
      }
      setUser(current);
    } catch {
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
    if (!backend) return;
    await backend.auth.loginWithEmailPassword(email, password);
    await refreshUser();
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

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isPending,
    loginWithGoogle,
    loginWithEmailPassword,
    logout,
    refreshUser,
    getJwt,
  }), [user, isPending, loginWithGoogle, loginWithEmailPassword, logout, refreshUser, getJwt]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


