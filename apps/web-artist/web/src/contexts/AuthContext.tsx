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
      // Las cookies httpOnly se envían automáticamente
      const response = await fetch("/api/auth/me");
      
      if (response.ok) {
        const data = await response.json();
        let userData = data.user;

        // Si es artista, resolvemos su Profile ID para sincronización global (Chat, Reservas)
        if (userData && userData.role === 'artista') {
          console.log("[AUTH] Artista detectado, resolviendo Profile ID...", { authId: userData.id });
          try {
            const profileRes = await fetch("/api/artists/dashboard/me");
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              if (profileData.artist?.id) {
                console.log("[AUTH] Profile ID resuelto exitosamente:", profileData.artist.id);
                userData = {
                  ...userData,
                  authId: userData.id, // Guardamos el Auth ID original
                  id: profileData.artist.id // Usamos el Profile ID como principal
                };
              }
            } else {
              console.warn("[AUTH] No se pudo obtener el perfil del artista:", profileRes.status);
            }
          } catch (e) {
            console.error("[AUTH] Error al resolver perfil de artista:", e);
          }
        } else {
          console.log("[AUTH] Usuario autenticado:", userData?.email, "Role:", userData?.role);
        }

        setUser(userData);
      } else {
        console.log("[AUTH] No hay sesión activa");
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
