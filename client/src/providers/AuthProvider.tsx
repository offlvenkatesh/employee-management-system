import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { clearToken, getToken, setToken } from "../lib/tokenStore";
import type { Employee } from "../types";

interface AuthContextValue {
  user: Employee | null;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Employee | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  async function refreshMe() {
    const response = await api.get<{ user: Employee }>("/api/auth/me");
    setUser(response.user);
  }

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsBootstrapping(false);
      return;
    }

    refreshMe()
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setIsBootstrapping(false));
  }, []);

  async function login(email: string, password: string) {
    const response = await api.post<{ token: string; user: Employee }>("/api/auth/login", { email, password });
    setToken(response.token);
    setUser(response.user);
  }

  async function logout() {
    try {
      if (getToken()) await api.post<void>("/api/auth/logout");
    } finally {
      clearToken();
      setUser(null);
    }
  }

  const value = useMemo(
    () => ({ user, isBootstrapping, login, logout, refreshMe }),
    [user, isBootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
