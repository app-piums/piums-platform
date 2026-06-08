"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { sdk } from '@piums/sdk';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_BEFORE_MS = 5 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;

interface User {
  id: string;
  nombre: string;
  email: string;
  role?: 'cliente' | 'artista' | 'ambos';
  artistId?: string;
  authId?: string;
  pais?: string;
  telefono?: string;
  avatar?: string;
  ciudad?: string | null;
  birthDate?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  documentFrontUrl?: string | null;
  documentBackUrl?: string | null;
  documentSelfieUrl?: string | null;
  category?: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionWarning: boolean;
  sessionExpiresAt: Date | null;
  login: (user: User) => void;
  logout: () => void;
  extendSession: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);
  const router = useRouter();
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    warningTimer.current = null;
    logoutTimer.current = null;
  }, []);

  const doLogout = useCallback(async () => {
    clearTimers();
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    if (typeof window !== 'undefined') window.localStorage.removeItem('token');
    sdk.setAuthToken(null);
    setUser(null);
    setSessionWarning(false);
    setSessionExpiresAt(null);
    router.push("/login");
  }, [clearTimers, router]);

  const startInactivityTimers = useCallback(() => {
    clearTimers();
    setSessionWarning(false);
    setSessionExpiresAt(null);
    warningTimer.current = setTimeout(() => {
      setSessionExpiresAt(new Date(Date.now() + WARNING_BEFORE_MS));
      setSessionWarning(true);
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS);
    logoutTimer.current = setTimeout(() => doLogout(), INACTIVITY_TIMEOUT_MS);
  }, [clearTimers, doLogout]);

  const extendSession = useCallback(() => {
    setSessionWarning(false);
    setSessionExpiresAt(null);
    startInactivityTimers();
  }, [startInactivityTimers]);

  useEffect(() => {
    if (!user) return;
    const handler = () => startInactivityTimers();
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, handler, { passive: true }));
    startInactivityTimers();
    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, handler));
      clearTimers();
    };
  }, [user, startInactivityTimers, clearTimers]);

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Las cookies httpOnly se envían automáticamente
      const response = await fetch("/api/auth/me");

      if (response.ok) {
        const data = await response.json();
        // /api/auth/me ya enriquece el user: para artista, id=artistProfileId y authId=authUserId
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error verificando autenticación:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => doLogout();

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  const value: AuthState = {
    user,
    isAuthenticated: !!user,
    isLoading,
    sessionWarning,
    sessionExpiresAt,
    login,
    logout,
    extendSession,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider");
  }
  
  return context;
}
