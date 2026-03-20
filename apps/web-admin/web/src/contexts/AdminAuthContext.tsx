"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authApi, type AdminUser } from "@/lib/api";

interface AdminAuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthState | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const data = await authApi.me();
      if (data.user.role !== "admin") throw new Error("Not admin");
      setUser(data.user);
    } catch {
      setUser(null);
      sessionStorage.removeItem("admin_token");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    if (data.user.role !== "admin") {
      throw new Error("Acceso denegado: se requiere rol de administrador");
    }
    sessionStorage.setItem("admin_token", data.token);
    setUser(data.user);
    router.push("/dashboard");
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      sessionStorage.removeItem("admin_token");
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}
