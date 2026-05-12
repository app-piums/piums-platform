'use client';

import React, { useEffect } from 'react';
import { cImg } from '@/lib/cloudinaryImg';
import { PageHelpButton } from '@/components/PageHelpButton';
import Link from 'next/link';
import ClientSidebar from '@/components/ClientSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Loading } from '@/components/Loading';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function BookmarksPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { favorites, isReady, removeFavorite } = useFavorites();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) return <Loading fullScreen />;

  const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
    MUSICO:      ['#FF6B35', '#F59E0B'],
    DJ:          ['#FF6B35', '#C026D3'],
    FOTOGRAFO:   ['#F59E0B', '#1D4ED8'],
    VIDEOGRAFO:  ['#4F46E5', '#C026D3'],
    DISENADOR:   ['#F59E0B', '#10B981'],
    BAILARIN:    ['#FF6B35', '#EF4444'],
    ANIMADOR:    ['#F59E0B', '#FF6B35'],
    TATUADOR:    ['#1E1B4B', '#7C3AED'],
    MAQUILLADOR: ['#EC4899', '#9D174D'],
    PINTOR:      ['#0891B2', '#059669'],
    ESCULTOR:    ['#475569', '#1E293B'],
    ESCRITOR:    ['#4F46E5', '#F59E0B'],
    MAGO:        ['#7C3AED', '#4F46E5'],
    ACROBATA:    ['#FF6B35', '#F59E0B'],
  };
  const getCoverGradient = (category?: string | null) => {
    const [a, b] = CATEGORY_GRADIENTS[category ?? ''] ?? ['#FF6B35', '#F59E0B'];
    return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
  };

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <ClientSidebar userName={user?.nombre ?? 'Usuario'} />
        <PageHelpButton tourId="bookmarksTour" />

      <div className="flex-1 min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-8 py-4 flex items-center justify-between mt-14 lg:mt-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Favoritos</h1>
            <p className="text-sm text-gray-400">Artistas que has guardado</p>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8">
          {!isReady ? (
            <div className="flex flex-col items-center justify-center py-24 text-center text-gray-500">
              Cargando tus favoritos...
            </div>
          ) : favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-20 w-20 rounded-full bg-[#FF6B35]/10 flex items-center justify-center mb-6">
                <svg className="h-10 w-10 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Aún no tienes favoritos</h2>
              <p className="text-gray-500 mb-8 max-w-sm">
                Explora artistas y guarda los que más te gusten para encontrarlos fácilmente.
              </p>
              <Link
                href="/artists"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B35] text-white font-semibold rounded-xl hover:bg-[#e55d00] transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Explorar artistas
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {favorites.map((artist) => (
                <div key={artist.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                  <div className="relative h-48 overflow-hidden" style={{ background: getCoverGradient(artist.category) }}>
                    {artist.coverPhoto ? (
                      <img
                        src={cImg(artist.coverPhoto)}
                        alt={artist.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                          <span className="text-white font-black" style={{ fontSize: '7rem', lineHeight: 1, opacity: 0.12 }}>
                            {(artist.nombre?.[0] ?? '?').toUpperCase()}
                          </span>
                        </div>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFavorite(artist.id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-gray-600 hover:text-red-500 shadow"
                      aria-label="Quitar de favoritos"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{artist.nombre}</p>
                        {artist.category && (
                          <p className="text-sm text-gray-500">{artist.category}</p>
                        )}
                        {artist.cityId && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {artist.cityId}
                          </p>
                        )}
                      </div>
                      {artist.rating && (
                        <div className="flex items-center gap-1 text-sm text-amber-500 font-semibold">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {artist.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                    {artist.highlightedService && (
                      <p className="mt-2 text-xs text-gray-500">
                        Especialidad: <span className="font-semibold text-gray-700">{artist.highlightedService}</span>
                      </p>
                    )}
                    {formatCurrency(artist.startingPrice) && (
                      <p className="mt-2 text-sm font-semibold text-gray-900">
                        Desde {formatCurrency(artist.startingPrice)}
                      </p>
                    )}
                    <div className="mt-auto flex gap-2 pt-4">
                      <Link
                        href={`/artists/${artist.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-[#FF6B35] hover:text-[#FF6B35]"
                      >
                        Ver perfil
                      </Link>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFavorite(artist.id)}
                      >
                        Quitar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
