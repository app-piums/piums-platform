'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type FavoriteArtist = {
  id: string;
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
  toggleFavorite: (artist: Omit<FavoriteArtist, 'savedAt'>) => void;
  removeFavorite: (artistId: string) => void;
  clearFavorites: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

const MAX_FAVORITES = 100;
const ANONYMOUS_KEY = 'piums:favorites:guest';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const storageKey = useMemo(() => (user?.id ? `piums:favorites:${user.id}` : ANONYMOUS_KEY), [user?.id]);
  const [favorites, setFavorites] = useState<FavoriteArtist[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsReady(false);
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as FavoriteArtist[];
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        } else {
          setFavorites([]);
        }
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.warn('No se pudo leer favoritos almacenados', error);
      setFavorites([]);
    } finally {
      setIsReady(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isReady || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(favorites));
    } catch (error) {
      console.warn('No se pudo guardar favoritos', error);
    }
  }, [favorites, storageKey, isReady]);

  const isFavorite = useCallback(
    (artistId: string) => favorites.some((fav) => fav.id === artistId),
    [favorites]
  );

  const toggleFavorite = useCallback((artist: Omit<FavoriteArtist, 'savedAt'>) => {
    setFavorites((prev) => {
      const exists = prev.findIndex((fav) => fav.id === artist.id);
      if (exists >= 0) {
        return prev.filter((fav) => fav.id !== artist.id);
      }

      const payload: FavoriteArtist = {
        ...artist,
        savedAt: new Date().toISOString(),
      };

      return [payload, ...prev].slice(0, MAX_FAVORITES);
    });
  }, []);

  const removeFavorite = useCallback((artistId: string) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== artistId));
  }, []);

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
