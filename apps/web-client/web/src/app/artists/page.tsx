'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { Loading } from '@/components/Loading';
import { ArtistCard } from '@/components/ArtistCard';
import { useInfiniteArtists, type ArtistsFilters } from '@/hooks/useInfiniteArtists';
import ClientSidebar from '@/components/ClientSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { LocationPermissionPrompt } from '@/components/LocationPermissionPrompt';

const CATEGORIES = [
  { value: '',          label: 'Todas las categorías' },
  { value: 'musica',    label: 'Música' },
  { value: 'fotografia', label: 'Fotografía' },
  { value: 'catering',  label: 'Catering' },
  { value: 'decoracion', label: 'Decoración' },
  { value: 'animacion', label: 'Animación' },
];

const CITIES = [
  { value: '',  label: 'Todas las ciudades' },
  { value: '1', label: 'Ciudad de México' },
  { value: '2', label: 'Guadalajara' },
  { value: '3', label: 'Monterrey' },
];

function ArtistsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('location') || '');
  const [clientCountry, setClientCountry] = useState<string>(
    () => (typeof window !== 'undefined' ? localStorage.getItem('client_country') ?? '' : '')
  );

  const handleCountryDetected = useCallback((country: string) => {
    const upper = country.toUpperCase();
    localStorage.setItem('client_country', upper);
    setClientCountry(upper);
  }, []);

  const filters: ArtistsFilters = {
    q: searchQuery || undefined,
    category: selectedCategory || undefined,
    cityId: selectedCity || undefined,
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteArtists(filters);

  const { ref: loadMoreRef, inView } = useInView({ threshold: 0, rootMargin: '100px' });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const updateURL = (params: { category?: string; location?: string; q?: string }) => {
    const urlParams = new URLSearchParams();
    const cat = params.category ?? selectedCategory;
    const loc = params.location ?? selectedCity;
    const q   = params.q ?? searchQuery;
    if (cat) urlParams.set('category', cat);
    if (loc) urlParams.set('location', loc);
    if (q)   urlParams.set('q', q);
    const qs = urlParams.toString();
    router.push(`/artists${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedCity('');
    router.push('/artists');
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); updateURL({}); };

  const hasActiveFilters = searchQuery || selectedCategory || selectedCity;
  const allArtists = data?.pages.flatMap(p => p.artists) ?? [];
  const totalArtists = data?.pages[0]?.total ?? 0;

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <ClientSidebar userName={user?.nombre ?? 'Usuario'} />
      <LocationPermissionPrompt onCountryDetected={handleCountryDetected} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="hidden lg:flex bg-white border-b border-gray-100 px-8 py-4 items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Explorar Artistas</h1>
            <p className="text-sm text-gray-400">Descubre profesionales talentosos para tu evento</p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <XIcon className="h-4 w-4" />
              Limpiar filtros
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 pt-20 lg:p-8 lg:pt-8">
          {/* Mobile title */}
          <div className="lg:hidden mb-4">
            <h1 className="text-xl font-bold text-gray-900">Explorar Artistas</h1>
            <p className="text-sm text-gray-400 mt-0.5">Encuentra el talento perfecto para tu evento</p>
          </div>

          {/* Filters */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar artista, categoría..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={e => { setSelectedCategory(e.target.value); updateURL({ category: e.target.value }); }}
                className="sm:w-44 px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition text-gray-700"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <select
                value={selectedCity}
                onChange={e => { setSelectedCity(e.target.value); updateURL({ location: e.target.value }); }}
                className="sm:w-44 px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition text-gray-700"
              >
                {CITIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#FF6A00] text-white text-sm font-semibold rounded-xl hover:bg-[#e05e00] transition-colors"
              >
                Buscar
              </button>
            </div>
          </form>

          {/* Count badge */}
          {!isLoading && totalArtists > 0 && (
            <p className="text-sm text-gray-500 font-medium mb-4">
              {totalArtists} {totalArtists === 1 ? 'artista encontrado' : 'artistas encontrados'}
            </p>
          )}

          {/* Results */}
          {isLoading && allArtists.length === 0 ? (
            <Loading />
          ) : isError ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3 text-center">
              <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <XIcon className="h-7 w-7 text-red-400" />
              </div>
              <p className="text-gray-700 font-medium">Error al cargar artistas</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-[#FF6A00] hover:underline font-medium"
              >
                Intentar de nuevo
              </button>
            </div>
          ) : allArtists.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center gap-3 text-center">
              <div className="h-14 w-14 rounded-2xl bg-orange-50 flex items-center justify-center">
                <SearchIcon className="h-7 w-7 text-[#FF6A00]" />
              </div>
              <p className="text-gray-700 font-medium">No se encontraron artistas</p>
              <p className="text-sm text-gray-400">Intenta ajustar los filtros de búsqueda</p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-[#FF6A00] hover:underline font-medium"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
                {allArtists.map(artist => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>

              {hasNextPage && (
                <div ref={loadMoreRef} className="flex justify-center py-8">
                  {isFetchingNextPage ? (
                    <div className="flex items-center gap-3 text-gray-500 text-sm">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-[#FF6A00]" />
                      Cargando más artistas...
                    </div>
                  ) : (
                    <button
                      onClick={() => fetchNextPage()}
                      className="px-8 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Cargar más
                    </button>
                  )}
                </div>
              )}

              {!hasNextPage && allArtists.length > 0 && (
                <p className="text-center text-sm text-gray-400 py-6">
                  Has visto todos los {totalArtists} artistas disponibles
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ArtistsPage() {
  return (
    <Suspense
      fallback={(
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <Loading />
        </div>
      )}
    >
      <ArtistsPageContent />
    </Suspense>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}
function XIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
}

