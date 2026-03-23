"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { sdk } from '@piums/sdk';

interface User {
  id: string;
  nombre: string;
  email: string;
  role?: 'cliente' | 'artista';
  pais?: string;
  telefono?: string;
  token?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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
          } else {
            sdk.setAuthToken(null);
          }
        } catch (tokenError) {
          console.warn('No se pudo sincronizar el token para el SDK', tokenError);
          sdk.setAuthToken(null);
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

  const logout = async () => {
    try {
      // Llamar endpoint de logout para limpiar cookies
      await fetch("/api/auth/logout", { method: "POST" });
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('token');
      }
      sdk.setAuthToken(null);
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  const value: AuthState = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
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
