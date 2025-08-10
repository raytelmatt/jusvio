import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Client, Account, Models } from "appwrite";
import { setClientJWT } from "@/react-app/lib/appwrite";

type AuthUser = Models.User<Models.Preferences> | null;

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

function getEnv(name: string, fallback?: string): string {
  // Vite exposes env as import.meta.env.VITE_*
  const key = `VITE_${name}` as keyof ImportMetaEnv;
  const val = (import.meta as any).env?.[key];
  return (val as string) || fallback || "";
}

function createAppwriteClients() {
  const endpoint = getEnv("APPWRITE_ENDPOINT");
  const projectId = getEnv("APPWRITE_PROJECT_ID");
  if (!endpoint || !projectId) {
    // Allow rendering without crashing; auth will be disabled
    return { client: null as unknown as Client, account: null as unknown as Account };
  }
  const client = new Client().setEndpoint(endpoint).setProject(projectId);
  const account = new Account(client);
  return { client, account };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [{ account }] = useState(createAppwriteClients());
  const [user, setUser] = useState<AuthUser>(null);
  const [isPending, setIsPending] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    if (!account) {
      setUser(null);
      setIsPending(false);
      return;
    }
    try {
      const current = await account.get();
      // Ensure DB/Storage calls carry an Authorization header for Appwrite Cloud
      try {
        const jwt = await account.createJWT();
        setClientJWT(jwt.jwt || null);
      } catch {}
      setUser(current);
    } catch {
      setUser(null);
      setClientJWT(null);
    } finally {
      setIsPending(false);
    }
  }, [account]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const loginWithGoogle = useCallback(async () => {
    if (!account) return;
    const successUrl = window.location.origin + "/auth/callback";
    const failureUrl = window.location.origin + "/login";
    // This redirects the browser to the provider, then back
    await account.createOAuth2Session("google", successUrl, failureUrl);
  }, [account]);

  const loginWithEmailPassword = useCallback(async (email: string, password: string) => {
    if (!account) return;
    await account.createEmailSession(email, password);
    await refreshUser();
  }, [account, refreshUser]);

  const logout = useCallback(async () => {
    if (!account) return;
    try {
      await account.deleteSession("current");
    } finally {
      setUser(null);
      setClientJWT(null);
    }
  }, [account]);

  const getJwt = useCallback(async (): Promise<string | null> => {
    if (!account) return null;
    try {
      const jwt = await account.createJWT();
      return jwt.jwt || null;
    } catch {
      return null;
    }
  }, [account]);

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


