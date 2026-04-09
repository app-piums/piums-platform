"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authApi, type AdminUser } from "@/lib/api";

/** Show a session-expiry warning this many ms before the JWT expires. */
const EXPIRY_WARNING_MS = 5 * 60 * 1000; // 5 min

/** Automatically log out after this much idle time. */
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 min

const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;

interface AdminAuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** UTC timestamp when the session JWT expires (null until logged in). */
  sessionExpiresAt: Date | null;
  /** True when < EXPIRY_WARNING_MS remains before token expiry. */
  sessionWarning: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Dismiss the warning and reset the inactivity clock. */
  extendSession: () => void;
}

const AdminAuthContext = createContext<AdminAuthState | null>(null);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function decodeJwtExpiry(token: string): Date | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp) return new Date(payload.exp * 1000);
  } catch {}
  return null;
}

function setSessionCookie(): void {
  // Session cookie (no Max-Age) — auto-cleared when the browser closes,
  // making it suitable for admin consoles where leaving a tab open is a risk.
  document.cookie = "admin_session=1; path=/; SameSite=Strict";
}

function clearSessionCookie(): void {
  document.cookie = "admin_session=; path=/; SameSite=Strict; Max-Age=0";
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);
  const [sessionWarning, setSessionWarning] = useState(false);

  const router = useRouter();
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (expiryTimer.current) clearTimeout(expiryTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    expiryTimer.current = null;
    warningTimer.current = null;
    inactivityTimer.current = null;
  }, []);

  const doLogout = useCallback(
    async (silent = false) => {
      clearTimers();
      if (!silent) {
        try {
          await authApi.logout();
        } catch {}
      }
      sessionStorage.removeItem("admin_token");
      clearSessionCookie();
      setUser(null);
      setSessionExpiresAt(null);
      setSessionWarning(false);
      router.push("/login");
    },
    [clearTimers, router]
  );

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      doLogout(true);
    }, INACTIVITY_TIMEOUT_MS);
  }, [doLogout]);

  const startSessionTimers = useCallback(
    (token: string) => {
      const expiry = decodeJwtExpiry(token);
      if (!expiry) return;

      setSessionExpiresAt(expiry);

      const msUntilExpiry = expiry.getTime() - Date.now();
      const msUntilWarning = msUntilExpiry - EXPIRY_WARNING_MS;

      if (msUntilWarning > 0) {
        warningTimer.current = setTimeout(() => setSessionWarning(true), msUntilWarning);
      } else if (msUntilExpiry > 0) {
        // Already inside the warning window
        setSessionWarning(true);
      }

      if (msUntilExpiry > 0) {
        expiryTimer.current = setTimeout(() => doLogout(true), msUntilExpiry);
      } else {
        // Token already expired
        doLogout(true);
      }
    },
    [doLogout]
  );

  // Bind activity events to reset the inactivity timer while logged in
  useEffect(() => {
    if (!user) return;
    const handler = () => resetInactivityTimer();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    resetInactivityTimer();
    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handler));
    };
  }, [user, resetInactivityTimer]);

  const checkAuth = useCallback(async () => {
    try {
      const data = await authApi.me();
      if (data.user.role !== "admin") throw new Error("Not admin");
      setUser(data.user);
      const token = sessionStorage.getItem("admin_token");
      if (token) startSessionTimers(token);
    } catch {
      setUser(null);
      sessionStorage.removeItem("admin_token");
      clearSessionCookie();
    } finally {
      setIsLoading(false);
    }
  }, [startSessionTimers]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    if (data.user.role !== "admin") {
      throw new Error("Acceso denegado: se requiere rol de administrador");
    }
    sessionStorage.setItem("admin_token", data.token);
    setSessionCookie();
    setUser(data.user);
    startSessionTimers(data.token);
    resetInactivityTimer();
    router.push("/dashboard");
  };

  const logout = async () => doLogout(false);

  const extendSession = useCallback(() => {
    // Dismiss the expiry warning and restart the inactivity clock.
    // The hard JWT-expiry timer continues unaffected.
    setSessionWarning(false);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        sessionExpiresAt,
        sessionWarning,
        login,
        logout,
        extendSession,
      }}
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
