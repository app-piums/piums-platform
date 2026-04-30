'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type FavoriteArtist = {
  id: string;
  favoriteId?: string; // ID del registro en la BD (necesario para DELETE)
  nombre: string;
  category?: string | null;
  cityId?: string | null;
  avatar?: string | null;
  coverPhoto?: string | null;
  rating?: number | null;
  startingPrice?: number | null;
  highlightedService?: string | null;
  savedAt: string;
};

type FavoritesContextValue = {
  favorites: FavoriteArtist[];
  isReady: boolean;
  isFavorite: (artistId: string) => boolean;
  toggleFavorite: (artist: Omit<FavoriteArtist, 'savedAt' | 'favoriteId'>) => void;
  removeFavorite: (artistId: string) => void;
  clearFavorites: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

const MAX_FAVORITES = 100;
const ANONYMOUS_KEY = 'piums:favorites:guest';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const storageKey = useMemo(() => (user?.id ? `piums:favorites:${user.id}` : ANONYMOUS_KEY), [user?.id]);
  const [favorites, setFavorites] = useState<FavoriteArtist[]>([]);
  const [isReady, setIsReady] = useState(false);
  const isAuthenticated = !!user?.id;
  // Evita persistir al localStorage mientras se carga desde la API
  const skipPersist = useRef(false);

  // Carga inicial: API si está autenticado, localStorage si es anónimo
  useEffect(() => {
    setIsReady(false);
    skipPersist.current = true;

    if (isAuthenticated) {
      fetch('/api/users/me/favorites?entityType=ARTIST&limit=100', { headers: getAuthHeaders() })
        .then((res) => res.ok ? res.json() : Promise.reject(res.status))
        .then(async (data: { favorites: { id: string; entityId: string; createdAt: string }[] }) => {
          const stored = readLocalStorage(storageKey);
          const storedMap = new Map(stored.map((f) => [f.id, f]));
          const apiIds = new Set(data.favorites.map((f) => f.entityId));

          const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const hasValidName = (f: FavoriteArtist) => f.nombre && !UUID_RE.test(f.nombre);

          // Para los que no tienen datos locales O tienen nombre corrupto (UUID), hace fetch del perfil
          const missingIds = data.favorites
            .filter((apiFav) => {
              const local = storedMap.get(apiFav.entityId);
              return !local || !hasValidName(local);
            })
            .map((apiFav) => apiFav.entityId);

          const fetchedArtists = new Map<string, Partial<FavoriteArtist>>();
          if (missingIds.length > 0) {
            await Promise.allSettled(
              missingIds.map((artistId) =>
                fetch(`/api/artists/${artistId}`)
                  .then((r) => r.ok ? r.json() : null)
                  .then((d) => {
                    if (d?.artist) {
                      const a = d.artist;
                      fetchedArtists.set(artistId, {
                        nombre: a.artistName || a.nombre || artistId,
                        avatar: a.avatar ?? null,
                        coverPhoto: a.coverPhoto ?? null,
                        category: a.category ?? null,
                        cityId: a.cityId ?? null,
                      });
                    }
                  })
              )
            );
          }

          const merged: FavoriteArtist[] = data.favorites.map((apiFav) => {
            const local = storedMap.get(apiFav.entityId);
            if (local) return { ...local, favoriteId: apiFav.id, savedAt: local.savedAt ?? apiFav.createdAt };
            const fetched = fetchedArtists.get(apiFav.entityId) ?? {};
            return { id: apiFav.entityId, favoriteId: apiFav.id, nombre: apiFav.entityId, savedAt: apiFav.createdAt, ...fetched };
          });

          // Limpia del localStorage entradas que ya no existen en la API
          const cleaned = stored.filter((f) => apiIds.has(f.id));
          if (cleaned.length !== stored.length) {
            writeLocalStorage(storageKey, merged);
          }

          setFavorites(merged);
        })
        .catch(() => {
          setFavorites(readLocalStorage(storageKey));
        })
        .finally(() => {
          skipPersist.current = false;
          setIsReady(true);
        });
    } else {
      setFavorites(readLocalStorage(storageKey));
      skipPersist.current = false;
      setIsReady(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, isAuthenticated]);

  // Persiste al localStorage en cada cambio (excepto durante la carga inicial)
  useEffect(() => {
    if (!isReady || skipPersist.current || typeof window === 'undefined') return;
    writeLocalStorage(storageKey, favorites);
  }, [favorites, storageKey, isReady]);

  const isFavorite = useCallback(
    (artistId: string) => favorites.some((fav) => fav.id === artistId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (artist: Omit<FavoriteArtist, 'savedAt' | 'favoriteId'>) => {
      const existing = favorites.find((fav) => fav.id === artist.id);

      if (existing) {
        // Quitar: actualiza UI optimistamente, luego llama API
        setFavorites((prev) => prev.filter((fav) => fav.id !== artist.id));

        if (isAuthenticated && existing.favoriteId) {
          fetch(`/api/users/me/favorites/${existing.favoriteId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
          }).catch(() => {
            // Revierte si falla
            setFavorites((prev) => [existing, ...prev]);
          });
        }
      } else {
        // Añadir: actualiza UI optimistamente, luego llama API
        const newFav: FavoriteArtist = { ...artist, savedAt: new Date().toISOString() };
        setFavorites((prev) => [newFav, ...prev].slice(0, MAX_FAVORITES));

        if (isAuthenticated) {
          fetch('/api/users/me/favorites', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ entityType: 'ARTIST', entityId: artist.id }),
          })
            .then((res) => res.ok ? res.json() : Promise.reject(res.status))
            .then((data: { favorite: { id: string } }) => {
              // Guarda el favoriteId devuelto por la API para futuros deletes
              setFavorites((prev) =>
                prev.map((fav) => fav.id === artist.id ? { ...fav, favoriteId: data.favorite.id } : fav)
              );
            })
            .catch(() => {
              // Revierte si falla
              setFavorites((prev) => prev.filter((fav) => fav.id !== artist.id));
            });
        }
      }
    },
    [favorites, isAuthenticated]
  );

  const removeFavorite = useCallback(
    (artistId: string) => {
      const existing = favorites.find((fav) => fav.id === artistId);
      if (!existing) return;

      setFavorites((prev) => prev.filter((fav) => fav.id !== artistId));

      if (isAuthenticated && existing.favoriteId) {
        fetch(`/api/users/me/favorites/${existing.favoriteId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }).catch(() => {
          setFavorites((prev) => [existing, ...prev]);
        });
      }
    },
    [favorites, isAuthenticated]
  );

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  const value = useMemo(
    () => ({ favorites, isReady, isFavorite, toggleFavorite, removeFavorite, clearFavorites }),
    [favorites, isReady, isFavorite, toggleFavorite, removeFavorite, clearFavorites]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites debe usarse dentro de FavoritesProvider');
  }
  return context;
}

function readLocalStorage(key: string): FavoriteArtist[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoriteArtist[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalStorage(key: string, data: FavoriteArtist[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // quota exceeded u otro error de storage — se ignora silenciosamente
  }
}
