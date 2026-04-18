import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

const TOKEN_KEY = "willow-access-token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBooting, setIsBooting] = useState(true);

  const setToken = useCallback((token) => {
    if (!token) {
      window.localStorage.removeItem(TOKEN_KEY);
      return;
    }
    window.localStorage.setItem(TOKEN_KEY, token);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
  }, [setToken]);

  const refreshSession = useCallback(async () => {
    try {
      const response = await api.get("/user/me");
      setUser(response.data?.data || null);
      return response.data?.data || null;
    } catch (error) {
      clearSession();
      throw error;
    }
  }, [clearSession]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        await refreshSession();
      } catch {
        if (mounted) clearSession();
      } finally {
        if (mounted) setIsBooting(false);
      }
    };

    bootstrap();

    const onAuthExpired = () => {
      clearSession();
    };

    window.addEventListener("willow-auth-expired", onAuthExpired);
    return () => {
      mounted = false;
      window.removeEventListener("willow-auth-expired", onAuthExpired);
    };
  }, [clearSession, refreshSession]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBooting,
      refreshSession,
      clearSession,
      setToken,
    }),
    [user, isBooting, refreshSession, clearSession, setToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}
