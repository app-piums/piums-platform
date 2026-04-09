"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { sdk } from '@piums/sdk';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 min
const WARNING_BEFORE_MS = 5 * 60 * 1000;       // advertir 5 min antes
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;

interface User {
  id: string;
  nombre: string;
  email: string;
  role?: 'cliente' | 'artista';
  pais?: string;
  telefono?: string;
  token?: string;
  avatar?: string;
  ciudad?: string | null;
  birthDate?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  documentFrontUrl?: string | null;
  documentBackUrl?: string | null;
  documentSelfieUrl?: string | null;
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

  // Reiniciar timers con cualquier actividad del usuario
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
      // credentials: 'include' asegura que las cookies httpOnly se envíen
      // incluso cuando el Service Worker intercepta la solicitud.
      const response = await fetch("/api/auth/me", { credentials: 'include' });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);

        try {
          const tokenResponse = await fetch('/api/chat/token', { credentials: 'include' });
          if (tokenResponse.ok) {
            const { token } = await tokenResponse.json();
            if (token) {
              sdk.setAuthToken(token);
              if (typeof window !== 'undefined') {
                window.localStorage.setItem('token', token);
              }
            }
          }
          // Si chat/token falla, no limpiar el token — puede haber uno válido en localStorage desde el login
        } catch (tokenError) {
          console.warn('No se pudo sincronizar el token de chat para el SDK, usando el token existente si hay uno', tokenError);
        }
        
        // Asegurar que el SDK tenga el token del localStorage (puesto por el login)
        if (typeof window !== 'undefined') {
          const stored = window.localStorage.getItem('token');
          if (stored) {
            sdk.setAuthToken(stored);
          }
        }
      } else {
        setUser(null);
        sdk.setAuthToken(null);
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error("Error verificando autenticación:", error);
      setUser(null);
      sdk.setAuthToken(null);
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
